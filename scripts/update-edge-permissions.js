// scripts/update-edge-permissions.js
// Script to update edge-permission-service.ts with current permission data from the database
/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-unused-vars */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

// Get the directory name using ES modules pattern
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function updateEdgePermissions() {
  try {
    // Get all roles with their permissions
    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    // Create a mapping of role names to permission names
    const rolePermissions = {};

    roles.forEach(role => {
      rolePermissions[role.name] = role.permissions.map(rp => rp.permission.name);
    });

    // Read the current edge-permission-service.ts file
    const filePath = path.join(process.cwd(), 'lib/permissions/edge-permission-service.ts');
    const fileContent = fs.readFileSync(filePath, 'utf8');

    // Find the ROLE_PERMISSIONS section
    const startMarker = 'private static readonly ROLE_PERMISSIONS: Record<string, string[]> = ';
    const startIndex = fileContent.indexOf(startMarker) + startMarker.length;

    // Find the end of the object (the closing brace)
    let endIndex = startIndex;
    let braceCount = 0;
    let inObject = false;

    for (let i = startIndex; i < fileContent.length; i++) {
      const char = fileContent[i];

      if (char === '{') {
        braceCount++;
        inObject = true;
      } else if (char === '}') {
        braceCount--;

        // If we've found the closing brace of the object
        if (inObject && braceCount === 0) {
          // Look for the next non-whitespace character
          let j = i + 1;
          while (j < fileContent.length && /\s/.test(fileContent[j])) {
            j++;
          }

          // If the next non-whitespace character is a semicolon, include it
          if (j < fileContent.length && fileContent[j] === ';') {
            endIndex = j + 1;
          } else {
            // Otherwise, just use the position after the closing brace
            endIndex = i + 1;
          }
          break;
        }
      }
    }

    // Replace the ROLE_PERMISSIONS object with the new data
    const newContent =
      fileContent.substring(0, startIndex) +
      JSON.stringify(rolePermissions, null, 2) +
      fileContent.substring(endIndex);

    // Write the updated file
    fs.writeFileSync(filePath, newContent);
  } catch (error) {
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updateEdgePermissions();
