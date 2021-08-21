import {Pool} from 'pg';
import {CaseInput} from '../generated/graphql';

const pool = new Pool({
  database: 'predictions',
});

// Query

export const getUsers = () => pool
  .query('SELECT "id", "name", "created" FROM "user" ORDER BY "name"')
  .then(result => result.rows);

export const getUser = (id: string) => pool
  .query('SELECT "id", "name", "created" FROM "user" WHERE "id"=$1', [
    id,
  ])
  .then(result => result.rows[0]);

export const getGroups = () => pool
  .query('SELECT "id", "name" FROM "group" ORDER BY "name"')
  .then(result => result.rows);

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

export const getJudgement = (diagnosisId: string) => pool
  .query('SELECT "judgedBy" as "judgedById", "timestamp", "outcome" FROM "judgement" WHERE "diagnosisId"=$1', [
    diagnosisId,
  ])
  .then(result => result.rows.length ? result.rows[0] : null);

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

export const getCasesForUser = (userId: string) => pool
  .query('SELECT "id", "reference", "creator" AS "creatorId", "group" AS "groupId", "deadline" FROM "case" WHERE "creator"=$1 ORDER BY "deadline"', [
    userId,
  ])
  .then(result => result.rows);

export const getCasesForGroup = (groupId: string) => pool
  .query('SELECT "id", "reference", "creator" AS "creatorId", "group" AS "groupId", "deadline" FROM "case" WHERE "group"=$1 ORDER BY "deadline"', [
    groupId,
  ])
  .then(result => result.rows);

export const getDiagnosesForCase = (caseId: string) => pool
  .query('SELECT "id", "name" FROM "diagnosis" WHERE "case"=$1 ORDER BY "name"', [
    caseId,
  ])
  .then(result => result.rows);

export const getWagersForDiagnosis = (diagnosisId: string) => pool
  .query('SELECT "id", "creator" as "creatorId", "confidence", "timestamp" FROM "wager" WHERE "diagnosis"=$1 ORDER BY "timestamp"', [
    diagnosisId,
  ])
  .then(result => result.rows);

export const getCommentsForCase = (caseId: string) => pool
  .query('SELECT "creator" as "creatorId", "timestamp", "text" FROM "comment" WHERE "case"=$1 ORDER BY "timestamp"', [
    caseId,
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
    group_id,
  ])
  .then(result => result.rows[0]);

export const addCase = async (_case: CaseInput) => {
  if (_case.predictions.length === 0) throw Error('Case must have at least 1 prediction');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const insertCaseText = 'INSERT INTO "case" ("reference", "creator", "group", "deadline") VALUES ($1, $2, $3, $4) RETURNING "id"';
    const insertDiagnosisText = 'INSERT INTO "diagnosis" ("name", "case") VALUES ($1, $2) RETURNING "id"';
    const insertWagerText = 'INSERT INTO "wager" ("creator", "confidence", "diagnosis") VALUES($1, $2, $3)';
    const insertCaseRes = await client.query(insertCaseText, [
      _case.reference,
      _case.creatorId,
      _case.groupId || null,
      _case.deadline,
    ]);
    for (const prediction of _case.predictions) {
      const insertDiagnosisRes = await client.query(insertDiagnosisText, [
        prediction.diagnosis,
        insertCaseRes.rows[0].id,
      ]);
      await client.query(insertWagerText, [
        _case.creatorId,
        prediction.confidence,
        insertDiagnosisRes.rows[0].id,
      ]);
    }
    await client.query('COMMIT');
    return insertCaseRes.rows[0].id;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }

};
