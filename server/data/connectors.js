import { _ } from 'lodash';
import Sequelize from 'sequelize';
import bcrypt from 'bcrypt';

// initialize our database
const db = new Sequelize('chatty', 'chatty', 'chatty', {
  dialect: 'postgres',
  logging: false, // mark this true if you want to see logs
});

// define groups
const GroupModel = db.define('group', {
  name: { type: Sequelize.STRING },
  label: { type: Sequelize.STRING },
});

// define messages
const MessageModel = db.define('message', {
  text: { type: Sequelize.STRING },
});

// define users
const UserModel = db.define('user', {
  email: { type: Sequelize.STRING },
  username: { type: Sequelize.STRING },
  password: { type: Sequelize.STRING },
  version: { type: Sequelize.INTEGER }, // version the password
});

// define userTypes
const UserTypeModel = db.define('userType', {
  type: { type: Sequelize.STRING },
});

// define categories
const CategoryModel = db.define('category', {
  category: { type: Sequelize.STRING },
});

// define tags
const TagModel = db.define('tag', {
  tag: { type: Sequelize.STRING },
});

// users belong to multiple groups
UserModel.belongsToMany(GroupModel, { through: 'GroupUser' });

// users belong to multiple users as friends
UserModel.belongsToMany(UserModel, { through: 'Friends', as: 'friends' });

// messages are sent from users
MessageModel.belongsTo(UserModel);

// messages are sent to groups
MessageModel.belongsTo(GroupModel);

// groups have multiple users
GroupModel.belongsToMany(UserModel, { through: 'GroupUser' });

// users belong to userTypes
UserModel.belongsTo(UserTypeModel);

// tags belong to categories
TagModel.belongsTo(CategoryModel);

// groups belong to userTypes
GroupModel.belongsTo(UserTypeModel);

// tags belong to multiple groups
GroupModel.belongsToMany(TagModel, { through: 'GroupTag' });

// groups have multiple tags
TagModel.belongsToMany(GroupModel, { through: 'GroupTag' });

