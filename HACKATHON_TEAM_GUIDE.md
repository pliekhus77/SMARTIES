# SMARTIES Hackathon Team Guide

**Complete guide for hackathon participants to get up and running quickly**

## 🎯 Welcome to Team SMARTIES!

**SMARTIES** (Scan-based Mobile Allergen Risk Tracking & Intelligence Suite) is our hackathon project - a React Native mobile app that provides instant dietary compliance checking through barcode scanning, powered by AI and MongoDB Atlas.

### 🏆 Hackathon Goals
- **Primary**: Working mobile app with barcode scanning and dietary analysis
- **Demo**: Live demonstration on physical devices
- **Timeline**: 24-48 hours from setup to demo
- **Success**: Safe, functional app that helps users make dietary choices

## ⚡ Quick Start (15 Minutes)

### 1. Get the Code
```bash
# Clone repository
git clone <repository-url>
cd smarties-project

# Install dependencies
npm install
cd smarties && npm install && cd ..
```

### 2. Set Up Environment
```bash
# Copy environment template
cp .env.example .env

# Edit .env with provided team credentials
# (Team lead will provide actual values)
```

### 3. Start Development
```bash
cd smarties
npm start

# Install Expo Go on your phone
# Scan QR code to test app
```

### 4. Verify Everything Works
- [ ] App loads without errors
- [ ] Can navigate between screens
- [ ] Barcode scanner opens (test on physical device)
- [ ] No console errors

**🎉 You're ready to contribute!**

## 👥 Team Roles & Assignments

### Frontend/Mobile Team
**Focus**: React Native UI, user experience, barcode scanning
- **Primary**: Scanner interface, alert system, user profiles
- **Skills**: React Native, TypeScript, mobile UI/UX
- **Deliverables**: Working mobile app with intuitive interface

### Backend/Database Team
**Focus**: MongoDB Atlas, data management, API integration
- **Primary**: Database operations, product lookup, user data
- **Skills**: MongoDB, Node.js, database design
- **Deliverables**: Reliable data storage and retrieval

### AI/Analysis Team
**Focus**: Dietary compliance analysis, AI integration
- **Primary**: Ingredient analysis, allergen detection, compliance logic
- **Skills**: AI/ML concepts, business logic, data analysis
- **Deliverables**: Accurate dietary safety analysis

### Integration/DevOps Team
**Focus**: Service integration, deployment, testing
- **Primary**: Cloud services, deployment, performance, testing
- **Skills**: Cloud platforms, CI/CD, system integration
- **Deliverables**: Stable, deployable application

## 🚀 Hackathon Development Strategy

### Phase 1: Foundation (Hours 1-6)
**Goal**: Get basic app structure working

**Frontend Team:**
- [ ] Set up React Native navigation
- [ ] Create basic screen layouts (Scanner, Profile, History)
- [ ] Implement barcode scanner UI
- [ ] Add basic styling and branding

**Backend Team:**
- [ ] Verify MongoDB Atlas connection
- [ ] Create basic data models
- [ ] Implement product lookup functions
- [ ] Test database operations

**AI Team:**
- [ ] Test demo AI service
- [ ] Implement basic dietary analysis logic
- [ ] Create allergen detection rules
- [ ] Test analysis with sample data

**Integration Team:**
- [ ] Verify all cloud services working
- [ ] Set up testing framework
- [ ] Create deployment pipeline
- [ ] Monitor system performance

### Phase 2: Core Features (Hours 7-18)
**Goal**: Implement main functionality

**Frontend Team:**
- [ ] Connect barcode scanner to backend
- [ ] Implement product display screens
- [ ] Create dietary alert system (red/yellow/green)
- [ ] Add user profile management

**Backend Team:**
- [ ] Implement product database queries
- [ ] Create user profile storage
- [ ] Add scan history tracking
- [ ] Optimize database performance

**AI Team:**
- [ ] Enhance dietary analysis accuracy
- [ ] Add religious compliance checking
- [ ] Implement medical restriction logic
- [ ] Create confidence scoring

**Integration Team:**
- [ ] Connect all services end-to-end
- [ ] Implement error handling
- [ ] Add offline functionality
- [ ] Prepare demo deployment

### Phase 3: Polish & Demo (Hours 19-24)
**Goal**: Prepare for demonstration

**All Teams:**
- [ ] Test complete user workflows
- [ ] Fix critical bugs and issues
- [ ] Optimize performance
- [ ] Prepare demo scenarios
- [ ] Practice presentation
- [ ] Deploy to demo devices

