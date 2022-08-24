import mysql from "mysql-await"
import fs from "fs"
export const connection = mysql.createConnection(JSON.parse(fs.readFileSync('./conexaoConfig.json')));
connection.on(`error`, (err) => {
  console.error(`Connection error ${err.code}`);
});