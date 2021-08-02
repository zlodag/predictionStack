import { addMocksToSchema } from '@graphql-tools/mock';
import { buildSchema} from 'graphql';
import {TimestampMock} from 'graphql-scalars';
import {typeDefs} from './typeDefs';
import casual from 'casual';

const mocks = {
  Int: casual.integer,
  Timestamp: TimestampMock,
  Group: () => ({
    name: casual.city,
  }),
  User: () => ({
    name: casual._name,
    groups: [...new Array(casual.integer(2,6))],
  }),
}

const preserveResolvers = false;

const schema = buildSchema(typeDefs);

export const schemaWithMocks = addMocksToSchema({
  schema,
  mocks,
  preserveResolvers,
});
