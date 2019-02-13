"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.clearTable = exports.deleteTable = exports.createTable = exports.executeStatement = exports.listTables = exports.clearDatabase = exports.deleteDatabase = exports.createDatabase = exports.listDatabases = exports.connect = undefined;

var _pg = require("pg");

const ERROR_DATABASE_NO_RESPOND = "Database connection failed";
const ERROR_HOST_NOT_FOUND = "Host not found";
const ERROR_AUTHORIZE_FAILED = "Incorrect user or password";

const parseError = error => {
  if (error.message.startsWith("connect ECONNREFUSED")) {
    return new Error(ERROR_DATABASE_NO_RESPOND);
  } else if (error.message.startsWith("getaddrinfo ENOTFOUND")) {
    return new Error(ERROR_HOST_NOT_FOUND);
  } else if (error.message.startsWith("password authentication failed")) {
    return new Error(ERROR_AUTHORIZE_FAILED);
  } else {
    return error;
  }
};

const query = async (connection, sql, callback = r => r) => {
  const client = new _pg.Client(connection);

  try {
    await client.connect();
    let results = true;

    if (sql) {
      results = callback((await client.query(sql)));
    }

    await client.end();

    return [null, results];
  } catch (error) {
    return [parseError(error), null];
  }
};

const execute = async (connection, sqlList, callback = r => r) => {
  const client = new _pg.Client(connection);

  try {
    await client.connect();

    try {
      await client.query("BEGIN");
      let results = true;

      if (sqlList.length > 0) {
        for (let i = 0; i < sqlList.length; i++) {
          results = await client.query(sqlList[i]);
        }

        results = callback(results);
      }

      await client.query("COMMIT");

      return [null, results];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      await client.end();
    }
  } catch (error) {
    return [parseError(error), null];
  }
};

const connect = exports.connect = async connection => await query(connection);

const listDatabases = exports.listDatabases = async connection => await query(connection, `SELECT * FROM pg_database WHERE datistemplate = FALSE AND datname != 'postgres'`, r => r && r.rows && r.rows.map(({ datname }) => datname));

const createDatabase = exports.createDatabase = async (connection, database) => await query(connection, `CREATE DATABASE "${database}"`);

const deleteDatabase = exports.deleteDatabase = async (connection, database) => await query(connection, `DROP DATABASE "${database}"`);

const clearDatabase = exports.clearDatabase = async (connection, database) => {
  const databaseConnection = Object.assign({}, connection, { database });
  let [error, tables] = await listTables(connection, database);

  if (tables) {
    return execute(databaseConnection, tables.map(table => `TRUNCATE TABLE "${table}"`));
  } else {
    return [error, null];
  }
};

const listTables = exports.listTables = async (connection, database) => {
  const databaseConnection = Object.assign({}, connection, { database });

  let [error, tables] = await query(databaseConnection, `SELECT * FROM pg_catalog.pg_tables WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema'`, r => r && r.rows && r.rows.map(({ tablename }) => tablename));

  if (error) {
    return [error, null];
  }

  let results = [];

  for (let i = 0; i < tables.length; i++) {
    let name = tables[i];
    let columns, count;

    [error, columns] = await query(databaseConnection, `SELECT column_name AS name FROM information_schema.columns WHERE table_name = '${name}'`, r => r && r.rows && r.rows.map(({ name }) => name));

    [error, count] = await query(databaseConnection, `SELECT COUNT(*) AS "count" FROM "${name}"`, r => r && r.rows && r.rows[0].count);

    if (error) {
      return [error, null];
    }

    results.push({ name, columns, count });
  }

  return [null, results];
};

const executeStatement = exports.executeStatement = async (connection, database, sql) => await query(Object.assign({}, connection, { database }), sql, r => r && r.rows);

const createTable = exports.createTable = async (connection, database, table) => await query(Object.assign({}, connection, { database }), `CREATE TABLE "${table}" (id INT NOT NULL, PRIMARY KEY (id))`);

const deleteTable = exports.deleteTable = async (connection, database, table) => await query(Object.assign({}, connection, { database }), `DROP TABLE "${table}"`);

const clearTable = exports.clearTable = async (connection, database, table) => await query(Object.assign({}, connection, { database }), `TRUNCATE TABLE "${table}"`);