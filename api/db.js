const db = require('knex')({
    client: 'mysql',
    connection: {
      host : process.env.DB_HOST || "178.128.109.9",
      user : process.env.DB_USER || "test01",
      password : process.env.DB_PASS || "PlsDoNotShareThePass123@",
      database : process.env.DB_NAME || "entrance_test"
    }
  });

module.exports = db
