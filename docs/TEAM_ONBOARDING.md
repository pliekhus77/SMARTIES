# SMARTIES Team Onboarding Guide

## 👋 Welcome to the SMARTIES Hackathon Team!

This guide will get you up and running quickly so you can contribute effectively during our hackathon.

## 🎯 Project Overview

**SMARTIES** (Scan‑based Mobile Allergen Risk Tracking & IntelligencE Suite) is a React Native app that helps users make safe dietary choices by scanning product barcodes and receiving real-time compliance alerts.

### Key Features
- **Instant Barcode Scanning**: Sub-3-second scan-to-result response
- **Dietary Analysis**: Allergies, religious restrictions, medical conditions, lifestyle preferences
- **Safety-First Alerts**: Red (danger), Yellow (caution), Green (safe)
- **AI-Powered**: MongoDB Atlas + OpenAI/Anthropic for intelligent analysis

## 🏗️ Architecture Overview

```
User Scans Barcode → Product Lookup → AI Analysis → Safety Alert → Store Result
     ↓                    ↓              ↓            ↓           ↓
  Camera API      MongoDB Atlas    OpenAI/Anthropic   UI Alert   Local Cache
```

### Technology Stack
- **Mobile**: React Native + TypeScript
- **Database**: MongoDB Atlas + Realm SDK
- **AI**: OpenAI/Anthropic APIs
- **Barcode**: expo-barcode-scanner
- **Data**: Open Food Facts API, USDA Food Data Central

## 👥 Team Structure and Roles

### Frontend Team (2-3 people)
**Responsibilities:**
- React Native UI components
- User experience and navigation
- Barcode scanner integration
- Alert and notification systems

**Key Files:**
- `src/components/` - Reusable UI components
- `src/screens/` - Main app screens
- `src/navigation/` - App navigation

**Skills Needed:**
- React Native / React
- TypeScript
- Mobile UI/UX design
- Component testing

### Backend/API Team (2-3 people)
**Responsibilities:**
- MongoDB Atlas integration
- AI service integration (OpenAI/Anthropic)
- External API integration (Open Food Facts)
- Business logic and data processing

**Key Files:**
- `src/services/` - API integrations and business logic
- `src/utils/` - Helper functions and utilities
- `src/models/` - Data models and schemas

**Skills Needed:**
- API integration
- Database operations
- AI/ML service integration
- Backend testing

### Platform Team (1-2 people)
**Responsibilities:**
- iOS/Android specific features
- Platform optimization
- Device-specific functionality
- Cross-platform testing

**Key Files:**
- `ios/` - iOS-specific code
- `android/` - Android-specific code
- `src/test/platform/` - Platform tests

**Skills Needed:**
- iOS/Android development
- Platform-specific APIs
- Performance optimization
- Cross-platform testing

### Testing/QA Team (1-2 people)
**Responsibilities:**
- Test coverage and quality
- Bug finding and reporting
- Manual testing on devices
- Test automation

**Key Files:**
- `src/test/` - All test files
- Test documentation and reports

**Skills Needed:**
- Testing frameworks (Jest)
- Manual testing
- Bug reporting
- Test automation

## 🚀 Getting Started (30 Minutes)

### Step 1: Environment Setup (10 minutes)
```bash
# Clone repository
git clone <repository-url>
cd SMARTIES

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### Step 2: Configure Credentials (5 minutes)
Edit `.env` file with shared credentials (see SHARED_RESOURCES.md):
```bash
MONGODB_URI=mongodb+srv://smarties-hackathon:[PASSWORD]@...
OPENAI_API_KEY=sk-hackathon-[KEY]
ANTHROPIC_API_KEY=sk-ant-hackathon-[KEY]
```

### Step 3: Verify Setup (10 minutes)
```bash
# Run tests to verify everything works
npm test

# Start development server
npm start
```

### Step 4: Platform Setup (5 minutes)
Choose your platform and run:
```bash
# For iOS (macOS only)
npm run ios

# For Android
npm run android
```

## 📚 Key Documentation

### Essential Reading (15 minutes)
1. **[README.md](../README.md)** - Project overview and features
2. **[HACKATHON_SETUP.md](../HACKATHON_SETUP.md)** - Development environment setup
3. **[SHARED_RESOURCES.md](./SHARED_RESOURCES.md)** - API keys and shared resources

### Architecture Documentation (30 minutes)
1. **[Project Structure](../README.md#project-structure)** - File organization
2. **[Technology Stack](../README.md#technology-stack)** - Tools and frameworks
3. **[Testing Strategy](../README.md#testing-strategy)** - How we test

### Code Guidelines (15 minutes)
1. **[TypeScript Standards](../README.md#typescript-requirements)** - Code style
2. **[Testing Requirements](../README.md#testing-requirements)** - Test coverage
3. **[Security Guidelines](../README.md#security-guidelines)** - Security practices

## 🛠️ Development Workflow

### Daily Workflow
1. **Morning Standup** (15 min)
   - What did you work on yesterday?
   - What will you work on today?
   - Any blockers or questions?

2. **Development** (6-7 hours)
   - Work on assigned tasks
   - Regular commits with descriptive messages
   - Ask questions in Slack when stuck

3. **End of Day** (15 min)
   - Push your work to feature branch
   - Update team on progress
   - Plan next day's work

### Git Workflow
```bash
# Start new feature
git checkout -b feature/your-feature-name

