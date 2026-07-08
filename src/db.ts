import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "admin@123456789",
  database: "invite",
});

export default pool;