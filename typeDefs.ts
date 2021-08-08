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
  type Case {
      id: ID!
      reference: String!
#      creator: User!
#      group: Group
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
  }
`;
