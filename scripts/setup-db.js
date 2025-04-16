const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupDatabase() {
  // Extract database name from the DATABASE_URL
  const dbUrlRegex = /mysql:\/\/.*?@.*?:(.*?)\/(.*?)(\?|$)/;
  const match = process.env.DATABASE_URL.match(dbUrlRegex);
  
  if (!match) {
    console.error('Invalid DATABASE_URL format');
    process.exit(1);
  }
  
  const [, port, dbName] = match;
  
  try {
    // Connect to MySQL server without specifying a database
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: port || 3306,
      user: 'root',
      password: ''
    });
    
    console.log('Connected to MySQL server');
    
    // Create the database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`Database "${dbName}" created or already exists`);
    
    // Close the connection
    await connection.end();
    console.log('Database setup completed');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

setupDatabase(); 