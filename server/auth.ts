import express from 'express';
import {login} from './connectors';
import jwt from 'jsonwebtoken';
import { User } from './User';

export const router = express.Router();

const refreshTokens = new Map<String, String>();

const generateAccessToken = (userId: string, username: string, secret: string) =>
  jwt.sign({id: userId, name: username}, secret, {
    expiresIn: "2h",
    // expiresIn: 5,
  });

const generateRefreshToken = (userId: string, username: string, secret: string) =>
  jwt.sign({id: userId, name: username}, secret);


router.post("/login", async (req, res) => {
  const body = req.body;
  if (process.env.SECRET === undefined || process.env.REFRESH_SECRET === undefined) {
    res.sendStatus(500);
  } else if (body.username && body.password) {
    const user = await login(body.username, body.password);
    if (user) {
      const accessToken = generateAccessToken(user.id, user.name, process.env.SECRET);
      const refreshToken = generateRefreshToken(user.id, user.name, process.env.REFRESH_SECRET);
      refreshTokens.set(user.id, refreshToken);
      res.status(200).json({user, accessToken, refreshToken});
    } else {
      res.status(400).send({error: "Invalid credentials"});
    }
  } else {
    res.status(400).send({error: "Data not formatted properly"});
  }
});
router.post("/refresh", (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.sendStatus(401);
  }  else if (process.env.REFRESH_SECRET === undefined) {
    return res.sendStatus(500);
  }

  jwt.verify(token, process.env.REFRESH_SECRET, (err: any, user: any) => {
    if (err) {
      return res.sendStatus(403);
    } else if (refreshTokens.get(user.id) !== token) {
      return res.sendStatus(403);
    } else if (process.env.SECRET === undefined || process.env.REFRESH_SECRET === undefined) {
      return res.sendStatus(500);
    }
    console.log('Refresh token accepted: ', token);
    console.log('Valid tokens: ', refreshTokens);
    const accessToken = generateAccessToken(user.id, user.name, process.env.SECRET);
    const refreshToken = generateRefreshToken(user.id, user.name, process.env.REFRESH_SECRET);
    refreshTokens.set(user.id, refreshToken);
    res.status(200).json({accessToken, refreshToken});
  });
});
router.post('/logout', (req, res) => {
  const { token } = req.body;
  refreshTokens.forEach((value, key) => {if (value === token) refreshTokens.delete(key)});
  res.send("Logout successful");
});

