# SMARTIES Team Onboarding Guide

**Welcome to the SMARTIES hackathon team! 🛡️📱**

## 🎯 Project Overview

**SMARTIES** (Scan-based Mobile Allergen Risk Tracking & Intelligence Suite) is a React Native mobile app that helps users make safe dietary choices by scanning product barcodes and receiving instant compliance alerts for allergies, religious restrictions, medical conditions, and lifestyle preferences.

### Key Features
- 📱 **Instant Barcode Scanning** - Sub-3-second response time
- 🛡️ **Comprehensive Dietary Analysis** - Allergies, religious, medical, lifestyle
- 🚨 **Safety-First Alerts** - Red/Yellow/Green color-coded warnings
- 🤖 **AI-Powered Intelligence** - MongoDB Atlas + AI analysis
- 🔄 **Offline-First** - Core safety features work without internet

## 👥 Team Roles & Responsibilities

### Frontend/Mobile Development
- **React Native UI Components** - Scanner, alerts, profile screens
- **User Experience** - Accessibility, performance, offline functionality
- **Platform Integration** - iOS/Android specific features

### Backend/Database Development  
- **MongoDB Atlas Integration** - Database design, queries, indexing
- **API Development** - Product lookup, user management, sync
- **Data Processing** - Product data ingestion, validation

### AI/ML Development
- **Dietary Analysis Engine** - Allergen detection, compliance checking
- **AI Service Integration** - OpenAI/Anthropic/Amazon Bedrock
- **RAG Pipeline** - Vector search, context retrieval

### DevOps/Infrastructure
- **Cloud Services** - MongoDB Atlas, AWS/Azure deployment
- **CI/CD Pipeline** - Automated testing, builds, deployment
- **Monitoring** - Performance, errors, usage analytics

## 🚀 Quick Start (15 Minutes)

### 1. Environment Setup
```bash
# Clone repository
git clone <repository-url>
cd smarties-project

# Install dependencies
npm install
cd smarties && npm install && cd ..

# Copy environment template
cp .env.example .env
```

### 2. Configure Environment
Edit `.env` file with provided credentials:
```bash
# MongoDB Atlas (provided by team)
MONGODB_URI=mongodb+srv://...
MONGODB_DB_NAME=smarties_db

# AI Service (demo mode for hackathon)
AI_SERVICE_TYPE=demo
AI_DEMO_MODE=true
```

### 3. Start Development
```bash
cd smarties
npm start

# In another terminal, run on your platform:
npm run ios     # iOS Simulator (macOS only)
npm run android # Android Emulator
```

### 4. Verify Setup
- [ ] App loads without errors
- [ ] Can navigate between screens
- [ ] Barcode scanner opens (test on physical device)
- [ ] Database connection works

## 📋 Development Environment

