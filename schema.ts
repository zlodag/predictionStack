import {IResolvers} from '@graphql-tools/utils';
import {GraphQLTimestamp} from 'graphql-scalars';
import {makeExecutableSchema} from '@graphql-tools/schema';
import {typeDefs} from './typeDefs';
import {
  getUser,
  getAllGroups,
  addUser,
  getGroupsForUser,
  getMembersOfGroup,
} from './db/connectors';

const resolvers : IResolvers = {
  Query: {
    groups: getAllGroups,
    user: (_, {id}) => getUser(id),
  },

  Mutation: {
    addUser: (_, {name}) => addUser(name),
  },

  User: {
    groups: user => getGroupsForUser(user.id),
  },

  Group: {
    members: group => getMembersOfGroup(group.id),
  },

  Timestamp: GraphQLTimestamp
};

export const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
    resolverValidationOptions: {
      requireResolversForArgs: "error",
      requireResolversForNonScalar: "error",
      requireResolversToMatchSchema: "error",
    },
  }
);
