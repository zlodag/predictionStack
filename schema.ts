import {GraphQLTimestamp} from 'graphql-scalars';
import {makeExecutableSchema} from '@graphql-tools/schema';
import {typeDefs} from './typeDefs';
import {Resolvers} from './generated/graphql';

import * as connectors from './db/connectors';

const resolvers : Resolvers = {
  Query: {
    // groups: connectors.getAllGroups,
    group: (_, {id}) => connectors.getGroup(id),
    user: (_, {id}) => connectors.getUser(id),
  },

  Mutation: {
    addUser: (_, {name}) => connectors.addUser(name),
    addUserToGroup: (_, {user, group}) => connectors.addUserToGroup(user, group),
  },

  User: {
    groups: user => connectors.getGroupsForUser(user.id),
  },

  Group: {
    members: group => connectors.getMembersOfGroup(group.id),
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