### Required Software
| Tool | Version | Purpose | Installation |
|------|---------|---------|--------------|
| **Node.js** | 18+ | JavaScript runtime | [Download](https://nodejs.org/) |
| **Expo CLI** | Latest | React Native development | `npm install -g @expo/cli` |
| **Git** | Latest | Version control | [Download](https://git-scm.com/) |
| **VS Code** | Latest | Code editor | [Download](https://code.visualstudio.com/) |

### Platform-Specific Tools

#### Android Development
- **Android Studio** - Complete IDE with SDK
- **Android SDK** - API Level 33 (Android 13)
- **Android Virtual Device** - For testing

#### iOS Development (macOS only)
- **Xcode** - Latest from App Store
- **iOS Simulator** - Included with Xcode

#### iOS Testing (Windows/Linux)
- **Expo Go App** - Install on physical iOS device
- **Expo Account** - For cloud builds

### VS Code Extensions (Recommended)
```bash
# Install recommended extensions
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension bradlc.vscode-tailwindcss
code --install-extension esbenp.prettier-vscode
code --install-extension ms-vscode.vscode-eslint
code --install-extension formulahendry.auto-rename-tag
code --install-extension christian-kohler.path-intellisense
```

## 🏗️ Project Architecture

### Technology Stack
- **Frontend**: React Native + TypeScript + Expo
- **Database**: MongoDB Atlas + Realm SDK
- **AI/ML**: OpenAI/Anthropic APIs (Demo mode for hackathon)
- **Barcode**: expo-barcode-scanner
- **Navigation**: React Navigation
- **Testing**: Jest + React Native Testing Library

### Project Structure
```
smarties-project/
├── smarties/                  # React Native application
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── scanner/       # Barcode scanning
│   │   │   ├── profile/       # User profile
│   │   │   ├── alerts/        # Warning alerts
│   │   │   └── common/        # Shared components
│   │   ├── screens/           # Main app screens
│   │   │   ├── ScanScreen.tsx
│   │   │   ├── ProfileScreen.tsx
│   │   │   ├── HistoryScreen.tsx
│   │   │   └── SettingsScreen.tsx
│   │   ├── services/          # Business logic
│   │   │   ├── atlas/         # MongoDB integration
│   │   │   ├── ai/            # AI analysis
│   │   │   ├── barcode/       # Scanning logic
│   │   │   └── dietary/       # Compliance checking
│   │   ├── models/            # Data models
│   │   ├── utils/             # Helper functions
│   │   └── config/            # Configuration
│   ├── assets/                # Images, fonts
│   └── __tests__/             # Test files
├── docs/                      # Documentation
├── design/                    # UI/UX mockups
└── .kiro/specs/              # Feature specifications
```

### Data Flow
```
User Scans Barcode → Camera → Barcode Service → Product Lookup → 
AI Analysis → Dietary Compliance Check → Alert Display → History Storage
```

## 🎨 Design System

### Color Palette
- **Safety Red**: `#DC2626` - Violations/Danger
- **Warning Yellow**: `#F59E0B` - Caution/Uncertainty  
- **Safe Green**: `#10B981` - Compliant/Safe
- **Primary Blue**: `#1168BD` - App branding
- **Gray Scale**: `#F9FAFB`, `#6B7280`, `#374151`

### Typography
- **Headers**: Inter Bold, 24px/20px/16px
- **Body**: Inter Regular, 16px/14px
- **Captions**: Inter Medium, 12px

### Component Standards
- **Buttons**: 48px height, rounded corners, clear labels
- **Cards**: 8px border radius, subtle shadows
- **Alerts**: Full-width, icon + text, color-coded
- **Scanner**: Full-screen overlay, centered viewfinder

## 🔄 Development Workflow

### Git Workflow
```bash
# 1. Create feature branch
git checkout -b feature/barcode-scanning

# 2. Make changes and commit frequently
git add .
git commit -m "feat: implement barcode scanning UI"

# 3. Push and create pull request
git push origin feature/barcode-scanning

# 4. Request code review from team
# 5. Merge after approval
```

### Commit Message Format
```
type(scope): description

feat(scanner): add barcode detection functionality
fix(database): resolve connection timeout issue
docs(readme): update setup instructions
test(ai): add unit tests for dietary analysis
```

### Code Review Process
1. **Create Pull Request** with clear description
2. **Request Reviews** from 2+ team members
3. **Address Feedback** and update code
4. **Merge** after approval and passing tests
5. **Delete Branch** after merge

### Testing Strategy
```bash
# Run tests before committing
npm test                    # Unit tests
npm run test:integration   # Integration tests
npm run lint               # Code quality
npm run type-check         # TypeScript validation
```

## 📱 Development Guidelines

### React Native Best Practices
```typescript
// Use functional components with hooks
const ScannerScreen: React.FC = () => {
  const [scanning, setScanning] = useState(false);
  
  // Handle loading and error states
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return <ScannerView onScan={handleScan} />;
};

// Use TypeScript interfaces
interface Product {
  upc: string;
  name: string;
  ingredients: string[];
  allergens: string[];
}
```

### Code Style
- **TypeScript**: Strict mode, proper typing
- **ESLint**: Enforce code quality rules
- **Prettier**: Consistent code formatting
- **Naming**: camelCase for variables, PascalCase for components

### Performance Guidelines
- **Optimize Images**: Use appropriate formats and sizes
- **Lazy Loading**: Load screens and components on demand
- **Memory Management**: Clean up listeners and timers
- **Bundle Size**: Monitor and optimize app size

## 🧪 Testing Approach

### Test Types
- **Unit Tests**: Individual functions and components
- **Integration Tests**: Service interactions and API calls
- **E2E Tests**: Complete user workflows
- **Manual Testing**: Physical device testing

### Testing Tools
```bash
# Unit testing
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report

# E2E testing (future)
npm run test:e2e           # End-to-end tests
```

### Test Coverage Goals
- **Overall**: 80% minimum
- **Critical Paths**: 90%+ (scanning, dietary analysis)
- **Business Logic**: 95%+ (compliance checking)

## 🔐 Security & Privacy

### Data Protection
- **Local Encryption**: User profiles encrypted with device keychain
- **Data Minimization**: Only store necessary dietary restrictions
- **No PII**: Avoid storing personal health information
- **GDPR Compliance**: Right to deletion and data portability

### API Security
- **Environment Variables**: Never commit API keys
- **HTTPS Only**: All external communications encrypted
- **Input Validation**: Sanitize all user inputs
- **Error Handling**: Don't expose sensitive information

## 📊 Performance Targets

### Response Times
- **Barcode Recognition**: <1 second
- **Product Lookup**: <2 seconds (cached), <5 seconds (API)
- **AI Analysis**: <3 seconds
- **App Launch**: <2 seconds to scanner ready

### Quality Metrics
- **Crash Rate**: <0.1% of sessions
- **Error Rate**: <1% of scans
- **User Rating**: >4.5 stars target
- **Battery Impact**: <5% drain per hour

## 🎯 Hackathon Success Criteria

### MVP Features (Must Have)
- [ ] **Barcode Scanning** - UPC recognition with camera
- [ ] **Product Lookup** - Database search and API integration
- [ ] **Dietary Analysis** - Basic allergen detection
- [ ] **User Profile** - Dietary restrictions setup
- [ ] **Alert System** - Color-coded safety warnings
- [ ] **Offline Core** - Basic functionality without internet

### Demo Features (Should Have)
- [ ] **Scan History** - Previous scan results
- [ ] **Product Favorites** - Save frequently scanned items
- [ ] **Multiple Profiles** - Family member support
- [ ] **Detailed Analysis** - Ingredient breakdown

### Stretch Goals (Nice to Have)
- [ ] **Image Recognition** - Package photo analysis
- [ ] **Social Features** - Share safe products
- [ ] **Advanced AI** - Personalized recommendations

## 🤝 Team Communication

### Daily Standups (15 minutes)
- **What did you accomplish yesterday?**
- **What will you work on today?**
- **Any blockers or help needed?**

### Communication Channels
- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Questions and ideas
- **Team Chat**: Real-time coordination
- **Video Calls**: Complex discussions and pair programming

### Knowledge Sharing
- **Code Reviews**: Learn from each other's code
- **Documentation**: Update docs as you learn
- **Pair Programming**: Work together on complex features
- **Demo Sessions**: Show progress to team

## 🆘 Getting Help

### Internal Resources
1. **Team Members**: Ask questions in team chat
2. **Documentation**: Check `/docs` folder and README files
3. **Code Examples**: Look at existing implementations
4. **Troubleshooting Guide**: `TROUBLESHOOTING.md`

### External Resources
- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Expo Documentation](https://docs.expo.dev/)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Debugging Tools
```bash
# React Native debugging
npx react-native log-ios      # iOS logs
npx react-native log-android  # Android logs

# Expo debugging
expo start --clear            # Clear cache
expo doctor                   # Check configuration

# Environment debugging
node -e "console.log(process.env)" # Check env vars
```

## ✅ Onboarding Checklist

### Environment Setup
- [ ] Node.js 18+ installed and verified
- [ ] Expo CLI installed globally
- [ ] Git configured with name and email
- [ ] VS Code with recommended extensions
- [ ] Android Studio (or Expo Go for iOS testing)

### Project Setup
- [ ] Repository cloned and dependencies installed
- [ ] Environment variables configured
- [ ] App runs on iOS simulator/device
- [ ] App runs on Android emulator/device
- [ ] Can scan barcodes on physical device

### Team Integration
- [ ] Added to team communication channels
- [ ] GitHub access configured
- [ ] Familiar with project structure
- [ ] Understands development workflow
- [ ] Knows how to get help

### Development Ready
- [ ] Can create branches and make commits
- [ ] Code linting and formatting work
- [ ] Tests run successfully
- [ ] Understands coding standards
- [ ] Ready to contribute to features

## 🎉 Welcome to the Team!

You're now ready to contribute to SMARTIES! Here's what to do next:

1. **Explore the Codebase**: Familiarize yourself with the project structure
2. **Run the App**: Test barcode scanning on a physical device
3. **Pick Your First Task**: Check `.kiro/specs/` for feature requirements
4. **Ask Questions**: Don't hesitate to reach out to team members
5. **Start Coding**: Begin implementing your assigned features

### Your First Contribution
1. Find a small bug fix or documentation improvement
2. Create a branch and make the change
3. Submit a pull request
4. Get it reviewed and merged
5. Celebrate your first contribution! 🎊

**Let's build something amazing together!** 🛡️📱

---

**Questions?** Reach out to any team member - we're here to help you succeed!