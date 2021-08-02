import {Pool} from "pg";

const pool = new Pool({
  database: 'predictions',
});

export const getAllGroups = () => pool
  .query('SELECT id, name FROM "group" ORDER BY id')
  .then(result => result.rows);

export const getMembersOfGroup = (groupId: number) => pool
  .query('SELECT u.id, u.name FROM "user" u INNER JOIN user_group x ON x.user=u.id AND x.group=$1 ORDER BY u.id', [groupId])
  .then(result => result.rows);

export const getGroupsForUser = (userId: number) => pool
  .query('SELECT g.id, g.name FROM "group" g INNER JOIN user_group x ON x.group=g.id AND x.user=$1 ORDER BY g.id', [userId])
  .then(result => result.rows);

export const getUser = (id: number) => pool
  .query('SELECT id, name, created FROM "user" WHERE id=$1', [id])
  .then(result => result.rows[0]);

export const addUser = (name: string) => pool
  .query('INSERT INTO "user" (name) VALUES ($1) RETURNING id, name, created', [name])
  .then(result => result.rows[0]);

