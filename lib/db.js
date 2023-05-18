require('dotenv').config();
const mysql = require('mysql2');

const pool = mysql.createPool({
	connectionLimit:5,
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PSWD,
	database: process.env.DB_NAME,
	multipleStatements: true
  });

pool.getConnection(function (error) {
	if (!!error) {
		console.log(error);
	} else {
		console.log('Database Connected Successfully..!!');
	}
});

module.exports = pool;