## 🛠️ Development Environment

### Required Software
| Tool | Purpose | Installation |
|------|---------|--------------|
| **Node.js 18+** | JavaScript runtime | [Download](https://nodejs.org/) |
| **Expo CLI** | React Native development | `npm install -g @expo/cli` |
| **Git** | Version control | [Download](https://git-scm.com/) |
| **VS Code** | Code editor | [Download](https://code.visualstudio.com/) |

### Mobile Testing Options

#### Option 1: Expo Go (Recommended)
- **iOS**: Install "Expo Go" from App Store
- **Android**: Install "Expo Go" from Play Store
- **Usage**: Scan QR code from `npm start`
- **Benefits**: Instant updates, no build process

#### Option 2: Simulators/Emulators
- **iOS**: Xcode Simulator (macOS only)
- **Android**: Android Studio Emulator
- **Usage**: `npm run ios` or `npm run android`
- **Benefits**: Desktop testing, debugging tools

#### Option 3: Physical Device Development
- **iOS**: Requires Apple Developer account
- **Android**: Enable Developer Options + USB Debugging
- **Benefits**: Real device performance, camera access

### VS Code Extensions (Recommended)
```bash
# Install essential extensions
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension esbenp.prettier-vscode
code --install-extension ms-vscode.vscode-eslint
code --install-extension bradlc.vscode-tailwindcss
```

## 📱 Project Architecture

### Technology Stack
- **Frontend**: React Native + TypeScript + Expo
- **Database**: MongoDB Atlas (cloud-hosted)
- **AI Service**: Demo service (hackathon) / Amazon Bedrock (future)
- **Barcode**: expo-barcode-scanner
- **Navigation**: React Navigation v6

### Project Structure
```
smarties-project/
├── smarties/                  # Main React Native app
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── scanner/       # Barcode scanning components
│   │   │   ├── alerts/        # Dietary alert components
│   │   │   ├── profile/       # User profile components
│   │   │   └── common/        # Shared UI components
│   │   ├── screens/           # Main app screens
│   │   │   ├── ScanScreen.tsx # Primary barcode scanning
│   │   │   ├── ProfileScreen.tsx # User dietary profile
│   │   │   ├── HistoryScreen.tsx # Scan history
│   │   │   └── SettingsScreen.tsx # App settings
│   │   ├── services/          # Business logic
│   │   │   ├── atlas/         # MongoDB operations
│   │   │   ├── ai/            # AI analysis service
│   │   │   ├── barcode/       # Barcode scanning logic
│   │   │   └── dietary/       # Compliance checking
│   │   ├── models/            # Data models and types
│   │   ├── utils/             # Helper functions
│   │   └── config/            # Configuration files
│   ├── assets/                # Images, fonts, icons
│   └── __tests__/             # Test files
├── docs/                      # Documentation
├── design/                    # UI/UX mockups
└── .kiro/specs/              # Feature specifications
```

### Data Flow
```
User Scans Barcode → Camera → Barcode Service → Product Lookup (MongoDB) → 
AI Analysis → Dietary Compliance Check → Alert Display → History Storage
```

## 🎨 Design Guidelines

### Color System
```javascript
const colors = {
  // Safety colors (primary)
  danger: '#DC2626',      // Red - Violations/Danger
  warning: '#F59E0B',     // Yellow - Caution/Uncertainty
  safe: '#10B981',        // Green - Compliant/Safe
  
  // Brand colors
  primary: '#1168BD',     // Blue - App branding
  secondary: '#6366F1',   // Indigo - Secondary actions
  
  // Neutral colors
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    500: '#6B7280',
    900: '#111827'
  }
};
```

### Typography
```javascript
const typography = {
  // Headers
  h1: { fontSize: 24, fontWeight: 'bold', fontFamily: 'Inter' },
  h2: { fontSize: 20, fontWeight: 'bold', fontFamily: 'Inter' },
  h3: { fontSize: 16, fontWeight: 'bold', fontFamily: 'Inter' },
  
  // Body text
  body: { fontSize: 16, fontWeight: 'normal', fontFamily: 'Inter' },
  caption: { fontSize: 12, fontWeight: 'medium', fontFamily: 'Inter' }
};
```

### Component Standards
- **Buttons**: 48px height minimum for touch targets
- **Cards**: 8px border radius, subtle shadows
- **Alerts**: Full-width, icon + text, color-coded by severity
- **Scanner**: Full-screen overlay with centered viewfinder

## 🔄 Development Workflow

### Git Workflow
```bash
# 1. Create feature branch
git checkout -b feature/scanner-ui

# 2. Make changes and commit frequently
git add .
git commit -m "feat(scanner): add barcode detection UI"

# 3. Push and create pull request
git push origin feature/scanner-ui

# 4. Request code review
# 5. Merge after approval
```

### Commit Message Format
```
type(scope): description

Examples:
feat(scanner): implement barcode detection
fix(database): resolve connection timeout
docs(readme): update setup instructions
test(ai): add dietary analysis tests
style(ui): improve alert component styling
```

### Code Review Process
1. **Create Pull Request** with clear description
2. **Request Reviews** from 1-2 team members
3. **Address Feedback** quickly
4. **Merge** after approval
5. **Delete Branch** to keep repo clean

## 🧪 Testing Strategy

### Testing Priorities (Hackathon Focus)
1. **Manual Testing**: Core user workflows
2. **Integration Testing**: Service connections
3. **Device Testing**: Real device functionality
4. **Demo Testing**: Presentation scenarios

### Essential Tests
```bash
# Run before committing
npm test                    # Unit tests
npm run lint               # Code quality
npm run type-check         # TypeScript validation

# Integration testing
node test-cloud-integrations.js  # Cloud services
```

### Manual Testing Checklist
- [ ] App launches without errors
- [ ] Navigation works between screens
- [ ] Barcode scanner opens and detects codes
- [ ] Product lookup returns results
- [ ] Dietary analysis shows appropriate alerts
- [ ] User profile saves correctly
- [ ] Scan history displays properly

## 🎯 Demo Preparation

### Demo Scenarios

#### Scenario 1: Safe Product
- **Product**: Plain rice (no allergens)
- **User**: No dietary restrictions
- **Expected**: Green "Safe" alert
- **Message**: "This product is safe for your dietary restrictions"

#### Scenario 2: Allergen Warning
- **Product**: Milk chocolate (contains milk, may contain nuts)
- **User**: Dairy allergy
- **Expected**: Red "Danger" alert
- **Message**: "⚠️ ALLERGEN DETECTED: Contains milk"

#### Scenario 3: Religious Compliance
- **Product**: Beef jerky
- **User**: Halal dietary requirements
- **Expected**: Yellow "Caution" alert
- **Message**: "⚠️ May not meet Halal requirements"

#### Scenario 4: Multiple Restrictions
- **Product**: Peanut butter cookies (contains peanuts, wheat, eggs)
- **User**: Peanut allergy + gluten intolerance
- **Expected**: Red "Danger" alert
- **Message**: "⚠️ MULTIPLE VIOLATIONS: Contains peanuts, gluten"

### Demo Device Setup
1. **Install Expo Go** on 2-3 devices
2. **Test QR code scanning** from development server
3. **Prepare backup APK/IPA** files if needed
4. **Test internet connectivity** at demo location
5. **Have offline fallback** ready

### Demo Script Outline
1. **Introduction** (30 seconds)
   - Problem: Food safety for people with dietary restrictions
   - Solution: Instant barcode scanning with AI analysis

2. **Live Demo** (2-3 minutes)
   - Show app launch and navigation
   - Scan safe product → Green alert
   - Scan problematic product → Red alert
   - Show user profile with restrictions

3. **Technical Highlights** (1 minute)
   - React Native mobile app
   - MongoDB Atlas database
   - AI-powered dietary analysis
   - Real-time barcode scanning

4. **Future Vision** (30 seconds)
   - Restaurant menu integration
   - Family profile management
   - Community product database

## 🆘 Troubleshooting

### Common Issues & Quick Fixes

#### App Won't Start
```bash
# Clear cache and restart
npx expo start --clear
npm start -- --reset-cache

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### Barcode Scanner Not Working
- **Issue**: Camera permissions denied
- **Fix**: Enable camera permissions in device settings
- **Note**: Barcode scanner only works on physical devices, not simulators

#### Database Connection Failed
- **Issue**: MongoDB connection string incorrect
- **Fix**: Check `.env` file for correct password
- **Test**: Run `node test-cloud-integrations.js`

#### AI Service Not Responding
- **Issue**: Service configuration problem
- **Fix**: Verify `AI_SERVICE_TYPE=demo` in `.env`
- **Test**: Check console logs for error messages

#### Build Errors
```bash
# Clean and rebuild
cd smarties
rm -rf node_modules package-lock.json
npm install
npm start
```

### Getting Help

#### Team Resources
1. **Team Chat**: Ask questions immediately
2. **GitHub Issues**: Report bugs and problems
3. **Code Review**: Get help with implementation
4. **Pair Programming**: Work together on complex features

#### External Resources
- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Expo Documentation](https://docs.expo.dev/)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/react-native)

#### Debug Commands
```bash
# Check environment
node -e "console.log(process.env)" | grep -E "(MONGODB|AI_)"

# Test services
node test-cloud-integrations.js

# React Native logs
npx react-native log-ios      # iOS logs
npx react-native log-android  # Android logs
```

## 📊 Success Metrics

### Hackathon Success Criteria

#### Must Have (MVP)
- [ ] **Barcode Scanning**: UPC recognition with camera
- [ ] **Product Lookup**: Database search functionality
- [ ] **Dietary Analysis**: Basic allergen detection
- [ ] **User Profile**: Dietary restrictions setup
- [ ] **Alert System**: Color-coded safety warnings
- [ ] **Demo Ready**: Working on physical devices

#### Should Have (Enhanced)
- [ ] **Scan History**: Previous scan results
- [ ] **Multiple Profiles**: Family member support
- [ ] **Offline Core**: Basic functionality without internet
- [ ] **Performance**: <3 second scan-to-result time

#### Nice to Have (Stretch Goals)
- [ ] **Advanced AI**: Complex ingredient analysis
- [ ] **Social Features**: Share safe products
- [ ] **Image Recognition**: Package photo analysis
- [ ] **Restaurant Integration**: Menu item scanning

### Demo Success Indicators
- [ ] App launches reliably on demo devices
- [ ] Barcode scanning works consistently
- [ ] Dietary alerts display correctly
- [ ] Audience can test the app themselves
- [ ] No critical crashes during presentation
- [ ] Clear value proposition demonstrated

## 🎉 Team Communication

### Daily Check-ins (15 minutes)
**Format**: Quick standup meeting
- **What did you accomplish since last check-in?**
- **What will you work on next?**
- **Any blockers or help needed?**
- **Any discoveries or insights to share?**

### Communication Channels
- **Team Chat**: Real-time coordination and questions
- **GitHub**: Code reviews, issues, and project management
- **Video Calls**: Complex discussions and pair programming
- **Shared Documents**: Design decisions and planning

### Knowledge Sharing
- **Code Reviews**: Learn from each other's implementations
- **Demo Sessions**: Show progress and get feedback
- **Documentation**: Update guides as you learn
- **Pair Programming**: Work together on challenging features

## ✅ Onboarding Checklist

### Environment Setup
- [ ] Node.js 18+ installed and verified
- [ ] Expo CLI installed globally
- [ ] Git configured with name and email
- [ ] VS Code with recommended extensions
- [ ] Mobile testing method chosen (Expo Go/Simulator)

### Project Setup
- [ ] Repository cloned and dependencies installed
- [ ] Environment variables configured
- [ ] App runs successfully
- [ ] Can test on mobile device
- [ ] All cloud services accessible

### Team Integration
- [ ] Added to team communication channels
- [ ] GitHub access configured and tested
- [ ] Familiar with project structure and goals
- [ ] Understands development workflow
- [ ] Knows how to get help when stuck

### Development Ready
- [ ] Can create branches and make commits
- [ ] Code linting and formatting work
- [ ] Tests run successfully
- [ ] Understands coding standards
- [ ] Ready to contribute to assigned features

## 🚀 Let's Build Something Amazing!

You're now ready to contribute to SMARTIES! Here's your immediate next steps:

### Your First Hour
1. **Complete setup checklist** above
2. **Explore the codebase** - understand the structure
3. **Run the app** and test basic functionality
4. **Join team communication** channels
5. **Pick your first task** based on your role

### Your First Contribution
1. **Find a small task** (UI improvement, bug fix, documentation)
2. **Create a branch** and make the change
3. **Test your changes** thoroughly
4. **Submit a pull request** for review
5. **Celebrate** your first contribution! 🎊

### Remember
- **Ask questions** - everyone is here to help
- **Test frequently** - catch issues early
- **Commit often** - small, focused commits
- **Have fun** - this is a hackathon, enjoy the process!

**Let's create an app that helps people eat safely and confidently!** 🛡️📱

---

**Questions?** Reach out to any team member - we're all here to help you succeed and build something incredible together!

**#TeamSMARTIES** 🚀