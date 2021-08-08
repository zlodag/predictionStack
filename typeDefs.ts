// noinspection GraphQLUnresolvedReference

import gql from 'graphql-tag';

export const typeDefs = gql`
  scalar Timestamp
  type User  {
      id: ID!
      name: String!
      """
      the list of groups to which this user belongs
      """
      groups: [Group!]!
      created: Timestamp!
  }
  type Group {
      id: ID!
      name: String!
      members: [User!]!
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
#      diagnoses: [Diagnosis!]!
  }
#  type Diagnosis {
#      id: ID!
#      name: String!
#      wagers: [Wager!]!
#      judgement: Judgement
#  }
#  type Wager {
#      id: ID!
#      user: User!
#      confidence: Int!
#  }
#  type Judgement {
#      judgedBy: User!
#      timestamp: Timestamp!
#      outcome: Boolean!
#  }
  type Query {
    user (id: ID!): User
    group (id: ID!): Group
    case (id: ID!): Case
      #    groups: [Group!]!
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
