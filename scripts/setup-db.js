// scripts/setup-db.js
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function main() {
  console.log('Setting up database...');
  
  // Parse the DATABASE_URL to get the database name
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }
  
  // Extract database connection details from the URL
  // Format: mysql://username:password@host:port/database
  const dbUrlRegex = /mysql:\/\/([^:]+):([^@]*)@([^:]+):(\d+)\/([^?]+)/;
  const match = dbUrl.match(dbUrlRegex);
  
  if (!match) {
    console.error('Invalid DATABASE_URL format');
    process.exit(1);
  }
  
  const [, username, password, host, port, dbName] = match;
  
  try {
    // Create connection without database name
    const connection = await mysql.createConnection({
      host,
      port: parseInt(port, 10),
      user: username,
      password: password || undefined, // Handle empty password
    });
    
    console.log(`Checking if database '${dbName}' exists...`);
    
    // Check if database exists
    const [rows] = await connection.execute(
      `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?`,
      [dbName]
    );
    
    if (rows.length === 0) {
      console.log(`Database '${dbName}' does not exist. Creating...`);
      await connection.execute(`CREATE DATABASE \`${dbName}\``);
      console.log(`Database '${dbName}' created successfully!`);
    } else {
      console.log(`Database '${dbName}' already exists.`);
    }
    
    await connection.end();
    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
