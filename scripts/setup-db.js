// scripts/setup-db.js
require('dotenv').config();
const mysql = require('mysql2/promise');

async function main() {
  console.log('Setting up database...');

  // Extract database name from DATABASE_URL
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  // Parse the database URL to extract connection details
  const matches = dbUrl.match(/mysql:\/\/([^:]+):([^@]*)@([^:]+):(\d+)\/([^?]+)/);

  if (!matches) {
    console.error(
      'Invalid DATABASE_URL format. Expected: mysql://user:password@host:port/database'
    );
    process.exit(1);
  }

  const [, user, password, host, port, dbName] = matches;

  try {
    // Create connection to MySQL server (without database)
    const connection = await mysql.createConnection({
      host,
      port,
      user,
      password: password || undefined, // Handle empty password
    });

    console.log(`Connected to MySQL server at ${host}:${port}`);

    // Check if database exists
    const [rows] = await connection.execute(
      `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?`,
      [dbName]
    );

    if (rows.length > 0) {
      console.log(`Database '${dbName}' already exists`);
    } else {
      // Create database
      await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
      console.log(`Database '${dbName}' created successfully`);
    }

    // Close connection
    await connection.end();
    console.log('Database setup completed');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

main();
