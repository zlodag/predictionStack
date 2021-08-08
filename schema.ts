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
    'case': (_, {id}) => connectors.getCase(id),
  },

  Mutation: {
    addUser: (_, {name}) => connectors.addUser(name),
    addUserToGroup: (_, {user, group}) => connectors.addUserToGroup(user, group),
    addCase: (_, args) => connectors.addCase(args.case),
  },

  User: {
    groups: user => connectors.getGroupsForUser(user.id),
    cases: user => connectors.getCasesForUser(user.id),
  },

  Group: {
    members: group => connectors.getMembersOfGroup(group.id),
    cases: group => connectors.getCasesForGroup(group.id),
  },

  Case: {
    creator: _case => connectors.getUser(_case.creatorId),
    group: _case => _case.groupId ? connectors.getGroup(_case.groupId) : null,
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
