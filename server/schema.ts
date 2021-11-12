import {GraphQLTimestamp} from 'graphql-scalars';
import {makeExecutableSchema} from '@graphql-tools/schema';
import {typeDefs} from '../typeDefs';
import {Resolvers} from '../generated/graphql';
import {User} from './User';

import * as connectors from './connectors';

function restrictToCurrentUser(currentUser: any, requestedUser: any) {
  if (currentUser.id !== requestedUser.id) {
    throw Error(`${currentUser.name} (${currentUser.id}) tried to request ${requestedUser.name} (${requestedUser.id})`);
  }
}

const resolvers : Resolvers<User> = {
  Query: {
    // users: connectors.getUsers,
    user: (_, {id}) => connectors.getUser(id),
    group: (_, {id}) => connectors.getGroup(id),
    'case': (_, {id}, user) => connectors.checkUserIsOwnerOrMemberOfGroupForCase(user, id).then(() => connectors.getCase(id)),
  },

  Mutation: {
    addUser: (_, {username, password}) => connectors.addUser(username, password),
    addUserToGroup: (_, {user, group}) => connectors.addUserToGroup(user, group),
    addCase: (_, {caseInput}, currentUser) => connectors.addCase(currentUser.id, caseInput),
    addComment: (_, {caseId, text}, currentUser) => connectors.addComment(currentUser.id, caseId, text),
    addDiagnosis: (_, {caseId, prediction}, currentUser) => connectors.addDiagnosis(currentUser.id, caseId, prediction),
    addWager: (_, {diagnosisId, confidence}, currentUser) => connectors.addWager(currentUser.id, diagnosisId, confidence),
    changeGroup: (_, {caseId, newGroupId}, currentUser) => connectors.changeGroup(caseId, newGroupId, currentUser),
    changeDeadline: (_, {caseId, newDeadline}) => connectors.changeDeadline(caseId, newDeadline),
    judgeOutcome: (_, {diagnosisId, outcome}, currentUser) => connectors.judgeOutcome(diagnosisId, currentUser.id, outcome),
    importCases: (_, {cases}, currentUser) => connectors.importCases(currentUser.id, cases),
  },

  User: {
    groups: (user, _, currentUser) => {
      restrictToCurrentUser(currentUser, user);
      return connectors.getGroupsForUser(user.id);
    },
    score: (user, {adjusted}, currentUser) => {
      restrictToCurrentUser(currentUser, user);
      return connectors.getScore(user.id, adjusted);
    },
    scores: (user, _, currentUser) => {
      restrictToCurrentUser(currentUser, user);
      return connectors.getScores(user.id);
    },
    tags: (user, _, currentUser) => {
      restrictToCurrentUser(currentUser, user);
      return connectors.getTagsForUser(user.id);
    },
    events: (user, {limit}, currentUser) => {
      restrictToCurrentUser(currentUser, user);
      return connectors.getEvents(user.id, limit);
    },
    predictions: (user, {outcome}, currentUser) => {
      restrictToCurrentUser(currentUser, user);
      return connectors.getPredictions(user.id, outcome);
    },
    cases: (user, args, currentUser) => {
      restrictToCurrentUser(currentUser, user);
      return connectors.getCasesForUser(user.id, args);
    },
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

  Prediction: {
    outcome: prediction => prediction.outcome || null,
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
    tags: _case => connectors.getTagsForCase(_case.id),
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
