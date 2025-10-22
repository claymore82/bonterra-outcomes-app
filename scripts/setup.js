#!/usr/bin/env node

/**
 * Bonstart initialization script
 * Replaces "bonstart" with your project name and configures CI/CD
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

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
    
    // Skip excluded directories and files (use path separator for exact matching)
    const relativePath = path.relative(path.join(__dirname, '..'), filePath);
    if (exclude.some(ex => {
      // Exact file match
      if (!ex.endsWith('/') && relativePath === ex) return true;
      // Directory match - check if path starts with directory
      if (ex.endsWith('/') && relativePath.startsWith(ex)) return true;
      // Legacy: check if path contains the exclude string (for things like node_modules)
      return filePath.includes(path.sep + ex + path.sep) || filePath.endsWith(path.sep + ex);
    })) continue;
    
    if (stat.isDirectory()) {
      walkDirectory(filePath, callback, exclude);
    } else {
      callback(filePath);
    }
  }
}

function getGitHubInfo() {
  try {
    const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
    
    // Parse GitHub URL (supports both HTTPS and SSH)
    // https://github.com/org/repo.git or git@github.com:org/repo.git
    let match;
    if (remoteUrl.includes('github.com')) {
      match = remoteUrl.match(/github\.com[:/]([^/]+)\/(.+?)(\.git)?$/);
      if (match) {
        return {
          org: match[1],
          repo: match[2],
        };
      }
    }
    return null;
  } catch (error) {
    return null;
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

  // Auto-detect GitHub info from git remote
  const gitInfo = getGitHubInfo();
  let githubOrg, repoName;

  if (gitInfo) {
    githubOrg = gitInfo.org;
    repoName = gitInfo.repo;
    console.log(`\n📋 Detected GitHub: ${githubOrg}/${repoName}`);
  } else {
    // Default to bonterratech if can't detect
    githubOrg = 'bonterratech';
    repoName = projectName;
    console.log(`\n📋 Using GitHub: ${githubOrg}/${repoName} (update .github/ files if different)`);
  }
  
  rl.close();
  
  console.log('\n📝 Replacing "bonstart" with "' + projectName + '"...\n');
  
  let filesChanged = 0;
  const rootDir = path.join(__dirname, '..');
  const exclude = [
    'node_modules', 
    '.next', 
    '.sst', 
    '.git/',       // Exclude .git directory but not .github
    'dist', 
    'build',
    'docs/',       // Don't replace in documentation
    'README.md',   // Don't replace in main README
    'scripts/setup.js'  // Don't replace in this script
  ];
  
  // Define all replacements
  const replacements = [
    ['bonstart', projectName],
    ['YOUR-ORG/YOUR-REPO', `${githubOrg}/${repoName}`],
    ['YOUR_ORG', githubOrg]
  ];

  walkDirectory(rootDir, (filePath) => {
    let fileChanged = false;
    for (const [search, replace] of replacements) {
      if (replaceInFile(filePath, search, replace)) {
        fileChanged = true;
      }
    }
    if (fileChanged) {
      console.log('  ✓', path.relative(rootDir, filePath));
      filesChanged++;
    }
  }, exclude);
  
  console.log('\n✅ Configuration complete!');
  console.log(`   Updated ${filesChanged} file(s)`);
  
  // Remove setup warning from homepage
  console.log('\n🎨 Removing setup warning from homepage...\n');
  const homePagePath = path.join(rootDir, 'packages/next/src/app/page.tsx');
  
  try {
    let content = fs.readFileSync(homePagePath, 'utf8');
    
    // Remove the entire warning section (emoji + heading + description)
    content = content.replace(
      /\s*<div className="mb-6 text-6xl">⚠️<\/div>[\s\S]*?to configure your project\s*<\/p>/,
      ''
    );
    
    fs.writeFileSync(homePagePath, content, 'utf8');
    console.log('  ✓ Removed warning section');
  } catch (error) {
    console.error('  ✗ Failed to update homepage:', error.message);
  }
  
  // Clean up template files
  console.log('\n🧹 Cleaning up template files...\n');
  
  const filesToDelete = [
    'scripts/setup.js',
    'scripts/init-ci.js',  // Remove old CI init script too
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
  
  // Remove bonstart:init and bonstart:init-ci scripts from package.json
  try {
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    delete packageJson.scripts['bonstart:init'];
    delete packageJson.scripts['bonstart:init-ci'];
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');
    console.log('  ✓ Removed init scripts from package.json');
  } catch (error) {
    console.error('  ✗ Failed to update package.json:', error.message);
  }
  
  console.log('\n✅ Setup complete! Your project is ready.\n');
  console.log('Next steps:');
  console.log('  1. Review CI/CD setup: .github/bootstrap-cloudformation/README.md');
  console.log('  2. Run: npm run dev');
  console.log('  3. Run: npm run sst:deploy\n');
}

main().catch((error) => {
  console.error('\n❌ Setup failed:', error.message);
  rl.close();
  process.exit(1);
});
