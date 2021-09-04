import {GraphQLTimestamp} from 'graphql-scalars';
import {makeExecutableSchema} from '@graphql-tools/schema';
import {typeDefs} from '../typeDefs';
import {Resolvers} from '../generated/graphql';

import * as connectors from './connectors';

const resolvers : Resolvers = {
  Query: {
    users: connectors.getUsers,
    user: (_, {id}) => connectors.getUser(id),
    groups: (_, {userId}) => userId ? connectors.getGroupsForUser(userId) : connectors.getGroups(),
    group: (_, {id}) => connectors.getGroup(id),
    'case': (_, {id}) => connectors.getCase(id),
    events: (_, {userId, limit}) => connectors.getEvents(userId, limit),
  },

  Mutation: {
    addUser: (_, {name}) => connectors.addUser(name),
    addUserToGroup: (_, {user, group}) => connectors.addUserToGroup(user, group),
    addCase: (_, {caseInput}) => connectors.addCase(caseInput),
    addComment: (_, {creatorId, caseId, text}) => connectors.addComment(creatorId, caseId, text),
    addDiagnosis: (_, {creatorId, caseId, prediction}) => connectors.addDiagnosis(creatorId, caseId, prediction),
    addWager: (_, {creatorId, diagnosisId, confidence}) => connectors.addWager(creatorId, diagnosisId, confidence),
    changeGroup: (_, {caseId, newGroupId}) => {
      if (newGroupId === undefined) throw Error ("newGroupId cannot be undefined")
      return connectors.changeGroup(caseId, newGroupId)
    },
    changeDeadline: (_, {caseId, newDeadline}) => connectors.changeDeadline(caseId, newDeadline),
    judgeOutcome: (_, {diagnosisId, judgedById, outcome}) => connectors.judgeOutcome(diagnosisId, judgedById, outcome),
  },

  User: {
    groups: user => connectors.getGroupsForUser(user.id),
    cases: user => connectors.getCasesForUser(user.id),
    score: (user, {adjusted}) => connectors.getScore(user.id, adjusted),
    scores: user => connectors.getScores(user.id),
  },

  Event: {
    __resolveType: (obj, context, info) =>
      // @ts-ignore
      obj.confidence ? 'WagerActivity' :
      // @ts-ignore
      obj.outcome ? 'JudgementActivity' :
      // @ts-ignore
      (obj.comment != null) ? 'CommentActivity' :
      // @ts-ignore
      obj.groupId ? 'GroupCaseActivity' :
      'DeadlineEvent',
  },

  JudgementActivity : {
    outcome: judgement => judgement.outcome,
  },
  Score: {
    outcome: score => score.outcome,
  },

  Group: {
    members: group => connectors.getMembersOfGroup(group.id),
    cases: group => connectors.getCasesForGroup(group.id),
  },

  Case: {
    creator: _case => connectors.getUser(_case.creatorId),
    group: _case => _case.groupId ? connectors.getGroup(_case.groupId) : null,
    diagnoses: _case => connectors.getDiagnosesForCase(_case.id),
    comments: _case => connectors.getCommentsForCase(_case.id),
  },

  Diagnosis: {
    wagers: diagnosis => connectors.getWagersForDiagnosis(diagnosis.id),
    judgement: diagnosis => connectors.getJudgement(diagnosis.id),
  },

  Wager: {
    creator: wager => connectors.getUser(wager.creatorId),
  },

  Judgement: {
    judgedBy: judgement => connectors.getUser(judgement.judgedById),
    outcome: judgement => judgement.outcome,
  },

  Comment: {
    creator: comment => connectors.getUser(comment.creatorId),
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