# Make changes and commit frequently
git add .
git commit -m "feat: add barcode scanning component"

# Push to remote branch
git push origin feature/your-feature-name

# Create pull request when ready
```

### Code Review Process
1. Create pull request with clear description
2. Request review from team member
3. Address feedback and update PR
4. Merge after approval

## 🧪 Testing Guidelines

### Test Types
- **Unit Tests**: Individual functions and components
- **Integration Tests**: Service interactions and workflows
- **Platform Tests**: iOS/Android specific functionality
- **Manual Tests**: Real device testing

### Running Tests
```bash
# Run all tests
npm test

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:platform

# Run tests with coverage
npm run test:coverage
```

### Writing Tests
- Write tests for new features
- Aim for 80%+ test coverage
- Use descriptive test names
- Test both happy path and error cases

## 🎨 UI/UX Guidelines

### Design Principles
- **Safety First**: Clear visual hierarchy for alerts
- **Accessibility**: Support for screen readers and high contrast
- **Speed**: Minimize taps and loading times
- **Cross-Platform**: Consistent experience on iOS and Android

### Color Scheme
- **Red**: Danger/Violation (allergen detected)
- **Yellow**: Warning/Caution (possible issue)
- **Green**: Safe (no issues detected)
- **Blue**: Information and navigation

### Component Library
Use existing components from `src/components/`:
- `ProductCard` - Display product information
- `DietaryAlert` - Show safety alerts
- `ScannerView` - Barcode scanning interface

## 🔧 Debugging and Troubleshooting

### Common Issues

#### Environment Setup
```bash
# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

#### iOS Issues
```bash
# Reset iOS simulator
xcrun simctl erase all

# Clean iOS build
cd ios && rm -rf build && cd ..
npm run ios
```

#### Android Issues
```bash
# Clean Android build
cd android && ./gradlew clean && cd ..
npm run android
```

#### API Issues
- Check `.env` file has correct credentials
- Verify network connectivity
- Check API usage limits in dashboards

### Getting Help
1. **Check documentation** first
2. **Search Slack history** for similar issues
3. **Ask in #smarties-dev** channel
4. **Pair program** with team member
5. **Escalate to technical lead** if stuck

## 📱 Testing on Devices

### iOS Testing
- Use iOS Simulator for development
- Test on physical iPhone when available
- Check different screen sizes (iPhone 15, iPhone SE)

### Android Testing
- Use Android Emulator for development
- Test on physical Android device when available
- Check different screen sizes and Android versions

### Manual Testing Checklist
- [ ] Barcode scanning works
- [ ] Product lookup displays results
- [ ] Dietary alerts show correctly
- [ ] Navigation flows smoothly
- [ ] App handles errors gracefully

## 🏆 Success Metrics

### Individual Success
- [ ] Environment setup completed
- [ ] Can run and modify the app
- [ ] Contributed meaningful code
- [ ] Helped team members when needed

### Team Success
- [ ] Working app demo ready
- [ ] Core features implemented
- [ ] Good test coverage
- [ ] Clean, maintainable code

### Hackathon Success
- [ ] Impressive demo presentation
- [ ] Technical innovation showcased
- [ ] Team collaboration evident
- [ ] Judges' questions answered confidently

## 📞 Communication Channels

### Slack Channels
- **#general** - General hackathon discussion
- **#smarties-dev** - Technical questions and updates
- **#smarties-design** - UI/UX discussion and feedback
- **#smarties-testing** - Testing coordination and bug reports

### Video Calls
- **Daily Standups**: 9:00 AM (15 minutes)
- **Technical Discussions**: As needed
- **Demo Prep**: Final day afternoon

### Emergency Contacts
- **Technical Lead**: [Name] - [Phone] - @handle
- **Team Lead**: [Name] - [Phone] - @handle

## 🎉 Tips for Success

### Technical Tips
- **Start simple** - Get basic functionality working first
- **Test early and often** - Don't wait until the end
- **Use existing code** - Build on the foundation we've created
- **Ask questions** - Better to ask than struggle alone

### Team Tips
- **Communicate frequently** - Keep everyone updated
- **Help each other** - Share knowledge and pair program
- **Stay positive** - Hackathons are challenging but fun
- **Celebrate wins** - Acknowledge progress and achievements

### Hackathon Tips
- **Manage scope** - Focus on core features first
- **Prepare demo** - Practice your presentation
- **Document decisions** - Keep track of what you built and why
- **Have fun** - Enjoy the experience and learn something new!

---

**Welcome to the team! Let's build something amazing together! 🚀**

**Questions?** Ask in #smarties-dev or reach out to the technical lead.
