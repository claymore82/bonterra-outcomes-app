#!/usr/bin/env node

/**
 * Bonstart initialization script
 * Replaces "bonstart-template" with your project name and cleans up
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

function replaceInFile(filePath, searchValue, replaceValue) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const newContent = content.replace(new RegExp(searchValue, 'g'), replaceValue);
    
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

function walkDirectory(dir, callback, exclude = []) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    // Skip excluded directories
    if (exclude.some(ex => filePath.includes(ex))) continue;
    
    if (stat.isDirectory()) {
      walkDirectory(filePath, callback, exclude);
    } else {
      callback(filePath);
    }
  }
}

async function main() {
  console.log('\n🚀 Bonstart Project Setup\n');
  
  // Get project name
  const projectName = await question('Project name (lowercase, hyphens allowed): ');
  
  if (!projectName || !/^[a-z0-9-]+$/.test(projectName)) {
    console.error('\n❌ Invalid project name. Use lowercase letters, numbers, and hyphens only.');
    rl.close();
    process.exit(1);
  }
  
  rl.close();
  
  console.log('\n📝 Replacing "bonstart-template" with "' + projectName + '"...\n');
  
  let filesChanged = 0;
  const rootDir = path.join(__dirname, '..');
  const exclude = ['node_modules', '.next', '.sst', '.git', 'dist', 'build'];
  
  walkDirectory(rootDir, (filePath) => {
    if (replaceInFile(filePath, 'bonstart-template', projectName)) {
      console.log('  ✓', path.relative(rootDir, filePath));
      filesChanged++;
    }
  }, exclude);
  
  console.log('\n✅ Configuration complete!');
  console.log(`   Updated ${filesChanged} file(s)`);
  
  // Clean up template files
  console.log('\n🧹 Cleaning up template files...\n');
  
  const filesToDelete = [
    'scripts/setup.js',
  ];
  
  for (const file of filesToDelete) {
    const filePath = path.join(__dirname, '..', file);
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('  ✓ Deleted:', file);
      }
    } catch (error) {
      console.error('  ✗ Failed to delete:', file, '-', error.message);
    }
  }
  
  // Remove bonstart:init script from package.json
  try {
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    delete packageJson.scripts['bonstart:init'];
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');
    console.log('  ✓ Removed bonstart:init from package.json');
  } catch (error) {
    console.error('  ✗ Failed to update package.json:', error.message);
  }
  
  console.log('\n✅ Setup complete! Your project is ready.\n');
  console.log('Next steps:');
  console.log('  1. Run: npm run dev');
  console.log('  2. Run: npm run sst:deploy\n');
}

main().catch((error) => {
  console.error('\n❌ Setup failed:', error.message);
  rl.close();
  process.exit(1);
});
