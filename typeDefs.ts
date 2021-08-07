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
type Query {
  user (id: ID!): User
  groups: [Group!]!
}

type Mutation {
  addUser (
      # Name for the User item
      name: String!): User!
}
`;
