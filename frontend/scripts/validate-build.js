#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, description) {
  log(`\n🔍 ${description}...`, 'blue');
  try {
    const output = execSync(command, { 
      encoding: 'utf-8',
      stdio: 'pipe',
      cwd: process.cwd()
    });
    log(`✅ ${description} - PASSED`, 'green');
    return { success: true, output };
  } catch (error) {
    log(`❌ ${description} - FAILED`, 'red');
    if (error.stdout) {
      log(`stdout: ${error.stdout}`, 'yellow');
    }
    if (error.stderr) {
      log(`stderr: ${error.stderr}`, 'yellow');
    }
    return { success: false, error: error.message };
  }
}

function checkFileExists(filePath, description) {
  log(`\n🔍 ${description}...`, 'blue');
  if (fs.existsSync(filePath)) {
    log(`✅ ${description} - FOUND`, 'green');
    return true;
  } else {
    log(`❌ ${description} - NOT FOUND`, 'red');
    return false;
  }
}

async function main() {
  log('🚀 Vercel Build Validation', 'magenta');
  log('=' .repeat(40), 'magenta');
  
  const checks = [];
  
  // 1. Check required files
  checks.push(checkFileExists('package.json', 'package.json'));
  checks.push(checkFileExists('next.config.ts', 'next.config.ts'));
  checks.push(checkFileExists('tsconfig.json', 'tsconfig.json'));
  
  // 2. Install dependencies
  const installResult = runCommand('npm install', 'Installing dependencies');
  checks.push(installResult.success);
  
  // 3. Basic linting
  const lintResult = runCommand('npm run lint', 'Linting');
  checks.push(lintResult.success);
  
  // 4. Build
  const buildResult = runCommand('npm run build', 'Building');
  checks.push(buildResult.success);
  
  // 5. Check build output
  const buildCheck = checkFileExists('.next', 'Build output');
  checks.push(buildCheck);
  
  // Summary
  log('\n' + '=' .repeat(40), 'magenta');
  const passed = checks.filter(Boolean).length;
  const total = checks.length;
  
  if (passed === total) {
    log(`🎉 ALL CHECKS PASSED! (${passed}/${total})`, 'green');
    log('✅ Ready for Vercel deployment!', 'green');
    process.exit(0);
  } else {
    log(`❌ SOME CHECKS FAILED (${passed}/${total})`, 'red');
    log('🔧 Fix the issues above before deploying', 'red');
    process.exit(1);
  }
}

main().catch(error => {
  log(`💥 Validation failed: ${error.message}`, 'red');
  process.exit(1);
}); 