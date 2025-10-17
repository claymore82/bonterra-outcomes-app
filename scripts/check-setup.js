#!/usr/bin/env node

/**
 * Post-install check script for Bonstart
 * Runs after npm install to guide new users through setup
 */

const fs = require('fs');
const path = require('path');

// Check if setup has been run by looking for placeholder in package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

if (packageJson.name.includes('{{PROJECT_NAME}}')) {
  console.log('\n🚀 Welcome to Bonstart!\n');
  console.log('To set up your project, run:');
  console.log('\x1b[36m%s\x1b[0m', '  npm run bonstart:init\n');
  console.log('This will configure your project with:');
  console.log('  • Project name');
  console.log('  • AWS configuration');
  console.log('  • Domain settings');
  console.log('  • Auth0 integration\n');
}

