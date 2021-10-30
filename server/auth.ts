import express from 'express';
import {login} from './connectors';
import jwt from 'jsonwebtoken';

export const router = express.Router();

router.post("/login", async (req, res) => {
  const body = req.body;
  if (process.env.SECRET === undefined) {
    res.sendStatus(500);
  } else if (body.username && body.password) {
    const user = await login(body.username, body.password);
    if (user) {
      const token = jwt.sign(user, process.env.SECRET, {
        expiresIn: "2h",
      });
      res.status(200).json({user, token});
    } else {
      res.status(400).send({error: "Invalid credentials"});
    }
  } else {
    res.status(400).send({error: "Data not formatted properly"});
  }
});
