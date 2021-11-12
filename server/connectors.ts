import {Pool, PoolClient} from 'pg';
import {CaseInput, ImportedCaseInput, Maybe, Outcome, PredictionInput, Scalars, UserCasesArgs} from '../generated/graphql';
import {User} from './User';

const insertDiagnosisText = 'INSERT INTO "diagnosis" ("name", "case") VALUES (trim($1), $2)';
const insertWagerText = 'INSERT INTO "wager" ("creator", "confidence", "diagnosis") VALUES($1, $2, $3)';

const unauthorized = (user: User) => {
  // console.log(user);
  throw Error(`${user.name} (${user.id}) is not authorized to perform that action`);
}

const pool = new Pool({
  database: 'predictions',
});

// Auth

export const login = (username: string, password: string) : Promise<User|null> => {
  const queryText = 'SELECT "id", "name" FROM "user" WHERE "name" = lower(trim($1)) AND "password" = crypt($2, "password")';
  const values = [
    username,
    password,
  ];
  // console.log(queryText, values);
  return pool
    .query(queryText, values)
    .then(result => result.rows.length ? result.rows[0] : null);
};


export const checkUserIsOwnerOrMemberOfGroupForCase = (user: User, caseId: string) => {
  console.log("checkUserIsOwnerOrMemberOfGroupForCase", user, caseId);
  return pool.query('SELECT EXISTS(SELECT 1 FROM "case" LEFT JOIN "user_group" USING ("group") WHERE "case"."id"=$1 AND $2 IN ("case"."creator", "user_group"."user"))', [
    caseId,
    user.id,
  ]).then(result => {
    if (!result.rows[0].exists) unauthorized(user);
  });
}


// Query

export const getUsers = () => pool
  .query('SELECT "id", "name", "created" FROM "user" ORDER BY "name"')
  .then(result => result.rows);

export const getUser = (id: string) => pool
  .query('SELECT "id", "name", "created" FROM "user" WHERE "id"=$1', [
    id,
  ])
  .then(result => {
    if (result.rows.length == 0) throw Error('Invalid user ID: ' + id);
    return result.rows[0];
  });

export const getGroups = () => pool
  .query('SELECT "id", "name" FROM "group" ORDER BY "name"')
  .then(result => result.rows);

export const getGroup = (id: string) => pool
  .query('SELECT "id", "name" FROM "group" WHERE "id"=$1', [
    id,
  ])
  .then(result => {
    if (result.rows.length == 0) throw Error('Invalid group ID: ' + id);
    return result.rows[0];
  });

export const getCase = (id: string) => pool
  .query('SELECT "id", "reference", "creator" AS "creatorId", "group" AS "groupId", "deadline" FROM "case" WHERE "id"=$1', [
    id,
  ])
  .then(result => {
    if (result.rows.length == 0) throw Error('Invalid case ID: ' + id);
    return result.rows[0];
  });

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

export const getCasesForCreator = (creatorId: string) => pool
  .query('SELECT "id", "reference", "creator" AS "creatorId", "group" AS "groupId", "deadline" FROM "case" WHERE "creator"=$1 ORDER BY "deadline"', [
    creatorId,
  ])
  .then(result => result.rows);

export const getCasesForUser = (userId: string, args: UserCasesArgs ) =>
  pool.query(`
    SELECT DISTINCT
    "case"."id",
    "case"."reference",
    "case"."creator" AS "creatorId",
    "case"."group" AS "groupId",
    "case"."deadline" 
    FROM "case" 
    LEFT JOIN "user_group" USING ("group")
    LEFT JOIN "tag" ON "tag"."case" = "case"."id"
    WHERE (
      ($2 IS TRUE AND "case"."creator" = $1) OR
      ($2 IS FALSE AND "case"."creator" != $1 AND "user_group"."user" = $1) OR
      ($2 IS NULL AND ("case"."creator" = $1 OR "user_group"."user" = $1))
    ) AND (
      $3 = "tag"."text" OR $3 IS NULL
    )
    ORDER BY "deadline"
  `, [
    userId,
    args.creator,
    args.tag,
  ])
  .then(result => result.rows);


export const getCasesForGroup = (groupId: string) => pool
  .query('SELECT "id", "reference", "creator" AS "creatorId", "group" AS "groupId", "deadline" FROM "case" WHERE "group"=$1 ORDER BY "deadline"', [
    groupId,
  ])
  .then(result => result.rows);


