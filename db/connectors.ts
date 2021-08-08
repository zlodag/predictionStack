import {Pool} from "pg";
import {CaseInput} from '../generated/graphql';

const pool = new Pool({
  database: 'predictions',
});

// Query

export const getUser = (id: string) => pool
  .query('SELECT "id", "name", "created" FROM "user" WHERE "id"=$1', [
    id,
  ])
  .then(result => result.rows[0]);

export const getGroup = (id: string) => pool
  .query('SELECT "id", "name" FROM "group" WHERE "id"=$1', [
    id,
  ])
  .then(result => result.rows[0]);

export const getCase = (id: string) => pool
  .query('SELECT "id", "reference", "creator" AS "creatorId", "group" AS "groupId", "deadline" FROM "case" WHERE "id"=$1', [
    id,
  ])
  .then(result => result.rows[0]);

// export const getAllGroups = () => pool
//   .query('SELECT id, name FROM "group" ORDER BY id')
//   .then(result => result.rows);

export const getMembersOfGroup = (groupId: string) => pool
  .query('SELECT u."id", u."name", u."created" FROM "user" AS u INNER JOIN "user_group" AS x ON x."user"=u."id" AND x."group"=$1 ORDER BY u."id"', [
    groupId,
  ])
  .then(result => result.rows);

export const getGroupsForUser = (userId: string) => pool
  .query('SELECT g."id", g."name" FROM "group" AS g INNER JOIN "user_group" AS x ON x."group"=g."id" AND x."user"=$1 ORDER BY g."id"', [
    userId,
  ])
  .then(result => result.rows);


// Mutation

export const addUser = (name: string) => pool
  .query('INSERT INTO "user" ("name") VALUES ($1) RETURNING "id", "name", "created"', [
    name,
  ])
  .then(result => result.rows[0]);

export const addUserToGroup = (user_id: string, group_id: string) => pool
  .query('INSERT INTO "user_group" ("user", "group") VALUES($1, $2) RETURNING "user", "group"', [
    user_id,
    group_id
  ])
  .then(result => result.rows[0]);

export const addCase = (_case: CaseInput) => pool
  .query('INSERT INTO "case" ("reference", "creator", "group", "deadline") VALUES ($1, $2, $3, $4) RETURNING "id", "reference", "creator" AS "creatorId", "group" AS "groupId", "deadline"', [
    _case.reference,
    _case.creatorId,
    _case.groupId || null,
    _case.deadline,
  ])
  .then(result => result.rows[0]);
