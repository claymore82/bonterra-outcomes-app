#!/usr/bin/env node

/**
 * CI/CD initialization script for bonstart projects
 * Handles placeholder replacement for GitHub Actions and CloudFormation templates
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

function readProjectConfig() {
  try {
    const sstConfigPath = path.join(__dirname, '..', 'sst.config.ts');
    const content = fs.readFileSync(sstConfigPath, 'utf8');

    // Extract app name from: name: "project-name",
    const nameMatch = content.match(/name:\s*["']([^"']+)["']/);
    const appName = nameMatch ? nameMatch[1] : null;

    // Check if still using template values
    const isTemplate = appName === 'bonstart';

    return { appName, isTemplate };
  } catch (error) {
    console.error('Error reading SST config:', error.message);
    return { appName: null, isTemplate: true };
  }
}

async function main() {
  console.log('\n🚀 Bonstart CI/CD Setup\n');

  // Read existing project configuration
  const { appName, isTemplate } = readProjectConfig();

  if (isTemplate) {
    console.error('❌ Project is not initialized yet!\n');
    console.error('Please run "npm run bonstart:init" first to set up your project,');
    console.error('then run this CI/CD setup script.\n');
    rl.close();
    process.exit(1);
  }

  console.log(`📋 Detected project: ${appName}\n`);
  console.log('This script will configure GitHub Actions and AWS CloudFormation templates.\n');

  // Only ask for what we need
  const githubOrg = await question('GitHub organization/username: ');
  const repoName = await question(`Repository name (or press Enter for "${appName}"): `) || appName;

  if (!githubOrg) {
    console.error('\n❌ GitHub organization is required for CI/CD setup.');
    rl.close();
    process.exit(1);
  }

  rl.close();

  console.log('\n📝 Updating CI/CD configuration files...\n');

  let filesChanged = 0;
  const rootDir = path.join(__dirname, '..');
  const ciOnlyDirs = ['.github'];

  // Define CI/CD specific replacements
  const replacements = [
    ['bonstart', appName],
    ['YOUR-ORG/YOUR-REPO', `${githubOrg}/${repoName}`],
    ['YOUR_ORG', githubOrg]
  ];

  // Only process .github directory and SST config
  const ciFiles = [
    '.github',
    'sst.config.ts'
  ];

  for (const ciPath of ciFiles) {
    const fullPath = path.join(rootDir, ciPath);
    if (!fs.existsSync(fullPath)) continue;

    if (fs.statSync(fullPath).isDirectory()) {
      walkDirectory(fullPath, (filePath) => {
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
      });
    } else {
      let fileChanged = false;
      for (const [search, replace] of replacements) {
        if (replaceInFile(fullPath, search, replace)) {
          fileChanged = true;
        }
      }
      if (fileChanged) {
        console.log('  ✓', path.relative(rootDir, fullPath));
        filesChanged++;
      }
    }
  }

  console.log('\n✅ CI/CD configuration complete!');
  console.log(`   Updated ${filesChanged} file(s)\n`);

  console.log('🔧 Next steps:');
  console.log('  1. Review the updated files above');
  console.log('  2. Follow the setup guide: .github/bootstrap-cloudformation/README.md');
  console.log('  3. Deploy AWS IAM roles using the CloudFormation templates');
  console.log('  4. Configure GitHub environments in your repository\n');

  console.log('📚 Documentation:');
  console.log('  - CI/CD Setup: .github/bootstrap-cloudformation/README.md');
  console.log('  - GitHub Environments: https://docs.github.com/en/actions/deployment/targeting-different-environments\n');
}

main().catch((error) => {
  console.error('\n❌ CI/CD setup failed:', error.message);
  rl.close();
  process.exit(1);
});