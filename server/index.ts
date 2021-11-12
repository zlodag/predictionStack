import express from 'express';
import {graphqlHTTP} from 'express-graphql';
import {schema} from './schema';
import path from 'path';
import {router as auth} from './auth';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';
import {User} from './User';

const port = process.env.PORT;
const app = express();

app.set('view engine', 'pug')
app.use(express.static(path.join(__dirname, '/../public')))
app.use(bodyParser.json());
app.use('/api', (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (process.env.SECRET === undefined) {
    res.status(500).send({error: 'Internal server error'});
  } else if (authHeader) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.SECRET, (err, decoded) => {
      if (err) {
        res.status(403).send({error: err.message});
      } else if (decoded) {
        const user: User = {id: decoded.id, name: decoded.name};
        // @ts-ignore
        req.user = user;
        next();
      }
    });
  } else {
    next();
    // res.status(401).send({error: 'Unauthorized'});
  }
}, graphqlHTTP(req => ({
  schema,
  graphiql: true,
  // @ts-ignore
  context: req.user
})));
app.use('/auth', auth);
app.use((req, res) => {res.render('index');})

app.listen(port, () => {
  console.log('The application started on http://localhost:' + port + '/');
});
