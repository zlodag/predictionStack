// noinspection GraphQLUnresolvedReference

import gql from 'graphql-tag';

export const typeDefs = gql`
  interface NamedNode {
      id: ID!
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
      created: Timestamp!
      groups: [Group!]!
      cases (creator: Boolean, tag: String): [Case!]!
      predictions (outcome: Outcome): [Prediction!]!
      score (adjusted: Boolean!): Float
      scores: [Score!]!
      tags: [String!]!
      events (limit: Int = 10): [Event!]!
      library (creator: Boolean, specialty: String, viva: Boolean, preCall: Boolean): [LibraryCase!]!
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
      groupId: ID
      deadline: Timestamp!
      predictions: [PredictionInput!]!
  }
  input PredictionInput {
      diagnosis: String!
      confidence: Int!
  }
  input ImportedCaseInput {
      reference: String!
      created: Timestamp!
      groupId: ID
      deadline: Timestamp!
      predictions: [ImportedPredictionInput!]!
      comments: [ImportedCommentInput!]!
  }
  input ImportedPredictionInput {
      diagnosis: String!
      confidence: Int!
      outcome: Outcome
  }
  input ImportedCommentInput {
      text: String!
      timestamp: Timestamp!
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
      wagered: Timestamp!
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
  type LibraryCase {
      id: ID!
      created: Timestamp!
      creatorId: ID!
      creator: User!
      title: String!
      reference: String!
      viva: Boolean!
      preCall: Boolean!
      specialties: [String!]!
  }
  type Query {
    user (id: ID!): User!
    group (id: ID!): Group!
    case (id: ID!): Case!
    specialties: [String!]!
  }
  
  type Mutation {
    addUser (
        username: String!
        password: String!
    ): User!
    addUserToGroup(
        user: ID!
        group: ID!
    ): Membership!
    addCase(
        caseInput: CaseInput!
    ): ID!
    addComment(
        caseId: ID!
        text: String!
    ): Comment!
    addDiagnosis(
        caseId: ID!
        prediction: PredictionInput!
    ): Diagnosis!
    addWager(
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
        outcome: Outcome!
    ) : Judgement!
    importCases(
        cases: [ImportedCaseInput!]!
    ): Int!
  }
`;
