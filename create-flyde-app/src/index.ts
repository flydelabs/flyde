#!/usr/bin/env node

import * as fs from 'fs-extra';
import * as path from 'path';
import { execSync } from 'child_process';
import chalk from 'chalk';
import prompts from 'prompts';
import { reportEvent } from '@flyde/core';
import * as os from 'os';

// Generate anonymous ID for this session
const generateAnonymousId = () => 'user_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

// Get CLI version from package.json
const getCliVersion = () => {
  try {
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    return packageJson.version;
  } catch {
    return 'unknown';
  }
};

// Build system info
const getSystemInfo = () => ({
  cliVersion: getCliVersion(),
  platform: process.platform,
  arch: process.arch,
  nodeVersion: process.version,
  osRelease: os.release(),
  osType: os.type(),
  timestamp: new Date().toISOString()
});

async function main() {
  const userId = generateAnonymousId();
  const systemInfo = getSystemInfo();

  console.log();
  console.log(chalk.cyan.bold('  🚀 Welcome to Flyde!'));
  console.log(chalk.dim('  Create visual flow-based programs with TypeScript'));
  console.log();

  // Get project name from args or prompt
  let projectName = process.argv[2];
  
  if (!projectName) {
    const response = await prompts({
      type: 'text',
      name: 'projectName',
      message: 'Project name',
      initial: 'my-flyde-project'
    });
    
    if (!response.projectName) {
      console.log(chalk.yellow('\n⚠  Project creation cancelled'));
      process.exit(0);
    }
    
    projectName = response.projectName;
  }

  // Report project name selected
  reportEvent(userId, 'create-project:name-selected', {
    ...systemInfo,
    fromArgs: !!process.argv[2]
  });

  // IDE selection
  const ideResponse = await prompts({
    type: 'select',
    name: 'ide',
    message: 'Which editor are you using?',
    choices: [
      { title: 'VS Code', value: 'vscode' },
      { title: 'Cursor', value: 'cursor' },
      { title: 'Windsurf', value: 'windsurf' },
      { title: 'Other', value: 'other' }
    ],
    initial: 0
  });

  if (!ideResponse.ide) {
    console.log(chalk.yellow('\n⚠  Project creation cancelled'));
    process.exit(0);
  }

  const ide = ideResponse.ide;

  // Report IDE selected
  reportEvent(userId, 'create-project:ide-selected', {
    ...systemInfo,
    ide
  });

  const projectPath = path.resolve(process.cwd(), projectName);

  // Check if directory exists
  if (fs.existsSync(projectPath)) {
    console.log(chalk.yellow(`\n⚠  Directory "${projectName}" already exists`));
    process.exit(1);
  }

  try {
    // Create project directory
    console.log(chalk.dim('\n📁 Creating project directory...'));
    fs.ensureDirSync(projectPath);
    
    // Report directory created
    reportEvent(userId, 'create-project:directory-created', {
      ...systemInfo,
      ide
    });

    // Copy template files
    console.log(chalk.dim('📋 Setting up project files...'));
    const templatePath = path.join(__dirname, '..', 'templates', 'default');
    fs.copySync(templatePath, projectPath);

    // Update package.json with project name
    const packageJsonPath = path.join(projectPath, 'package.json');
    const packageJson = fs.readJsonSync(packageJsonPath);
    packageJson.name = projectName;
    fs.writeJsonSync(packageJsonPath, packageJson, { spaces: 2 });

    // Install dependencies
    console.log(chalk.dim('📦 Installing dependencies...'));
    const installStart = Date.now();
    execSync('npm install', { cwd: projectPath, stdio: 'inherit' });
    
    // Report dependencies installed
    reportEvent(userId, 'create-project:dependencies-installed', {
      ...systemInfo,
      ide,
      installDuration: Date.now() - installStart
    });

    // Install IDE extension based on selection
    if (ide !== 'other') {
      console.log(chalk.dim('\n🔧 Installing Flyde extension...'));
      
      const commands = {
        vscode: 'code',
        cursor: 'cursor',
        windsurf: 'windsurf'
      };
      
      const command = commands[ide as keyof typeof commands];
      
      try {
        // Check if IDE command is available
        execSync(`${command} --version`, { stdio: 'pipe' });
        
        try {
          execSync(`${command} --install-extension flyde.flyde-vscode`, { stdio: 'pipe' });
          console.log(chalk.green('✅ Flyde extension installed'));
          
          // Report extension installed
          reportEvent(userId, 'create-project:extension-installed', {
            ...systemInfo,
            ide,
            success: true
          });
        } catch (error) {
          console.log(chalk.yellow(`\n⚠  Could not install extension automatically`));
          
          // Report extension installation failed
          reportEvent(userId, 'create-project:extension-installed', {
            ...systemInfo,
            ide,
            success: false,
            reason: 'install-failed'
          });
          if (ide === 'vscode') {
            console.log(chalk.dim('   Install from: https://marketplace.visualstudio.com/items?itemName=flyde.flyde-vscode'));
          } else {
            console.log(chalk.dim('   Install from: https://open-vsx.org/extension/flyde/flyde-vscode'));
          }
        }
      } catch (error) {
        console.log(chalk.yellow(`\n⚠  ${command} command not found`));
        
        // Report IDE not found
        reportEvent(userId, 'create-project:extension-installed', {
          ...systemInfo,
          ide,
          success: false,
          reason: 'ide-not-found'
        });
        
        if (ide === 'vscode') {
          console.log(chalk.dim('   Install VS Code first, then install the extension from:'));
          console.log(chalk.dim('   https://marketplace.visualstudio.com/items?itemName=flyde.flyde-vscode'));
        } else {
          console.log(chalk.dim(`   Install ${ide} first, then install the extension from:`))
          console.log(chalk.dim('   https://open-vsx.org/extension/flyde/flyde-vscode'));
        }
      }
    } else {
      console.log(chalk.yellow('\n⚠  Please install the Flyde extension manually'));
      console.log(chalk.dim('   VS Code Marketplace: https://marketplace.visualstudio.com/items?itemName=flyde.flyde-vscode'));
      console.log(chalk.dim('   Open VSX: https://open-vsx.org/extension/flyde/flyde-vscode'));
    }

    // Success message
    console.log(chalk.green.bold('\n✨ Project created successfully!'));
    console.log(chalk.dim('\nNext steps:'));
    console.log(chalk.white(`  cd ${projectName}`));
    
    if (ide !== 'other') {
      const commands = {
        vscode: 'code',
        cursor: 'cursor', 
        windsurf: 'windsurf'
      };
      console.log(chalk.white(`  ${commands[ide as keyof typeof commands]} .`));
    }
    
    console.log(chalk.white('  Open hello-world.flyde to start building'));
    console.log();

    // Open IDE automatically
    if (ide !== 'other') {
      const commands = {
        vscode: 'code',
        cursor: 'cursor',
        windsurf: 'windsurf'
      };
      
      const command = commands[ide as keyof typeof commands];
      
      try {
        console.log(chalk.dim(`🚀 Opening ${ide}...`));
        execSync(`${command} "${projectPath}" "${projectPath}/hello-world.flyde"`, { stdio: 'pipe' });
      } catch (error) {
        // Silently fail - user can open manually
      }
    }

    // Report success
    reportEvent(userId, 'create-project:success', {
      ...systemInfo,
      ide
    });

  } catch (error) {
    console.error(chalk.red('\n❌ Error creating project:'), error);
    
    // Report error
    reportEvent(userId, 'create-project:error', {
      ...systemInfo,
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    });
    
    // Clean up on error
    if (fs.existsSync(projectPath)) {
      fs.removeSync(projectPath);
    }
    process.exit(1);
  }
}

main().catch(console.error);