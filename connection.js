const pgp = require('pg-promise')();

const connection = {
  host: 'trumpet.db.elephantsql.com',
  port: 5432, 
  database: 'plnccokg',
  user: 'plnccokg',
  password: 'PJJKQshscf9URoBdcb7a07zw_IckBSIL',
};

const db = pgp(connection);

module.exports = db;