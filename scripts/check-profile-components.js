// scripts/check-profile-components.js
const fs = require('fs');
const path = require('path');

function main() {
  console.log('=== Profile Components Diagnostic Script ===');
  
  const diagnosticReport = {
    formatDateFunction: {},
    profileViewComponent: {},
    userProfileHook: {},
    userQueriesFile: {},
  };

  // Check formatDate implementation
  console.log('\nChecking formatDate implementation...');
  const utilsPath = path.join(__dirname, '../lib/utils.ts');
  if (fs.existsSync(utilsPath)) {
    const utilsContent = fs.readFileSync(utilsPath, 'utf8');
    const hasFormatDate = utilsContent.includes('export function formatDate');
    const formatDateImplementation = utilsContent.match(/export function formatDate[\s\S]*?\}/);
    
    diagnosticReport.formatDateFunction = {
      exists: hasFormatDate,
      implementationFound: Boolean(formatDateImplementation),
      implementation: formatDateImplementation ? formatDateImplementation[0] : null,
    };
    
    console.log(`formatDate function ${hasFormatDate ? 'found' : 'NOT FOUND'} in utils.ts`);
    if (formatDateImplementation) {
      console.log('Implementation:');
      console.log(formatDateImplementation[0]);
    }
  } else {
    console.log('utils.ts file not found!');
    diagnosticReport.formatDateFunction = {
      exists: false,
      implementationFound: false,
    };
  }

  // Check user profile view component
  console.log('\nChecking user profile view component...');
  const profileViewPath = path.join(__dirname, '../components/profile/user-profile-view.tsx');
  if (fs.existsSync(profileViewPath)) {
    const profileViewContent = fs.readFileSync(profileViewPath, 'utf8');
    const importsFormatDate = profileViewContent.includes('import { formatDate }');
    const usesFormatDate = profileViewContent.includes('formatDate(profile.lastLogin)');
    
    // Extract the last login implementation
    const lastLoginImplementations = [];
    const regex = /profile\.lastLogin[\s\S]*?formatDate\(profile\.lastLogin\)[\s\S]*?<\/span>/g;
    let match;
    while ((match = regex.exec(profileViewContent)) !== null) {
      lastLoginImplementations.push(match[0]);
    }
    
    diagnosticReport.profileViewComponent = {
      importsFormatDate,
      usesFormatDate,
      lastLoginImplementations,
    };
    
    console.log(`Profile view component ${importsFormatDate ? 'imports' : 'does NOT import'} formatDate`);
    console.log(`Profile view component ${usesFormatDate ? 'uses' : 'does NOT use'} formatDate with profile.lastLogin`);
    
    if (lastLoginImplementations.length > 0) {
      console.log('Last login implementations found:');
      lastLoginImplementations.forEach((impl, i) => {
        console.log(`\nImplementation ${i + 1}:`);
        console.log(impl);
      });
    } else {
      console.log('No last login implementations found!');
    }
  } else {
    console.log('user-profile-view.tsx file not found!');
    diagnosticReport.profileViewComponent = {
      importsFormatDate: false,
      usesFormatDate: false,
    };
  }

  // Check user profile hook
  console.log('\nChecking user profile hook...');
  const userProfileHookPath = path.join(__dirname, '../hooks/use-user-profile.ts');
  if (fs.existsSync(userProfileHookPath)) {
    const hookContent = fs.readFileSync(userProfileHookPath, 'utf8');
    const includesLastLogin = hookContent.includes('lastLogin');
    
    diagnosticReport.userProfileHook = {
      exists: true,
      includesLastLogin,
    };
    
    console.log(`User profile hook ${includesLastLogin ? 'includes' : 'does NOT include'} lastLogin field`);
    
    if (includesLastLogin) {
      // Extract the relevant parts
      const lastLoginMatches = hookContent.match(/lastLogin[^;,}\n]*?[;,}]/g);
      if (lastLoginMatches && lastLoginMatches.length > 0) {
        console.log('Last login references:');
        lastLoginMatches.forEach(match => console.log(`  ${match.trim()}`));
      }
    }
  } else {
    console.log('use-user-profile.ts file not found!');
    diagnosticReport.userProfileHook = {
      exists: false,
      includesLastLogin: false,
    };
  }

  // Check user queries implementation
  console.log('\nChecking user queries implementation...');
  const userQueriesPath = path.join(__dirname, '../lib/queries/user-queries.ts');
  if (fs.existsSync(userQueriesPath)) {
    const queriesContent = fs.readFileSync(userQueriesPath, 'utf8');
    const includesLastLogin = queriesContent.includes('lastLogin');
    
    diagnosticReport.userQueriesFile = {
      exists: true,
      includesLastLogin,
    };
    
    console.log(`User queries file ${includesLastLogin ? 'includes' : 'does NOT include'} lastLogin field`);
    
    if (includesLastLogin) {
      // Extract the getUserProfile function
      const getUserProfileMatch = queriesContent.match(/export async function getUserProfile[\s\S]*?return {[\s\S]*?lastLogin[^;,}]*?[;,}]/);
      if (getUserProfileMatch) {
        console.log('\ngetUserProfile implementation (relevant part):');
        console.log(getUserProfileMatch[0]);
      }
    }
  } else {
    console.log('user-queries.ts file not found!');
    diagnosticReport.userQueriesFile = {
      exists: false,
      includesLastLogin: false,
    };
  }

  // Save diagnostic report to file
  const reportPath = path.join(__dirname, '../diagnostic-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(diagnosticReport, null, 2));
  console.log(`\nDiagnostic report saved to ${reportPath}`);

  console.log('\n=== Diagnostic Summary ===');
  console.log(`formatDate function exists: ${diagnosticReport.formatDateFunction.exists}`);
  console.log(`Profile view imports formatDate: ${diagnosticReport.profileViewComponent.importsFormatDate}`);
  console.log(`Profile view uses formatDate: ${diagnosticReport.profileViewComponent.usesFormatDate}`);
  console.log(`User profile hook includes lastLogin: ${diagnosticReport.userProfileHook.includesLastLogin}`);
  console.log(`User queries file includes lastLogin: ${diagnosticReport.userQueriesFile.includesLastLogin}`);
  
  if (diagnosticReport.formatDateFunction.exists && 
      diagnosticReport.profileViewComponent.importsFormatDate && 
      diagnosticReport.profileViewComponent.usesFormatDate &&
      diagnosticReport.userProfileHook.includesLastLogin &&
      diagnosticReport.userQueriesFile.includesLastLogin) {
    console.log('\nAll components appear to be correctly set up. The issue might be with:');
    console.log('1. The date format conversion in formatDate');
    console.log('2. The profile data not being properly passed to the component');
    console.log('3. A caching issue in the frontend');
  } else {
    console.log('\nPotential issues detected:');
    if (!diagnosticReport.formatDateFunction.exists) {
      console.log('- formatDate function is missing from utils.ts');
    }
    if (!diagnosticReport.profileViewComponent.importsFormatDate) {
      console.log('- Profile view component is not importing formatDate');
    }
    if (!diagnosticReport.profileViewComponent.usesFormatDate) {
      console.log('- Profile view component is not using formatDate with profile.lastLogin');
    }
    if (!diagnosticReport.userProfileHook.includesLastLogin) {
      console.log('- User profile hook is not handling lastLogin field');
    }
    if (!diagnosticReport.userQueriesFile.includesLastLogin) {
      console.log('- User queries file is not including lastLogin in the response');
    }
  }
}

main();
