// scripts/debug-last-login.js
const fs = require('fs');
const path = require('path');

function main() {
  console.log('=== Last Login Debug Script ===');
  
  // Check if the formatDate function is correctly implemented
  const utilsPath = path.join(__dirname, '../lib/utils.ts');
  if (fs.existsSync(utilsPath)) {
    const utilsContent = fs.readFileSync(utilsPath, 'utf8');
    console.log('\nChecking formatDate implementation in utils.ts:');
    
    const formatDateMatch = utilsContent.match(/export function formatDate[\s\S]*?}/);
    if (formatDateMatch) {
      console.log('✅ formatDate function found:');
      console.log(formatDateMatch[0]);
      
      // Check if it handles null/undefined correctly
      const handlesNull = formatDateMatch[0].includes('if (!date)');
      console.log(`${handlesNull ? '✅' : '❌'} Handles null/undefined values`);
      
      // Check if it has proper error handling
      const hasTryCatch = formatDateMatch[0].includes('try {') && formatDateMatch[0].includes('catch');
      console.log(`${hasTryCatch ? '✅' : '❌'} Has proper error handling`);
    } else {
      console.log('❌ formatDate function NOT found in utils.ts');
    }
  } else {
    console.log('❌ utils.ts file not found!');
  }
  
  // Check if the lastLogin field is being updated during login
  const authOptionsPath = path.join(__dirname, '../lib/auth-options.ts');
  if (fs.existsSync(authOptionsPath)) {
    const authContent = fs.readFileSync(authOptionsPath, 'utf8');
    console.log('\nChecking lastLogin updates in auth-options.ts:');
    
    const credentialsUpdate = authContent.includes('lastLogin: new Date()') && 
                             authContent.includes('where: { id: user.id }');
    console.log(`${credentialsUpdate ? '✅' : '❌'} Updates lastLogin during credentials login`);
    
    const socialUpdate = authContent.includes('lastLogin: new Date()') && 
                        authContent.includes('where: { email: user.email as string }');
    console.log(`${socialUpdate ? '✅' : '❌'} Updates lastLogin during social login`);
  } else {
    console.log('❌ auth-options.ts file not found!');
  }
  
  // Check if the lastLogin field is included in the user profile
  const userQueriesPath = path.join(__dirname, '../lib/queries/user-queries.ts');
  if (fs.existsSync(userQueriesPath)) {
    const queriesContent = fs.readFileSync(userQueriesPath, 'utf8');
    console.log('\nChecking lastLogin in user-queries.ts:');
    
    const includesLastLogin = queriesContent.includes('lastLogin: lastLogin || null');
    console.log(`${includesLastLogin ? '✅' : '❌'} Includes lastLogin in the user profile response`);
    
    const usesUserLastLogin = queriesContent.includes('let lastLogin = user.lastLogin');
    console.log(`${usesUserLastLogin ? '✅' : '❌'} Uses user.lastLogin as primary source`);
    
    const hasFallback = queriesContent.includes('Fallback to attendance records');
    console.log(`${hasFallback ? '✅' : '❌'} Has fallback to attendance records`);
  } else {
    console.log('❌ user-queries.ts file not found!');
  }
  
  // Check if the lastLogin field is included in the user profile hook
  const userProfileHookPath = path.join(__dirname, '../hooks/use-user-profile.ts');
  if (fs.existsSync(userProfileHookPath)) {
    const hookContent = fs.readFileSync(userProfileHookPath, 'utf8');
    console.log('\nChecking lastLogin in use-user-profile.ts:');
    
    const includesInType = hookContent.includes('lastLogin?: string | null;');
    console.log(`${includesInType ? '✅' : '❌'} Includes lastLogin in UserProfile type`);
    
    const extractsFromResponse = hookContent.includes('const { stats, projects, tasks, activities, ...userData } = response;');
    console.log(`${extractsFromResponse ? '✅' : '❌'} Extracts user data from response`);
  } else {
    console.log('❌ use-user-profile.ts file not found!');
  }
  
  // Check if the lastLogin field is displayed in the user profile view
  const profileViewPath = path.join(__dirname, '../components/profile/user-profile-view.tsx');
  if (fs.existsSync(profileViewPath)) {
    const viewContent = fs.readFileSync(profileViewPath, 'utf8');
    console.log('\nChecking lastLogin display in user-profile-view.tsx:');
    
    const importsFormatDate = viewContent.includes('import { formatDate } from "@/lib/utils"');
    console.log(`${importsFormatDate ? '✅' : '❌'} Imports formatDate from utils`);
    
    const usesFormatDate = viewContent.includes('formatDate(profile.lastLogin)');
    console.log(`${usesFormatDate ? '✅' : '❌'} Uses formatDate with profile.lastLogin`);
    
    const usesLastLoginDate = viewContent.includes('const lastLoginDate = formatDate(profile.lastLogin)');
    console.log(`${usesLastLoginDate ? '✅' : '❌'} Uses lastLoginDate variable with formatDate`);
    
    // Check for any direct use of toLocaleDateString with lastLogin
    const usesToLocaleDateString = viewContent.includes('new Date(profile.lastLogin).toLocaleDateString');
    console.log(`${!usesToLocaleDateString ? '✅' : '❌'} Does NOT use toLocaleDateString directly with profile.lastLogin`);
    
    // Check for console.log statements that might help debug
    const hasConsoleLog = viewContent.includes('console.log') && viewContent.includes('lastLogin');
    console.log(`${hasConsoleLog ? '✅' : '❌'} Has console.log statements for debugging lastLogin`);
  } else {
    console.log('❌ user-profile-view.tsx file not found!');
  }
  
  console.log('\n=== Recommendations ===');
  console.log('1. Add console.log statements to debug the lastLogin value:');
  console.log('   - In user-profile-view.tsx, add: console.log("Profile lastLogin:", profile.lastLogin);');
  console.log('   - In use-user-profile.ts, add: console.log("API response:", response);');
  console.log('2. Check browser network tab to see if lastLogin is included in the API response');
  console.log('3. Try clearing browser cache or using incognito mode');
  console.log('4. Add a temporary button to manually update lastLogin for testing');
}

main();
