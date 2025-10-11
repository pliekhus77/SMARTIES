#!/usr/bin/env node

/**
 * MongoDB Atlas Network Access & Authentication Setup Script
 * Interactive setup for SMARTIES application database access
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupMongoDBAuth() {
  log('\n🚀 MongoDB Atlas Network Access & Authentication Setup', colors.bold + colors.cyan);
  log('=' .repeat(60), colors.blue);
  
  log('\nThis script will help you configure MongoDB Atlas for the SMARTIES application.', colors.yellow);
  log('You will need access to your MongoDB Atlas dashboard to complete this setup.\n', colors.yellow);

  // Step 1: Network Access Configuration
  log('📡 STEP 1: Network Access Configuration', colors.bold + colors.blue);
  log('-' .repeat(40), colors.blue);
  
  log('\n1. Go to your MongoDB Atlas dashboard (https://cloud.mongodb.com)', colors.cyan);
  log('2. Navigate to Network Access in the left sidebar', colors.cyan);
  log('3. Click "Add IP Address"', colors.cyan);
  log('4. Choose one of the following options:', colors.cyan);
  log('   a) Add Current IP Address (recommended for development)', colors.yellow);
  log('   b) Allow Access from Anywhere (0.0.0.0/0) - for hackathon only', colors.yellow);
  log('   c) Add specific IP addresses for your team', colors.yellow);

  const networkChoice = await question('\nWhich option did you choose? (a/b/c): ');
  
  if (networkChoice.toLowerCase() === 'b') {
    log('\n⚠️  WARNING: You chose "Allow Access from Anywhere"', colors.red);
    log('This is acceptable for hackathon development but should be restricted for production.', colors.yellow);
  }

  // Step 2: Database User Creation
  log('\n👤 STEP 2: Database User Creation', colors.bold + colors.blue);
  log('-' .repeat(40), colors.blue);
  
  log('\n1. Go to Database Access in your MongoDB Atlas dashboard', colors.cyan);
  log('2. Click "Add New Database User"', colors.cyan);
  log('3. Choose "Password" authentication method', colors.cyan);
  log('4. Enter the following details:', colors.cyan);
  log('   - Username: smarties_app_user', colors.yellow);
  log('   - Password: Generate a strong password (save it!)', colors.yellow);
  log('   - Database User Privileges: Read and write to any database', colors.yellow);
  log('5. Click "Add User"', colors.cyan);

  const username = await question('\nEnter the username you created (default: smarties_app_user): ') || 'smarties_app_user';
  const password = await question('Enter the password you generated: ');
  
  if (!password) {
    log('❌ Password is required. Please run the script again with a valid password.', colors.red);
    rl.close();
    return;
  }

  // Step 3: Connection String Generation
  log('\n🔗 STEP 3: Connection String Configuration', colors.bold + colors.blue);
  log('-' .repeat(40), colors.blue);
  
  log('\n1. Go to Database in your MongoDB Atlas dashboard', colors.cyan);
  log('2. Click "Connect" on your cluster', colors.cyan);
  log('3. Choose "Connect your application"', colors.cyan);
  log('4. Select "Node.js" as the driver', colors.cyan);
  log('5. Copy the connection string', colors.cyan);

  const defaultConnectionString = `mongodb+srv://${username}:${password}@cluster0.31pwc7s.mongodb.net/smarties_db?retryWrites=true&w=majority`;
  
  log(`\nDefault connection string format:`, colors.yellow);
  log(defaultConnectionString, colors.cyan);
  
  const connectionString = await question('\nEnter your connection string (or press Enter to use default): ') || defaultConnectionString;

  // Step 4: Environment File Creation
  log('\n📝 STEP 4: Environment Configuration', colors.bold + colors.blue);
  log('-' .repeat(40), colors.blue);
  
  const envContent = `# MongoDB Atlas Configuration
MONGODB_URI=${connectionString}
MONGODB_DATABASE=smarties_db
MONGODB_MAX_POOL_SIZE=10
MONGODB_TIMEOUT_MS=5000

# AI Service Configuration (for upcoming tasks)
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Application Configuration
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug

# Security Configuration
JWT_SECRET=your_jwt_secret_here
ENCRYPTION_KEY=your_encryption_key_here

# Generated on: ${new Date().toISOString()}
# Setup completed by: MongoDB Atlas Setup Script v1.0
`;

  try {
    fs.writeFileSync('.env', envContent);
    log('\n✅ Environment file (.env) created successfully!', colors.green);
  } catch (error) {
    log(`\n❌ Error creating .env file: ${error.message}`, colors.red);
    rl.close();
    return;
  }

  // Step 5: Connection Testing
  log('\n🧪 STEP 5: Connection Testing', colors.bold + colors.blue);
  log('-' .repeat(40), colors.blue);
  
  const testConnection = await question('\nWould you like to test the connection now? (y/n): ');
  
  if (testConnection.toLowerCase() === 'y' || testConnection.toLowerCase() === 'yes') {
    log('\n🔄 Testing MongoDB connection...', colors.yellow);
    
    try {
      // Load the environment variables
      require('dotenv').config();
      const { MongoClient } = require('mongodb');
      
      const client = new MongoClient(connectionString, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
      });

      await client.connect();
      log('✅ Connection successful!', colors.green);
      
      const db = client.db('smarties_db');
      const collections = await db.listCollections().toArray();
      log(`📁 Found ${collections.length} collections in database`, colors.blue);
      
      await client.close();
      
    } catch (error) {
      log(`❌ Connection test failed: ${error.message}`, colors.red);
      log('\nTroubleshooting tips:', colors.yellow);
      log('1. Check your network access rules in MongoDB Atlas', colors.cyan);
      log('2. Verify the username and password are correct', colors.cyan);
      log('3. Ensure your IP address is whitelisted', colors.cyan);
      log('4. Check the connection string format', colors.cyan);
    }
  }

  // Step 6: Security Recommendations
  log('\n🔒 STEP 6: Security Recommendations', colors.bold + colors.blue);
  log('-' .repeat(40), colors.blue);
  
  log('\nImportant security considerations:', colors.yellow);
  log('1. ✅ Never commit .env files to version control', colors.green);
  log('2. ✅ Use strong, unique passwords for database users', colors.green);
  log('3. ✅ Restrict network access to specific IP addresses in production', colors.green);
  log('4. ✅ Regularly rotate database passwords', colors.green);
  log('5. ✅ Monitor database access logs', colors.green);
  log('6. ⚠️  Current setup uses broad network access (0.0.0.0/0) - restrict this post-hackathon', colors.yellow);

  // Step 7: Next Steps
  log('\n🎯 STEP 7: Next Steps', colors.bold + colors.blue);
  log('-' .repeat(40), colors.blue);
  
  log('\nYour MongoDB Atlas setup is complete! Next steps:', colors.green);
  log('1. Run connection test: node test-mongodb-connection.js', colors.cyan);
  log('2. Configure AI service accounts (Task 2.4)', colors.cyan);
  log('3. Test cloud service integrations (Task 2.5)', colors.cyan);
  log('4. Initialize React Native project structure (Task 3.1)', colors.cyan);

  // Summary
  log('\n📊 Setup Summary', colors.bold + colors.green);
  log('=' .repeat(30), colors.green);
  log(`✅ Network Access: Configured`, colors.green);
  log(`✅ Database User: ${username}`, colors.green);
  log(`✅ Connection String: Generated`, colors.green);
  log(`✅ Environment File: Created`, colors.green);
  log(`✅ Security Guidelines: Provided`, colors.green);

  log('\n🎉 MongoDB Atlas setup completed successfully!', colors.bold + colors.green);
  log('You can now proceed with the next tasks in your hackathon setup.', colors.cyan);

  rl.close();
}

// Handle process termination
process.on('SIGINT', () => {
  log('\n\n👋 Setup interrupted', colors.yellow);
  rl.close();
  process.exit(0);
});

// Run the setup
setupMongoDBAuth().catch(error => {
  log(`\n💥 Setup failed: ${error.message}`, colors.red);
  rl.close();
  process.exit(1);
});