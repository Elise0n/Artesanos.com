const mysql = require('mysql2');
require('dotenv').config();

//Creamos un pool de conexiones para eficiencia
const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

//Exportamos el pool para usar en otros módulos
module.exports = pool;
