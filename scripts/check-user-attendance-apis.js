// scripts/check-user-attendance-apis.js
const prisma = require('../lib/prisma');
const fs = require('fs');

async function main() {
  console.log('=== API Endpoint Diagnostic Script ===');
  console.log('Checking user and attendance API endpoints...\n');

  try {
    // Get a sample user
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        lastLogin: true,
        createdAt: true,
      },
      take: 1,
    });

    if (users.length === 0) {
      console.error('No users found in the database!');
      return;
    }

    const user = users[0];
    console.log(`Testing with user: ${user.name || 'Unnamed'} (${user.email})`);
    console.log(`User ID: ${user.id}`);
    console.log(`Last Login in DB: ${user.lastLogin ? new Date(user.lastLogin).toISOString() : 'null'}`);
    console.log(`Created At: ${new Date(user.createdAt).toISOString()}\n`);

    // Check if lastLogin is null and update it if needed
    if (!user.lastLogin) {
      console.log('Last login is null, updating it for testing...');
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      // Fetch the updated user
      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { lastLogin: true },
      });

      console.log(`Updated Last Login: ${updatedUser.lastLogin ? new Date(updatedUser.lastLogin).toISOString() : 'null'}\n`);
    }

    // Check attendance records
    const attendanceRecords = await prisma.attendance.findMany({
      where: { userId: user.id },
      orderBy: { checkInTime: 'desc' },
      take: 5,
    });

    console.log(`Found ${attendanceRecords.length} attendance records for user`);
    if (attendanceRecords.length > 0) {
      console.log('Latest attendance record:');
      console.log(`  Check-in: ${new Date(attendanceRecords[0].checkInTime).toISOString()}`);
      console.log(`  Check-out: ${attendanceRecords[0].checkOutTime ? new Date(attendanceRecords[0].checkOutTime).toISOString() : 'null'}`);
      console.log(`  Total Hours: ${attendanceRecords[0].totalHours || 'null'}\n`);
    } else {
      console.log('No attendance records found.\n');
    }

    // Check user profile data structure
    console.log('Checking user profile data structure...');
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        attendanceRecords: {
          orderBy: { checkInTime: 'desc' },
          take: 1,
        },
      },
    });

    // Create a diagnostic report
    const diagnosticReport = {
      user: {
        id: user.id,
        lastLogin: user.lastLogin,
        lastLoginFormatted: user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'null',
      },
      attendanceRecords: attendanceRecords.map(record => ({
        id: record.id,
        checkInTime: record.checkInTime,
        checkOutTime: record.checkOutTime,
        totalHours: record.totalHours,
      })),
      userProfileStructure: {
        hasLastLogin: userProfile.lastLogin !== null && userProfile.lastLogin !== undefined,
        lastLoginValue: userProfile.lastLogin ? new Date(userProfile.lastLogin).toISOString() : 'null',
        lastLoginType: userProfile.lastLogin ? typeof userProfile.lastLogin : 'null',
        attendanceRecordsCount: userProfile.attendanceRecords.length,
      },
    };

    // Check formatDate function implementation
    console.log('Checking formatDate implementation...');
    const utilsPath = './lib/utils.ts';
    if (fs.existsSync(utilsPath)) {
      const utilsContent = fs.readFileSync(utilsPath, 'utf8');
      const hasFormatDate = utilsContent.includes('export function formatDate');

      diagnosticReport.formatDateFunction = {
        exists: hasFormatDate,
        implementationFound: hasFormatDate,
      };

      console.log(`formatDate function ${hasFormatDate ? 'found' : 'NOT FOUND'} in utils.ts`);
    } else {
      console.log('utils.ts file not found!');
      diagnosticReport.formatDateFunction = {
        exists: false,
        implementationFound: false,
      };
    }

    // Check user profile view component
    console.log('\nChecking user profile view component...');
    const profileViewPath = './components/profile/user-profile-view.tsx';
    if (fs.existsSync(profileViewPath)) {
      const profileViewContent = fs.readFileSync(profileViewPath, 'utf8');
      const importsFormatDate = profileViewContent.includes('import { formatDate }');
      const usesFormatDate = profileViewContent.includes('formatDate(profile.lastLogin)');

      diagnosticReport.profileViewComponent = {
        importsFormatDate,
        usesFormatDate,
        lastLoginImplementation: profileViewContent.match(/profile\.lastLogin[\s\S]*?formatDate\(profile\.lastLogin\)[\s\S]*?<\/span>/g) || [],
      };

      console.log(`Profile view component ${importsFormatDate ? 'imports' : 'does NOT import'} formatDate`);
      console.log(`Profile view component ${usesFormatDate ? 'uses' : 'does NOT use'} formatDate with profile.lastLogin`);
    } else {
      console.log('user-profile-view.tsx file not found!');
      diagnosticReport.profileViewComponent = {
        importsFormatDate: false,
        usesFormatDate: false,
      };
    }

    // Save diagnostic report to file
    const reportPath = './diagnostic-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(diagnosticReport, null, 2));
    console.log(`\nDiagnostic report saved to ${reportPath}`);

    console.log('\n=== Diagnostic Summary ===');
    console.log(`User lastLogin in DB: ${diagnosticReport.user.lastLoginFormatted}`);
    console.log(`formatDate function exists: ${diagnosticReport.formatDateFunction.exists}`);
    console.log(`Profile view imports formatDate: ${diagnosticReport.profileViewComponent.importsFormatDate}`);
    console.log(`Profile view uses formatDate: ${diagnosticReport.profileViewComponent.usesFormatDate}`);

    if (diagnosticReport.user.lastLogin &&
        diagnosticReport.formatDateFunction.exists &&
        diagnosticReport.profileViewComponent.importsFormatDate &&
        diagnosticReport.profileViewComponent.usesFormatDate) {
      console.log('\nAll components appear to be correctly set up. The issue might be with:');
      console.log('1. The date format conversion in formatDate');
      console.log('2. The profile data not being properly passed to the component');
      console.log('3. A caching issue in the frontend');
    } else {
      console.log('\nPotential issues detected:');
      if (!diagnosticReport.user.lastLogin) {
        console.log('- User lastLogin is not set in the database');
      }
      if (!diagnosticReport.formatDateFunction.exists) {
        console.log('- formatDate function is missing from utils.ts');
      }
      if (!diagnosticReport.profileViewComponent.importsFormatDate) {
        console.log('- Profile view component is not importing formatDate');
      }
      if (!diagnosticReport.profileViewComponent.usesFormatDate) {
        console.log('- Profile view component is not using formatDate with profile.lastLogin');
      }
    }

  } catch (error) {
    console.error('Error running diagnostic script:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
