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
      cases: [Case]!
      created: Timestamp!
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
      creatorId: ID!
      groupId: ID
      deadline: Timestamp!
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
  type Query {
    users: [User!]!
    user (id: ID!): User
    groups: [Group!]!
    group (id: ID!): Group
    case (id: ID!): Case
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
        case: CaseInput!
    ): Case!
  }
`;
