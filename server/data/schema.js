import { gql } from 'apollo-server';

export const typeDefs = gql`
  # declare custom scalars
  scalar Date

  # input for creating messages
  input CreateMessageInput {
    groupId: Int!
    text: String!
  }

  # input for creating groups
  input CreateGroupInput {
    name: String!
    userIds: [Int!]
  }

  # input for updating groups
  input UpdateGroupInput {
    id: Int!
    name: String
    userIds: [Int!]
  }

  # input for signing in users
  input SigninUserInput {
    email: String!
    password: String!
    username: String
  }

  # input for updating users
  input UpdateUserInput {
    username: String
  }

  # input for relay cursor connections
  input ConnectionInput {
    first: Int
    after: String
    last: Int
    before: String
  }

  type MessageConnection {
    edges: [MessageEdge]
    pageInfo: PageInfo!
  }

  type MessageEdge {
    cursor: String!
    node: Message!
  }

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
  }
  
  type Category {
    id: Int! # unique id for the Category
    category: String # category of the Category
    tags: [Tag] # tags the category belongs to
  }
  
  type Tag {
    id: Int! # unique id for the Tag
    tag: String # tag of the Tag
    groups: [Group] # groups the tag belongs to
    category: Category # category the tag belongs to
  }
  
  type UserType {
    id: Int! # unique id for the UserType
    type: String # type of the UserType
  }

  # a group chat entity
  type Group {
    id: Int! # unique id for the group
    name: String # name of the group
    label: String # label of the group
    users: [User]! # users in the group
    tags: [Tag] # tags in the group
    userType: UserType # userType the group belongs to
    messages(messageConnection: ConnectionInput): MessageConnection # messages sent to the group
  }

  # a user -- keep type really simple for now
  type User {
    id: Int! # unique id for the user
    email: String! # we will also require a unique email per user
    username: String # this is the name we'll show other users
    messages: [Message] # messages sent by user
    groups: [Group] # groups the user belongs to
    friends: [User] # user's friends/contacts
    jwt: String # json web token for access
    userType: UserType # userType the user belongs to
  }

  # a message sent from a user to a group
  type Message {
    id: Int! # unique id for message
    to: Group! # group message was sent in
    from: User! # user who sent the message
    text: String! # message text
    createdAt: Date! # when message was created
  }

  # query for types
  type Query {
    # Return a user by their email or id
    user(email: String, id: Int): User

    # Return messages sent by a user via userId
    # Return messages sent to a group via groupId
    messages(groupId: Int, userId: Int): [Message]

    # Return a group by its id
    group(id: Int!): Group
    
    # Return a tag by its id
    tag: [Tag]
    
    # Return categories by its id
    category: [Category]
  }

  type Mutation {
    # send a message to a group
    createMessage(message: CreateMessageInput!): Message
    createGroup(group: CreateGroupInput!): Group
    deleteGroup(id: Int!): Group
    leaveGroup(id: Int!): Group # let user leave group
    updateGroup(group: UpdateGroupInput!): Group
    login(user: SigninUserInput!): User
    signup(user: SigninUserInput!): User
  }

  type Subscription {
    # Subscription fires on every message added
    # for any of the groups with one of these groupIds
    messageAdded(groupIds: [Int]): Message
    groupAdded(userId: Int): Group
  }
  
  schema {
    query: Query
    mutation: Mutation
    subscription: Subscription
  }
`;

export default typeDefs;
