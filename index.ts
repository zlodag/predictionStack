import express from 'express';
import {graphqlHTTP} from 'express-graphql';
import {schema} from './schema';

const app = express();

app.use('/graphql', graphqlHTTP({
  schema,
  graphiql: true,
}));

app.listen(3000, () => {
  console.log('The application started on http://localhost:3000/graphql');
});
