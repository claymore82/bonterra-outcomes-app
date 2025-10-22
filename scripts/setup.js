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
    'scripts/setup.js',  // Don't replace in this script
    'package.json',      // Handle package.json separately
    'packages/next/src/app/page.tsx'  // Handle homepage separately
  ];
  
  // Define all replacements
  // Capitalize first letter for display names
  const capitalizedName = projectName.charAt(0).toUpperCase() + projectName.slice(1);
  
  const replacements = [
    ['Bonstart', capitalizedName],  // Replace capitalized version first
    ['bonstart', projectName],       // Then lowercase version
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
  
  // Update homepage separately
  console.log('\n🎨 Cleaning up homepage...\n');
  const homePagePath = path.join(rootDir, 'packages/next/src/app/page.tsx');
  
  try {
    let content = fs.readFileSync(homePagePath, 'utf8');
    
    // Change "Welcome to Bonstart" to just "Welcome"
    content = content.replace(
      'Welcome to Bonstart',
      'Welcome'
    );
    
    // Remove the entire "Setup Warning" Card section
    content = content.replace(
      /\s*\{\/\* Setup Warning \*\/\}\s*<Card>[\s\S]*?<\/Card>/,
      ''
    );
    
    // Clean up the description text
    content = content.replace(
      'Platform starter template with Stitch design system. Get started\n                by configuring your project and exploring the available\n                resources.',
      'Platform starter template with Stitch design system. Get started\n                by exploring the available resources.'
    );
    
    // Replace other bonstart references
    content = content.replace(/bonstart/g, projectName);
    content = content.replace(/Bonstart/g, capitalizedName);
    
    fs.writeFileSync(homePagePath, content, 'utf8');
    console.log('  ✓ Removed setup warning');
    console.log('  ✓ Changed title to "Welcome"');
    console.log('  ✓ Updated branding');
    filesChanged++;
  } catch (error) {
    console.error('  ✗ Failed to update homepage:', error.message);
  }
  
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
  
  // Update package.json
  console.log('\n📦 Updating package.json...\n');
  try {
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Remove init script
    delete packageJson.scripts['bonstart:init'];
    
    // Update package name and description
    packageJson.name = projectName;
    packageJson.description = '';
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');
    console.log('  ✓ Updated package name');
    console.log('  ✓ Removed bonstart:init script');
    filesChanged++;
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