export const getCasesForTag = (userId: string, tag: string) => pool
  .query('SELECT DISTINCT "case"."id", "case"."reference", "case"."creator" AS "creatorId", "case"."group" AS "groupId", "case"."deadline" FROM "case" LEFT JOIN "user_group" ON "case"."group" = "user_group"."group" INNER JOIN "tag" ON "tag"."case" = "case"."id" WHERE $1 IN ("case"."creator", "user_group"."user") AND "tag"."text" = $2 ORDER BY "deadline"', [
    userId,
    tag,
  ])
  .then(result => result.rows);

export const getDiagnosesForCase = (caseId: string) => pool
  .query('SELECT "id", "name" FROM "diagnosis" WHERE "case"=$1 ORDER BY "pk"', [
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

export const getTagsForCase = (caseId: string) => pool
  .query('SELECT "text" FROM "tag" WHERE "case"=$1 ORDER BY "text"', [
    caseId,
  ])
  .then(result => result.rows.map(row => row.text));

export const getTagsForUser = (userId: string) => pool
  .query('SELECT DISTINCT "tag"."text" FROM "case" LEFT JOIN "user_group" ON "case"."group" = "user_group"."group" INNER JOIN "tag" ON "tag"."case" = "case"."id" WHERE $1 IN ("case"."creator", "user_group"."user") ORDER BY "text"', [
    userId,
  ])
  .then(result => result.rows.map(row => row.text));

// Mutation

export const addUser = (username: string, password: string) => pool
  .query(`INSERT INTO "user" ("name", "password") VALUES (lower(trim($1)), crypt($2, gen_salt('bf', 8))) RETURNING "id", "name", "created"`, [
    username,
    password,
  ])
  .then(result => result.rows[0]);

export const addUserToGroup = (userId: string, groupId: string) => pool
  .query('INSERT INTO "user_group" ("user", "group") VALUES($1, $2) RETURNING "user", "group"', [
    userId,
    groupId,
  ])
  .then(result => result.rows[0]);

export const addCase = async (userId: string, _case: CaseInput) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (_case.predictions.length === 0) throw Error('Case must have at least 1 prediction');
    const insertCaseRes = await client.query('INSERT INTO "case" ("reference", "creator", "group", "deadline") VALUES (trim($1), $2, $3, $4) RETURNING "id"', [
      _case.reference,
      userId,
      _case.groupId || null,
      _case.deadline,
    ]);
    for (const prediction of _case.predictions) {
      const insertDiagnosisRes = await client.query(insertDiagnosisText + ' RETURNING "id"', [
        prediction.diagnosis,
        insertCaseRes.rows[0].id,
      ]);
      await client.query('INSERT INTO "wager" ("creator", "confidence", "diagnosis") VALUES ($1, $2, $3)', [
        userId,
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

export const importCases = async (userId: string, cases: ImportedCaseInput[]) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const _case of cases) {
      if (_case.predictions.length === 0) throw Error('Case must have at least 1 prediction');
      const insertCaseRes = await client.query('INSERT INTO "case" ("reference", "creator", "group", "deadline", "timestamp") VALUES (trim($1), $2, $3, $4, $5) RETURNING "id"', [
        _case.reference,
        userId,
        _case.groupId || null,
        _case.deadline,
        _case.created,
      ]);
      for (const prediction of _case.predictions) {
        const insertDiagnosisRes = await client.query(insertDiagnosisText + ' RETURNING "id"', [
          prediction.diagnosis,
          insertCaseRes.rows[0].id,
        ]);
        await client.query('INSERT INTO "wager" ("creator", "confidence", "diagnosis", "timestamp") VALUES ($1, $2, $3, $4)', [
          userId,
          prediction.confidence,
          insertDiagnosisRes.rows[0].id,
          _case.created,
        ]);
        if (prediction.outcome) {
          await client.query('INSERT INTO "judgement" ("diagnosisId", "judgedBy", "outcome", "timestamp") VALUES($1, $2, $3, $4)', [
            insertDiagnosisRes.rows[0].id,
            userId,
            prediction.outcome,
            _case.created,
          ]);
        }
      }
      for (const comment of _case.comments) {
        await client.query('INSERT INTO "comment" ("creator", "case", "text", "timestamp") VALUES($1, $2, trim($3), $4)', [
          userId,
          insertCaseRes.rows[0].id,
          comment.text,
          comment.timestamp,
        ])
      }
    }
    await client.query('COMMIT');
    return cases.length;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

export const addDiagnosis = async (userId: string, caseId: string, prediction: PredictionInput) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const insertDiagnosisRes = await client.query(insertDiagnosisText + ' RETURNING "id", "name"', [
      prediction.diagnosis,
      caseId,
    ]);
    await client.query(insertWagerText, [
      userId,
      prediction.confidence,
      insertDiagnosisRes.rows[0].id,
    ]);
    await client.query('COMMIT');
    return insertDiagnosisRes.rows[0];
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }

};


export const addComment = (userId: string, caseId: string, text: string) => pool
  .query('INSERT INTO "comment" ("creator", "case", "text") VALUES($1, $2, trim($3)) RETURNING "creator" as "creatorId", "timestamp", "text"', [
    userId,
    caseId,
    text,
  ])
  .then(result => result.rows[0]);

export const addWager = (userId: string, diagnosisId: string, confidence: number) => pool
  .query(insertWagerText + ' RETURNING "id", "creator" as "creatorId", "confidence", "timestamp"', [
    userId,
    confidence,
    diagnosisId,
  ])
  .then(result => result.rows[0]);


export const changeGroup = (caseId: string, newGroupId: string | null | undefined, user: User) => {
  if (newGroupId === undefined) throw Error ("newGroupId cannot be undefined");
  return pool.query('WITH "newGroup" AS (UPDATE "case" SET "group" = $1 WHERE "id" = $2 RETURNING "group" as "id") SELECT "id", "name" FROM "newGroup" JOIN "group" USING ("id")', [
    newGroupId,
    caseId,
  ])
  .then(result => result.rows.length ? result.rows[0] : null);
};

export const changeDeadline = (caseId: string, newDeadline: Scalars["Timestamp"]) => pool
  .query('UPDATE "case" SET "deadline" = $1 WHERE "id" = $2 RETURNING "deadline"', [
    newDeadline,
    caseId,
  ])
  .then(result => result.rows.length ? result.rows[0].deadline : null);

export const judgeOutcome = (diagnosisId: string, judgedById: string, outcome: Outcome) => pool
  .query('INSERT INTO "judgement" ("diagnosisId", "judgedBy", "outcome") VALUES($1, $2, $3) RETURNING "judgedBy" as "judgedById", "timestamp", "outcome"', [
    diagnosisId,
    judgedById,
    outcome,
  ])
  .then(result => result.rows[0]);

export const getScore = (userId: string, adjusted: boolean) => pool
  .query({name: 'get-score', text: `
      WITH "data" AS (
        SELECT
          ("confidence" / 100.0 - CASE "outcome" WHEN 'RIGHT' THEN 1 WHEN 'WRONG' THEN 0 ELSE NULL END) ^ 2 AS "score"
        FROM
          "wager"
          INNER JOIN "judgement" ON "wager"."diagnosis" = "judgement"."diagnosisId"
        WHERE "wager"."creator" = $1
      )
      SELECT
        avg("score") ${adjusted ? '+ 1 / sqrt(count("score"))' : ''} AS "score"
      FROM
        "data"
  `, values: [
    userId,
  ]})
  .then(result => result.rows[0].score);

export const getPredictions = (creatorId: string, outcome?: Maybe<Outcome>) => {
  let where = '';
  let params = [creatorId];
  if (outcome !== undefined) {
    where += ' AND "judgement"."outcome" ';
    if (outcome === null) {
      where += 'IS NULL';
    } else {
      params.push(outcome);
      where += ` = $${params.length}`;
    }
  }
  return pool
    .query(`
        SELECT "case"."id" as "caseId",
               "case"."reference" as "caseReference",
               "diagnosis"."name" as "diagnosis",
               "judgement"."outcome",
               "wager"."timestamp"
        FROM "case"
                 INNER JOIN "diagnosis" ON "diagnosis"."case" = "case"."id"
                 INNER JOIN "wager" ON "wager"."diagnosis" = "diagnosis"."id"
                 LEFT JOIN "judgement" ON "diagnosis"."id" = "judgement"."diagnosisId"
        WHERE "wager"."creator" = $1
        ${where}
        ORDER BY "wager"."timestamp" DESC
    `, params)
    .then(result => result.rows);
}


export const getScores = (userId: string) => pool
  .query({name: 'get-scores', text: `
      WITH "data" AS (
        SELECT
          "judgement"."timestamp",
          "judgement"."diagnosisId",
          "wager"."confidence",
          "judgement"."outcome",
          ("wager"."confidence" / 100.0 - CASE "outcome" WHEN 'RIGHT' THEN 1 WHEN 'WRONG' THEN 0 ELSE NULL END) ^ 2 AS "score"
        FROM
          "wager"
          INNER JOIN "judgement" ON "wager"."diagnosis" = "judgement"."diagnosisId"
        WHERE "wager"."creator" = $1 AND "judgement"."outcome" <> 'INDETERMINATE'
      )
      SELECT
        "data"."timestamp" AS "judged",
        "case"."id" AS "caseId",
        "case"."reference",
        "diagnosis"."name" AS "diagnosis",
        "data"."confidence",
        "data"."outcome",
        "data"."score" AS "brierScore",
        avg("score") over "w" AS "averageBrierScore",
        avg("score") over "w" + 1 / sqrt(count("score") over "w") AS "adjustedBrierScore"
      FROM
        "data"
        INNER JOIN "diagnosis" ON "data"."diagnosisId" = "diagnosis"."id"
        INNER JOIN "case" ON "diagnosis"."case" = "case"."id"
      WINDOW
        "w" AS (ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)
    `, values: [
      userId,
    ]})
  .then(result => result.rows);

export const getEvents = (userId: string, limit: number) => pool
  .query({name: 'get-activity', text: `
      WITH "interested" AS (
          SELECT DISTINCT
              "case"."id",
              "case"."reference",
              "case"."creator",
              "case"."deadline"
          FROM "case"
                   INNER JOIN "diagnosis" ON "diagnosis"."case" = "case"."id"
                   INNER JOIN "wager" ON "wager"."diagnosis" = "diagnosis"."id"
                   LEFT JOIN "judgement" ON "diagnosis"."id" = "judgement"."diagnosisId"
                   FULL OUTER JOIN "comment" ON "comment"."case" = "case"."id"
          WHERE $1 IN ("case"."creator", "wager"."creator", "judgement"."judgedBy", "comment"."creator")
      )
      SELECT
          "interested"."id" AS "caseId",
          "interested"."reference" AS "caseReference",
          "user"."id" AS "userId",
          "user"."name" AS "userName",
          CAST(NULL AS uuid) AS "groupId",
          NULL AS "groupName",
          "diagnosis"."name" AS "diagnosis",
          NULL AS "confidence",
          "judgement"."outcome",
          NULL AS "comment",
          "judgement"."timestamp"
      FROM "judgement"
               INNER JOIN "user" ON "judgement"."judgedBy" = "user"."id"
               INNER JOIN "diagnosis" ON "judgement"."diagnosisId" = "diagnosis"."id"
               INNER JOIN "interested" ON "diagnosis"."case" = "interested"."id"
      UNION ALL
      SELECT
          "interested"."id",
          "interested"."reference",
          "user"."id",
          "user"."name",
          NULL,
          NULL,
          "diagnosis"."name",
          "wager"."confidence",
          NULL,
          NULL,
          "wager"."timestamp"
      FROM "wager"
               INNER JOIN "user" ON "wager"."creator" = "user"."id"
               INNER JOIN "diagnosis" ON "wager"."diagnosis" = "diagnosis"."id"
               INNER JOIN "interested" ON "diagnosis"."case" = "interested"."id"
      UNION ALL
      SELECT
          "interested"."id",
          "interested"."reference",
          "user"."id",
          "user"."name",
          NULL,
          NULL,
          NULL,
          NULL,
          NULL,
          "comment"."text",
          "comment"."timestamp"
      FROM
          "comment"
              INNER JOIN "interested" ON "comment"."case" = "interested"."id"
              INNER JOIN "user" ON "interested"."creator" = "user"."id"
      UNION ALL
      SELECT
          "interested"."id",
          "interested"."reference",
          NULL,
          NULL,
          NULL,
          NULL,
          NULL,
          NULL,
          NULL,
          NULL,
          "interested"."deadline"
      FROM "interested"
      WHERE "interested"."deadline" < now()
      UNION ALL
      SELECT
          "case"."id",
          "case"."reference",
          "user"."id",
          "user"."name",
          "group"."id",
          "group"."name",
          NULL,
          NULL,
          NULL,
          NULL,
          "case"."timestamp"
      FROM "case"
               JOIN "user_group" USING ("group")
               JOIN "group" ON "case"."group" = "group"."id"
               JOIN "user" ON "case"."creator" = "user"."id"
               LEFT JOIN "interested" ON "case"."id" = "interested"."id"
      WHERE "interested"."id" IS NULL AND "user_group"."user" = $1
      ORDER BY "timestamp" DESC LIMIT $2
`, values: [
    userId,
    limit,
  ]}).then(result => result.rows);
