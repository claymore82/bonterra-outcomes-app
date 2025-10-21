#!/usr/bin/env node

/**
 * Setup git hooks for code quality checks
 * This ensures pre-push hooks run automatically for all developers
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function setupGitHooks() {
  try {
    // Check if we're in a git repository
    execSync('git rev-parse --git-dir', { stdio: 'ignore' });

    // Set git hooks path to .husky
    console.log('🔧 Setting up git hooks...');
    execSync('git config core.hooksPath .husky', { stdio: 'inherit' });

    // Ensure .husky directory exists with correct permissions
    const huskyDir = path.join(process.cwd(), '.husky');
    if (fs.existsSync(huskyDir)) {
      // Make hook files executable
      const hookFiles = fs.readdirSync(huskyDir).filter(file => !file.startsWith('.') && !file.startsWith('_'));
      hookFiles.forEach(file => {
        const hookPath = path.join(huskyDir, file);
        if (fs.statSync(hookPath).isFile()) {
          fs.chmodSync(hookPath, '755');
        }
      });

      // Make husky.sh executable
      const huskyShPath = path.join(huskyDir, '_', 'husky.sh');
      if (fs.existsSync(huskyShPath)) {
        fs.chmodSync(huskyShPath, '755');
      }
    }

    console.log('✅ Git hooks configured successfully!');
    console.log('   Pre-push hooks will now run automatically on git push');

  } catch (error) {
    console.log('⚠️  Not in a git repository or git hooks already configured');
    console.log('   Git hooks will be set up when you clone/initialize git');
  }
}

setupGitHooks();