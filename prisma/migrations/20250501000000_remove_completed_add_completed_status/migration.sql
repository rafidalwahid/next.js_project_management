-- AlterTable: Add isCompletedStatus to ProjectStatus
ALTER TABLE `project_status` ADD COLUMN `isCompletedStatus` BOOLEAN NOT NULL DEFAULT false;

-- Create a completed status for each project if it doesn't exist
-- This is a complex operation that requires multiple steps

-- Step 1: Create a temporary table to store project IDs that need a completed status
CREATE TEMPORARY TABLE IF NOT EXISTS temp_projects_needing_completed_status AS
SELECT DISTINCT p.id AS projectId
FROM project p
LEFT JOIN project_status ps ON p.id = ps.projectId AND ps.name = 'Completed'
WHERE ps.id IS NULL;

-- Step 2: Insert a 'Completed' status for each project that doesn't have one
INSERT INTO project_status (id, name, color, description, isDefault, isCompletedStatus, createdAt, updatedAt, `order`, projectId)
SELECT 
    CONCAT('cs_', UUID()) AS id,
    'Completed' AS name,
    '#4CAF50' AS color,
    'Tasks that have been completed' AS description,
    false AS isDefault,
    true AS isCompletedStatus,
    NOW() AS createdAt,
    NOW() AS updatedAt,
    9999 AS `order`,
    projectId
FROM temp_projects_needing_completed_status;

-- Step 3: Update existing 'Completed' statuses to have isCompletedStatus = true
UPDATE project_status
SET isCompletedStatus = true
WHERE name = 'Completed';

-- Step 4: For each task with completed = true, update its statusId to point to the 'Completed' status
UPDATE task t
JOIN project_status ps ON t.projectId = ps.projectId AND ps.name = 'Completed'
SET t.statusId = ps.id
WHERE t.completed = true;

-- Step 5: Remove the completed column from the task table
ALTER TABLE `task` DROP COLUMN `completed`;

-- Drop the temporary table
DROP TEMPORARY TABLE IF EXISTS temp_projects_needing_completed_status;
