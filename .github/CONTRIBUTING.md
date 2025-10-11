# Contributing to SMARTIES

Thank you for contributing to the SMARTIES hackathon project! This document provides guidelines for contributing to the codebase during our 24-hour hackathon.

## Quick Start for Hackathon

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/SMARTIES.git
   cd SMARTIES
   ```

2. **Set up the development environment**
   - Follow the setup instructions in the main README.md
   - Ensure you have Node.js 18+, React Native CLI/Expo CLI, and mobile SDKs installed

3. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Make your changes and commit**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **Push and create a pull request**
   ```bash
   git push origin feature/your-feature-name
   ```

## Hackathon Workflow

### Branch Strategy
- **main**: Production-ready code for demo
- **develop**: Integration branch for ongoing development
- **feature/**: Individual feature branches

### Commit Message Format
Use conventional commits for clarity:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Examples:
```
feat: add barcode scanning functionality
fix: resolve camera permission issue on Android
docs: update setup instructions for iOS
```

### Pull Request Process

1. **Create a descriptive PR title**
   - Use the format: `[TYPE] Brief description`
   - Example: `[FEAT] Add dietary restriction analysis`

2. **Fill out the PR template**
   - Describe what changes were made
   - List any testing performed
   - Include screenshots for UI changes

3. **Request review from team members**
   - At least one team member should review
   - Address any feedback promptly

4. **Merge after approval**
   - Use "Squash and merge" for clean history
   - Delete the feature branch after merging

### Code Standards

#### TypeScript
- Use strict TypeScript configuration
- Define interfaces for all data models
- Use proper typing for function parameters and return values

#### React Native
- Use functional components with hooks
- Follow the established folder structure
- Implement proper error handling and loading states

#### Testing
- Write unit tests for critical business logic
- Test on both iOS and Android platforms
- Include integration tests for API calls

### File Organization

```
smarties/
├── src/
│   ├── components/          # Reusable UI components
│   ├── screens/            # Main application screens
│   ├── services/           # Business logic and API calls
│   ├── models/             # Data models and types
│   ├── utils/              # Helper functions
│   └── config/             # Configuration files
├── tests/                  # Test files
└── docs/                   # Documentation
```

### Environment Setup

#### Required Tools
- Node.js 18+
- React Native CLI or Expo CLI
- iOS: Xcode and iOS Simulator
- Android: Android Studio and Android SDK
- Git

#### Environment Variables
- Copy `.env.example` to `.env`
- Add your API keys (never commit these!)
- MongoDB Atlas connection string
- OpenAI/Anthropic API keys

### Common Issues and Solutions

#### Build Issues
- **Metro bundler cache**: `npx react-native start --reset-cache`
- **Node modules**: Delete `node_modules` and run `npm install`
- **iOS build**: Clean build folder in Xcode

#### Platform-Specific Issues
- **Android permissions**: Check `android/app/src/main/AndroidManifest.xml`
- **iOS permissions**: Check `ios/SMARTIES/Info.plist`

### Getting Help

#### During Hackathon
- Ask questions in the team chat
- Pair program for complex features
- Share knowledge and solutions

#### Resources
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Expo Documentation](https://docs.expo.dev/)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [OpenAI API Documentation](https://platform.openai.com/docs)

### Code Review Checklist

#### For Authors
- [ ] Code follows project conventions
- [ ] All tests pass
- [ ] No console.log statements in production code
- [ ] Proper error handling implemented
- [ ] Documentation updated if needed

#### For Reviewers
- [ ] Code is readable and well-structured
- [ ] Business logic is correct
- [ ] Security considerations addressed
- [ ] Performance implications considered
- [ ] Mobile-specific considerations (battery, memory)

### Deployment

#### Development
- Changes to `develop` branch trigger automatic builds
- Test on both iOS and Android simulators

#### Production
- Only merge to `main` for demo-ready features
- Manual deployment for hackathon demo
- Ensure all team members can run the latest version

## Hackathon-Specific Guidelines

### Time Management
- Focus on MVP features first
- Use feature flags for incomplete work
- Document any technical debt for post-hackathon cleanup

### Communication
- Update the team on progress regularly
- Ask for help early if blocked
- Share useful discoveries and solutions

### Quality vs. Speed
- Prioritize working functionality over perfect code
- Write tests for critical paths only
- Document important decisions and trade-offs

### Demo Preparation
- Test the complete user flow before demo
- Prepare fallback plans for live demo issues
- Have screenshots/videos as backup

Remember: The goal is to build a working MVP in 24 hours while maintaining code quality and team collaboration!