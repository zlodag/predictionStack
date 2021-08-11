import express from 'express';
import {graphqlHTTP} from 'express-graphql';
import {schema} from './schema';
import path from 'path';

const app = express();

const port = 3000;

app.use('/graphql', graphqlHTTP({
  schema,
  graphiql: true,
}));

app.use((req, res) =>
  res.sendFile(path.join(__dirname, '/../generated/frontend.html'))
);

app.listen(port, () => {
  console.log('The application started on http://localhost:' + port + '/');
});
