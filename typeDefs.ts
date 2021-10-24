// noinspection GraphQLUnresolvedReference

import gql from 'graphql-tag';

export const typeDefs = gql`
  # An object with a Globally Unique ID and a name
  interface NamedNode {
      # The ID of the object.
      id: ID!
      # The name of the object.
      name: String!
  }
  interface Event {
      caseId: ID!
      caseReference: String!
      timestamp: Timestamp!
  }
  interface Activity implements Event {
      caseId: ID!
      caseReference: String!
      timestamp: Timestamp!
      userId: ID!
      userName: String!
  }
  scalar Timestamp
  enum Outcome {
      RIGHT
      WRONG
      INDETERMINATE
  }
  type User implements NamedNode {
      id: ID!
      name: String!
      groups: [Group!]!
      cases: [Case!]!
      created: Timestamp!
      score (adjusted: Boolean!): Float
      scores: [Score!]!
  }
  type Group implements NamedNode {
      id: ID!
      name: String!
      members: [User!]!
      cases: [Case!]!
  }
  type Membership {
    user: ID!
    group: ID!
  }
  input CaseInput {
      reference: String!
      created: Timestamp
      creatorId: ID!
      groupId: ID
      deadline: Timestamp!
      predictions: [PredictionInput!]!
      comments: [CommentInput!]!
  }
  input CommentInput {
      text: String!
      timestamp: Timestamp
  }
  input PredictionInput {
      diagnosis: String!
      confidence: Int!
      outcome: Outcome
  }
  type Case {
      id: ID!
      reference: String!
      creatorId: ID!
      creator: User!
      groupId: ID
      group: Group
      deadline: Timestamp!
      diagnoses: [Diagnosis!]!
      comments: [Comment!]!
      tags: [String!]!
  }
  type Diagnosis {
      id: ID!
      name: String!
      wagers: [Wager!]!
      judgement: Judgement
  }
  type Wager {
      id: ID!
      creatorId: ID!
      creator: User!
      confidence: Int!
      timestamp: Timestamp!
  }
  type Judgement {
      judgedById: ID!
      judgedBy: User!
      timestamp: Timestamp!
      outcome: Outcome!
  }
  type Comment {
      creatorId: ID!
      creator: User!
      timestamp: Timestamp!
      text: String!
  }
  type Score {
      judged: Timestamp!
      caseId: ID!
      reference: String!
      diagnosis: String!
      confidence: Int!
      outcome: Outcome!
      brierScore: Float!
      averageBrierScore: Float!
      adjustedBrierScore: Float!
  }
  type WagerActivity implements Activity & Event {
      userId: ID!
      userName: String!
      caseId: ID!
      caseReference: String!
      diagnosis: String!
      confidence: Int!
      timestamp: Timestamp!
  }
  type JudgementActivity implements Activity & Event {
      userId: ID!
      userName: String!
      caseId: ID!
      caseReference: String!
      diagnosis: String!
      outcome: Outcome!
      timestamp: Timestamp!
  }
  type CommentActivity implements Activity & Event {
      userId: ID!
      userName: String!
      caseId: ID!
      caseReference: String!
      comment: String!
      timestamp: Timestamp!
  }
  type GroupCaseActivity implements Activity & Event {
      userId: ID!
      userName: String!
      caseId: ID!
      caseReference: String!
      groupId: ID!
      groupName: String!
      timestamp: Timestamp!
  }
  type DeadlineEvent implements Event {
      caseId: ID!
      caseReference: String!
      timestamp: Timestamp!
  }
  type Prediction {
      caseId: ID!
      caseReference: String!
      diagnosis: String!
      outcome: Outcome
      timestamp: Timestamp!
  }
  type Query {
    users: [User!]!
    user (id: ID!): User!
    groups (userId: ID): [Group!]!
    group (id: ID!): Group!
    case (id: ID!): Case!
    events (userId: ID!, limit: Int = 10): [Event!]!
    predictions (creatorId: ID!, outcome: Outcome): [Prediction!]!
  }
  
  type Mutation {
    addUser (
        name: String!
    ): User!
    addUserToGroup(
        user: ID!
        group: ID!
    ): Membership!
    addCase(
        caseInput: CaseInput!
    ): ID!
    addComment(
        creatorId: ID!
        caseId: ID!
        text: String!
    ): Comment!
    addDiagnosis(
        creatorId: ID!
        caseId: ID!
        prediction: PredictionInput!
    ): Diagnosis!
    addWager(
        creatorId: ID!
        diagnosisId: ID!
        confidence: Int!
    ): Wager!
    changeGroup(
        caseId: ID!
        newGroupId: ID
    ): Group
    changeDeadline(
        caseId: ID!
        newDeadline: Timestamp!
    ): Timestamp!
    judgeOutcome(
        diagnosisId: ID!
        judgedById: ID!
        outcome: Outcome!
    ) : Judgement!
    importCases(
        cases: [CaseInput!]!
    ): Int!
  }
`;
