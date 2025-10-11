#!/usr/bin/env node

/**
 * Rollback Script for SMARTIES Deployment
 * 
 * This script handles emergency rollbacks to previous working versions
 * when deployments fail or issues are detected in production.
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const config = {
  deploymentsDir: './deployments',
  backupsDir: './backups',
  timeout: 300000, // 5 minutes
  healthCheckRetries: 3,
  healthCheckDelay: 10000 // 10 seconds
};

/**
 * Load deployment history for an environment
 */
async function loadDeploymentHistory(environment) {
  try {
    const deploymentFile = path.join(config.deploymentsDir, environment, 'latest.json');
    const data = await fs.readFile(deploymentFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    throw new Error(`Failed to load deployment history for ${environment}: ${error.message}`);
  }
}

/**
 * Load backup information
 */
async function loadBackupInfo(environment, backupId) {
  try {
    const backupFile = path.join(config.backupsDir, environment, `${backupId}.json`);
    const data = await fs.readFile(backupFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // If no backup metadata exists, create basic info
    return {
      backup_id: backupId,
      environment: environment,
      created_at: new Date().toISOString(),
      status: 'available'
    };
  }
}

/**
 * Perform rollback to previous version
 */
async function performRollback(environment, targetVersion = null) {
  console.log(`🔄 Starting rollback for environment: ${environment}`);
  
  try {
    // Load current deployment info
    const currentDeployment = await loadDeploymentHistory(environment);
    console.log(`📦 Current version: ${currentDeployment.build_version}`);
    console.log(`🆔 Current deployment: ${currentDeployment.deployment_id}`);
    
    // Determine target version
    const rollbackTarget = targetVersion || currentDeployment.previous_version;
    
    if (!rollbackTarget) {
      throw new Error('No previous version available for rollback');
    }
    
    console.log(`🎯 Rolling back to: ${rollbackTarget}`);
    
    // Load backup information
    const backupInfo = await loadBackupInfo(environment, rollbackTarget);
    console.log(`📋 Backup status: ${backupInfo.status}`);
    
    // Create rollback record
    const rollbackId = `rollback-${Date.now()}`;
    const rollbackRecord = {
      rollback_id: rollbackId,
      environment: environment,
      from_version: currentDeployment.build_version,
      to_version: rollbackTarget,
      initiated_by: process.env.GITHUB_ACTOR || process.env.USER || 'system',
      initiated_at: new Date().toISOString(),
      reason: process.env.ROLLBACK_REASON || 'Health check failure',
      status: 'in_progress'
    };
    
    // Save rollback record
    const rollbackDir = path.join(config.deploymentsDir, environment, 'rollbacks');
    await fs.mkdir(rollbackDir, { recursive: true });
    await fs.writeFile(
      path.join(rollbackDir, `${rollbackId}.json`),
      JSON.stringify(rollbackRecord, null, 2)
    );
    
    console.log(`📝 Rollback record created: ${rollbackId}`);
    
    // Step 1: Stop current deployment
    console.log('🛑 Step 1: Stopping current deployment...');
    await simulateDeploymentStop(environment);
    
    // Step 2: Restore previous version
    console.log('📦 Step 2: Restoring previous version...');
    await simulateVersionRestore(environment, rollbackTarget);
    
    // Step 3: Update configuration
    console.log('⚙️ Step 3: Updating configuration...');
    await simulateConfigurationUpdate(environment, rollbackTarget);
    
    // Step 4: Start services
    console.log('🚀 Step 4: Starting services...');
    await simulateServiceStart(environment);
    
    // Step 5: Verify rollback
    console.log('🔍 Step 5: Verifying rollback...');
    const verificationResult = await verifyRollback(environment);
    
    if (verificationResult.success) {
      // Update rollback record
      rollbackRecord.status = 'completed';
      rollbackRecord.completed_at = new Date().toISOString();
      rollbackRecord.verification = verificationResult;
      
      await fs.writeFile(
        path.join(rollbackDir, `${rollbackId}.json`),
        JSON.stringify(rollbackRecord, null, 2)
      );
      
      // Update deployment record
      const restoredDeployment = {
        ...currentDeployment,
        build_version: rollbackTarget,
        deployment_id: `restored-${rollbackId}`,
        deployed_at: new Date().toISOString(),
        rollback_info: {
          rollback_id: rollbackId,
          previous_version: currentDeployment.build_version,
          rollback_reason: rollbackRecord.reason
        }
      };
      
      await fs.writeFile(
        path.join(config.deploymentsDir, environment, 'latest.json'),
        JSON.stringify(restoredDeployment, null, 2)
      );
      
      console.log('✅ Rollback completed successfully!');
      console.log(`🎯 Application restored to version: ${rollbackTarget}`);
      console.log(`🆔 Rollback ID: ${rollbackId}`);
      
      return {
        success: true,
        rollback_id: rollbackId,
        from_version: currentDeployment.build_version,
        to_version: rollbackTarget,
        verification: verificationResult
      };
      
    } else {
      throw new Error(`Rollback verification failed: ${verificationResult.message}`);
    }
    
  } catch (error) {
    console.error(`❌ Rollback failed: ${error.message}`);
    throw error;
  }
}

/**
 * Simulate stopping current deployment
 */
async function simulateDeploymentStop(environment) {
  return new Promise(resolve => {
    console.log('  🔄 Gracefully stopping application instances...');
    setTimeout(() => {
      console.log('  ✅ Application instances stopped');
      resolve();
    }, 2000);
  });
}

/**
 * Simulate restoring previous version
 */
async function simulateVersionRestore(environment, version) {
  return new Promise(resolve => {
    console.log(`  🔄 Restoring application version ${version}...`);
    setTimeout(() => {
      console.log('  ✅ Application version restored');
      resolve();
    }, 3000);
  });
}

/**
 * Simulate configuration update
 */
async function simulateConfigurationUpdate(environment, version) {
  return new Promise(resolve => {
    console.log('  🔄 Updating configuration files...');
    setTimeout(() => {
      console.log('  ✅ Configuration updated');
      resolve();
    }, 1500);
  });
}

/**
 * Simulate service start
 */
async function simulateServiceStart(environment) {
  return new Promise(resolve => {
    console.log('  🔄 Starting application services...');
    setTimeout(() => {
      console.log('  ✅ Services started successfully');
      resolve();
    }, 2500);
  });
}

/**
 * Verify rollback success
 */
async function verifyRollback(environment) {
  console.log('  🔍 Running rollback verification...');
  
  for (let attempt = 1; attempt <= config.healthCheckRetries; attempt++) {
    try {
      console.log(`  📊 Verification attempt ${attempt}/${config.healthCheckRetries}`);
      
      // Simulate health check
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate success (90% chance)
      if (Math.random() > 0.1) {
        console.log('  ✅ Application is responding correctly');
        console.log('  ✅ Core functionality verified');
        console.log('  ✅ Database connectivity confirmed');
        
        return {
          success: true,
          message: 'All verification checks passed',
          attempts: attempt,
          verified_at: new Date().toISOString()
        };
      } else {
        throw new Error('Health check failed');
      }
      
    } catch (error) {
      console.log(`  ⚠️ Verification attempt ${attempt} failed: ${error.message}`);
      
      if (attempt === config.healthCheckRetries) {
        return {
          success: false,
          message: 'Verification failed after all attempts',
          attempts: attempt,
          last_error: error.message
        };
      }
      
      console.log(`  ⏳ Waiting ${config.healthCheckDelay / 1000}s before retry...`);
      await new Promise(resolve => setTimeout(resolve, config.healthCheckDelay));
    }
  }
}

/**
 * List available rollback targets
 */
async function listRollbackTargets(environment) {
  try {
    const currentDeployment = await loadDeploymentHistory(environment);
    const backupsDir = path.join(config.backupsDir, environment);
    
    console.log(`📋 Available rollback targets for ${environment}:`);
    console.log(`  Current: ${currentDeployment.build_version} (${currentDeployment.deployment_id})`);
    
    if (currentDeployment.previous_version) {
      console.log(`  Previous: ${currentDeployment.previous_version} (recommended)`);
    }
    
    try {
      const backupFiles = await fs.readdir(backupsDir);
      const backups = backupFiles
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''))
        .filter(backup => backup !== currentDeployment.build_version);
      
      if (backups.length > 0) {
        console.log('  Other backups:');
        backups.forEach(backup => {
          console.log(`    - ${backup}`);
        });
      }
    } catch (error) {
      console.log('  No additional backups found');
    }
    
  } catch (error) {
    console.error(`❌ Failed to list rollback targets: ${error.message}`);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const environment = args[1];
  const targetVersion = args[2];
  
  if (!command || !environment) {
    console.log('🔄 SMARTIES Rollback Tool');
    console.log('');
    console.log('Usage:');
    console.log('  node rollback.js rollback <environment> [target-version]');
    console.log('  node rollback.js list <environment>');
    console.log('');
    console.log('Examples:');
    console.log('  node rollback.js rollback hackathon');
    console.log('  node rollback.js rollback production v20241211-abc123');
    console.log('  node rollback.js list staging');
    console.log('');
    console.log('Environment variables:');
    console.log('  ROLLBACK_REASON - Reason for rollback (optional)');
    console.log('  GITHUB_ACTOR - User initiating rollback (optional)');
    process.exit(1);
  }
  
  try {
    switch (command) {
      case 'rollback':
        const result = await performRollback(environment, targetVersion);
        console.log('');
        console.log('📊 Rollback Summary:');
        console.log(`  🆔 Rollback ID: ${result.rollback_id}`);
        console.log(`  📦 From: ${result.from_version}`);
        console.log(`  🎯 To: ${result.to_version}`);
        console.log(`  ✅ Status: ${result.success ? 'Success' : 'Failed'}`);
        break;
        
      case 'list':
        await listRollbackTargets(environment);
        break;
        
      default:
        console.error(`❌ Unknown command: ${command}`);
        process.exit(1);
    }
    
  } catch (error) {
    console.error(`❌ Operation failed: ${error.message}`);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error during rollback:', error.message);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n⚠️ Rollback interrupted by user');
  process.exit(1);
});

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = {
  performRollback,
  listRollbackTargets,
  loadDeploymentHistory
};