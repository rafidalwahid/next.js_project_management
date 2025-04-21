/**
 * Script to fix Prisma migration dates
 * 
 * This script renames migration directories with future dates to use the current date.
 * Run with: node scripts/fix-migrations.js
 */

const fs = require('fs');
const path = require('path');

const MIGRATIONS_PATH = path.join(__dirname, '..', 'prisma', 'migrations');

// Function to format date as YYYYMMDDHHMMSS
function formatDate(date) {
  return date.toISOString()
    .replace(/[-:T.Z]/g, '')
    .substring(0, 14);
}

// Main function
async function fixMigrations() {
  console.log('Fixing migration dates...');
  
  // Check if migrations directory exists
  if (!fs.existsSync(MIGRATIONS_PATH)) {
    console.error('Migrations directory not found:', MIGRATIONS_PATH);
    return;
  }

  // List all migration directories
  const migrationDirs = fs.readdirSync(MIGRATIONS_PATH)
    .filter(dir => {
      // Filter directories that start with numbers (migration timestamps)
      return fs.statSync(path.join(MIGRATIONS_PATH, dir)).isDirectory() && 
             /^\d{14}_/.test(dir);
    })
    .sort(); // Sort them chronologically

  if (migrationDirs.length === 0) {
    console.log('No migrations found to fix.');
    return;
  }

  console.log(`Found ${migrationDirs.length} migrations.`);

  // Start with the current date minus a few minutes per migration
  let currentDate = new Date();
  
  // For each migration, create a new timestamp with 1 minute between migrations
  for (let i = 0; i < migrationDirs.length; i++) {
    const oldDir = migrationDirs[i];
    const oldPath = path.join(MIGRATIONS_PATH, oldDir);
    
    // Extract the migration name (without timestamp)
    const migrationName = oldDir.substring(15); // Skip the timestamp and underscore
    
    // Subtract i minutes from the current date
    const adjustedDate = new Date(currentDate);
    adjustedDate.setMinutes(currentDate.getMinutes() - (migrationDirs.length - i));
    
    // Format the new timestamp
    const newTimestamp = formatDate(adjustedDate);
    const newDir = `${newTimestamp}_${migrationName}`;
    const newPath = path.join(MIGRATIONS_PATH, newDir);
    
    // Skip if directory already uses current date format
    if (oldDir === newDir) {
      console.log(`Migration already using correct date format: ${oldDir}`);
      continue;
    }
    
    console.log(`Renaming: ${oldDir} -> ${newDir}`);
    
    try {
      fs.renameSync(oldPath, newPath);
      
      // Update the migration_lock.toml if needed
      const migrationSqlPath = path.join(newPath, 'migration.sql');
      if (fs.existsSync(migrationSqlPath)) {
        let sqlContent = fs.readFileSync(migrationSqlPath, 'utf8');
        
        // If the SQL contains references to the old timestamp, update them
        if (sqlContent.includes(oldDir.substring(0, 14))) {
          sqlContent = sqlContent.replace(
            new RegExp(oldDir.substring(0, 14), 'g'), 
            newTimestamp
          );
          fs.writeFileSync(migrationSqlPath, sqlContent);
        }
      }
    } catch (error) {
      console.error(`Error renaming migration ${oldDir}:`, error);
    }
  }

  console.log('Migration dates fixed successfully!');
}

// Run the main function
fixMigrations()
  .catch(error => {
    console.error('Error fixing migrations:', error);
    process.exit(1);
  }); 