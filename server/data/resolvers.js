import GraphQLDate from 'graphql-date';
import { withFilter } from 'apollo-server';
import { map } from 'lodash';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { Group, Message, User } from './connectors';
import { pubsub } from '../subscriptions';
import { JWT_SECRET } from '../config';
import { groupLogic, messageLogic, userLogic, subscriptionLogic, tagLogic, categoryLogic } from './logic';

const MESSAGE_ADDED_TOPIC = 'messageAdded';
const GROUP_ADDED_TOPIC = 'groupAdded';

export const resolvers = {
  Date: GraphQLDate,
  PageInfo: {
    // we will have each connection supply its own hasNextPage/hasPreviousPage functions!
    hasNextPage(connection, args) {
      return connection.hasNextPage();
    },
    hasPreviousPage(connection, args) {
      return connection.hasPreviousPage();
    },
  },
  Query: {
    group(_, args, ctx) {
      return groupLogic.query(_, args, ctx);
    },
    user(_, args, ctx) {
      return userLogic.query(_, args, ctx);
    },
    tag(_, args, ctx) {
      return tagLogic.query(_, args, ctx);
    },
    category(_, args, ctx) {
      return categoryLogic.query(_, args, ctx);
    },
  },
  Mutation: {
    createMessage(_, args, ctx) {
      return messageLogic.createMessage(_, args, ctx)
        .then((message) => {
          // Publish subscription notification with message
          pubsub.publish(MESSAGE_ADDED_TOPIC, { [MESSAGE_ADDED_TOPIC]: message });
          return message;
        });
    },
    createGroup(_, args, ctx) {
      return groupLogic.createGroup(_, args, ctx).then((group) => {
        pubsub.publish(GROUP_ADDED_TOPIC, { [GROUP_ADDED_TOPIC]: group });
        return group;
      });
    },
    deleteGroup(_, args, ctx) {
      return groupLogic.deleteGroup(_, args, ctx);
    },
    leaveGroup(_, args, ctx) {
      return groupLogic.leaveGroup(_, args, ctx);
    },
    updateGroup(_, args, ctx) {
      return groupLogic.updateGroup(_, args, ctx);
    },
    login(_, signinUserInput, ctx) {
      // find user by email
      const { email, password } = signinUserInput.user;

      return User.findOne({ where: { email } }).then((user) => {
        if (user) {
          // validate password
          return bcrypt.compare(password, user.password).then((res) => {
            if (res) {
              // create jwt
              const token = jwt.sign({
                id: user.id,
                email: user.email,
                version: user.version,
              }, JWT_SECRET);
              user.jwt = token;
              ctx.user = Promise.resolve(user);
              return user;
            }

            return Promise.reject('password incorrect');
          });
        }

        return Promise.reject('email not found');
      });
    },
    signup(_, signinUserInput, ctx) {
      const { email, password, username } = signinUserInput.user;

      // find user by email
      return User.findOne({ where: { email } }).then((existing) => {
        if (!existing) {
          // hash password and create user
          return bcrypt.hash(password, 10).then(hash => User.create({
            email,
            password: hash,
            username: username || email,
            version: 1,
          })).then((user) => {
            const { id } = user;
            const token = jwt.sign({ id, email, version: 1 }, JWT_SECRET);
            user.jwt = token;
            ctx.user = Promise.resolve(user);
            return user;
          });
        }

        return Promise.reject('email already exists'); // email already exists
      });
    },
  },
  Subscription: {
    messageAdded: {
      subscribe: withFilter(
        (payload, args, ctx) => pubsub.asyncAuthIterator(
          MESSAGE_ADDED_TOPIC,
          subscriptionLogic.messageAdded(payload, args, ctx),
        ),
        (payload, args, ctx) => {
          return ctx.user.then((user) => {
            return Boolean(
              args.groupIds &&
              ~args.groupIds.indexOf(payload.messageAdded.groupId) &&
              user.id !== payload.messageAdded.userId, // don't send to user creating message
            );
          });
        },
      ),
    },
    groupAdded: {
      subscribe: withFilter(
        (payload, args, ctx) => pubsub.asyncAuthIterator(
          GROUP_ADDED_TOPIC,
          subscriptionLogic.groupAdded(payload, args, ctx),
        ),
        (payload, args, ctx) => {
          return ctx.user.then((user) => {
            return Boolean(
              args.userId &&
              ~map(payload.groupAdded.users, 'id').indexOf(args.userId) &&
              user.id !== payload.groupAdded.users[0].id, // don't send to user creating group
            );
          });
        },
      ),
    },
  },
  Group: {
    users(group, args, ctx) {
      return groupLogic.users(group, args, ctx);
    },
    tags(group, args, ctx) {
      return groupLogic.tags(group, args, ctx);
    },
    messages(group, args, ctx) {
      return groupLogic.messages(group, args, ctx);
    },
    userType(group, args, ctx) {
      return groupLogic.userType(group, args, ctx);
    },
  },
  Message: {
    to(message, args, ctx) {
      return messageLogic.to(message, args, ctx);
    },
    from(message, args, ctx) {
      return messageLogic.from(message, args, ctx);
    },
  },
  User: {
    email(user, args, ctx) {
      return userLogic.email(user, args, ctx);
    },
    friends(user, args, ctx) {
      return userLogic.friends(user, args, ctx);
    },
    groups(user, args, ctx) {
      return userLogic.groups(user, args, ctx);
    },
    jwt(user, args, ctx) {
      return userLogic.jwt(user, args, ctx);
    },
    messages(user, args, ctx) {
      return userLogic.messages(user, args, ctx);
    },
    userType(user, args, ctx) {
      return userLogic.userType(user, args, ctx);
    },
  },
  Tag: {
    groups(tag, args, ctx) {
      return tagLogic.groups(tag, args, ctx);
    },
    category(tag, args, ctx) {
      return tagLogic.category(tag, args, ctx);
    },
  },
  Category: {
    tags(category, args, ctx) {
      return categoryLogic.tags(category, args, ctx);
    },
  },
};

export default resolvers;
