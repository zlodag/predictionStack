import express from 'express';
import {login} from './connectors';
import jwt from 'jsonwebtoken';
import bodyParser from 'body-parser';

export const router = express.Router();
router.use(bodyParser.json());

router.post("/login", async (req, res) => {
  const body = req.body;

  if (!(body.username && body.password)) {
    return res.status(400).send({ error: "Data not formatted properly" });
  }

  // createing a new mongoose doc from user data
  const user = await login(body.username, body.password);

  if (user) {
    const token = jwt.sign(
      user,
      'secret',
      {
        expiresIn: "2h",
      }
    );

    // save user token
    user.token = token;
    res.status(200).json(user);
  } else {
    res.status(400).send({ error: "Invalid credentials"});
  }
});