// you don't need to stare at this code too hard
// just trust that it fakes a bunch of groups, users, and messages
db.sync({ force: true }).then(() => {
  CategoryModel.create({
    category: 'coltura',
  }).then((category) => {
    const tags = ['vite', 'frutta', 'ortaggi', 'cereali', 'olivo', 'leguminose', 'industriali', 'altro'];
    _.forEach(tags, (tag) => {
      TagModel.create({
        categoryId: category.id,
        tag,
      });
    });
  });

  CategoryModel.create({
    category: 'tipo',
  }).then((category) => {
    const tags = ['produzione', 'trasformazione', 'certificazione', 'altro'];
    _.forEach(tags, (tag) => {
      TagModel.create({
        categoryId: category.id,
        tag,
      });
    });
  });

  CategoryModel.create({
    category: 'genere',
  }).then((category) => {
    const tags = ['p colturale', 'suolo', 'infestanti', 'difesa', 'altro'];
    _.forEach(tags, (tag) => {
      TagModel.create({
        categoryId: category.id,
        tag,
      });
    });
  });

  CategoryModel.create({
    category: 'motivo',
  }).then((category) => {
    const tags = ['agronomico', 'commerciale', 'qualità', 'gestionale', 'processo', 'prodotto', 'altro'];
    _.forEach(tags, (tag) => {
      TagModel.create({
        categoryId: category.id,
        tag,
      });
    });
  });

  const userTypes = ['admin', 'operator_a', 'operator_b', 'customer_a', 'customer_b'];
  return _.map(userTypes, (type) => {
    return UserTypeModel.create({
      type,
    });
  });
}).then((userTypesPromises) => {
  return Promise.all(userTypesPromises).then(() => {
    const groupPromises = [];
    let groupPromise;
    groupPromise = UserTypeModel.findOne({ where: { type: 'customer_a' } }).then((userType) => {
      GroupModel.create({
        name: 'Group A',
        label: 'BV',
        userTypeId: userType.id,
      });
    });
    groupPromises.push(groupPromise);

    groupPromise = UserTypeModel.findOne({ where: { type: 'customer_b' } }).then((userType) => {
      GroupModel.create({
        name: 'Group B',
        label: 'CE',
        userTypeId: userType.id,
      });
    });
    groupPromises.push(groupPromise);

    return groupPromises;
  });
}).then((groupPromises) => {
  return Promise.all(groupPromises).then(() => {
    const userPromises = [];
    let userPromise;
    userPromise = UserTypeModel.findOne({ where: { type: 'admin' } }).then((userType) => {
      return bcrypt.hash('test123', 10).then(hash => UserModel.create({
        email: 'marco@dreamup.it',
        username: 'marco',
        password: hash,
        version: 1,
        groupId: null,
        userTypeId: userType.id,
      }).then((user) => {
        console.log(
          '{email, username, password}',
          `{${user.email}, ${user.username}, test123}`,
        );
        return user;
      }));
    });
    userPromises.push(userPromise);

    userPromise = UserTypeModel.findOne({ where: { type: 'customer_a' } }).then((userType) => {
      return GroupModel.findOne({ where: { name: 'Group A' } }).then((group) => {
        return bcrypt.hash('customer_a', 10).then(hash => group.createUser({
          email: 'customer_a@dreamup.it',
          username: 'customer_a',
          password: hash,
          version: 1,
          userTypeId: userType.id,
        }).then((user) => {
          console.log(
            '{email, username, password}',
            `{${user.email}, ${user.username}, customer_a}`,
          );
          return user;
        }));
      });
    });
    userPromises.push(userPromise);

    userPromise = UserTypeModel.findOne({ where: { type: 'customer_b' } }).then((userType) => {
      return GroupModel.findOne({ where: { name: 'Group B' } }).then((group) => {
        return bcrypt.hash('customer_b', 10).then(hash => group.createUser({
          email: 'customer_b@dreamup.it',
          username: 'customer_b',
          password: hash,
          version: 1,
          userTypeId: userType.id,
        }).then((user) => {
          console.log(
            '{email, username, password}',
            `{${user.email}, ${user.username}, customer_b}`,
          );
          return user;
        }));
      });
    });
    userPromises.push(userPromise);

    userPromise = UserTypeModel.findOne({ where: { type: 'operator_a' } }).then((userType) => {
      return GroupModel.findOne({ where: { name: 'Group A' } }).then((group) => {
        return bcrypt.hash('operator_a', 10).then(hash => group.createUser({
          email: 'operator_a@dreamup.it',
          username: 'operator_a',
          password: hash,
          version: 1,
          userTypeId: userType.id,
        }).then((user) => {
          console.log(
            '{email, username, password}',
            `{${user.email}, ${user.username}, operator_a}`,
          );
          return user;
        }));
      });
    });
    userPromises.push(userPromise);

    userPromise = UserTypeModel.findOne({ where: { type: 'operator_b' } }).then((userType) => {
      return GroupModel.findOne({ where: { name: 'Group B' } }).then((group) => {
        return bcrypt.hash('operator_b', 10).then(hash => group.createUser({
          email: 'operator_b@dreamup.it',
          username: 'operator_b',
          password: hash,
          version: 1,
          groupId: group.id,
          userTypeId: userType.id,
        }).then((user) => {
          console.log(
            '{email, username, password}',
            `{${user.email}, ${user.username}, operator_b}`,
          );
          return user;
        }));
      });
    });
    userPromises.push(userPromise);
    return userPromises;
  });
}).then((userPromises) => {
  Promise.all(userPromises).then(() => {
    const customerAPromise = UserTypeModel.findOne({ where: { type: 'customer_a' } }).then((userType) => {
      return UserModel.findAll({ where: { userTypeId: userType.id } }).then(users => users);
    });

    const operatorAPromise = UserTypeModel.findOne({ where: { type: 'operator_a' } }).then((userType) => {
      return UserModel.findAll({ where: { userTypeId: userType.id } }).then(users => users);
    });
    return [customerAPromise, operatorAPromise];
  }).then((friendPromises) => {
    Promise.all(friendPromises).then((friends) => {
      const customerUsers = friends[0];
      const operatorUsers = friends[1];
      _.each(customerUsers, (current) => {
        _.each(operatorUsers, (user) => {
          current.addFriend(user);
        });
      });
    });
  });

  Promise.all(userPromises).then(() => {
    const customerBPromise = UserTypeModel.findOne({ where: { type: 'customer_b' } }).then((userType) => {
      return UserModel.findAll({ where: { userTypeId: userType.id } }).then(users => users);
    });

    const operatorBPromise = UserTypeModel.findOne({ where: { type: 'operator_b' } }).then((userType) => {
      return UserModel.findAll({ where: { userTypeId: userType.id } }).then(users => users);
    });
    return [customerBPromise, operatorBPromise];
  }).then((friendPromises) => {
    Promise.all(friendPromises).then((friends) => {
      const customerUsers = friends[0];
      const operatorUsers = friends[1];
      _.each(customerUsers, (current) => {
        _.each(operatorUsers, (user) => {
          current.addFriend(user);
        });
      });
    });
  });
});

const Group = db.models.group;
const Message = db.models.message;
const User = db.models.user;
const UserType = db.models.userType;
const Tag = db.models.tag;
const Category = db.models.category;

export { Group, Message, User, UserType, Tag, Category };
