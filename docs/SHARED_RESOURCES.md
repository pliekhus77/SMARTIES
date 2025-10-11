# SMARTIES Shared Development Resources

## 🔐 Access Credentials

### MongoDB Atlas Cluster
- **Cluster Name**: `smarties-hackathon-cluster`
- **Connection String**: `mongodb+srv://smarties-hackathon:[PASSWORD]@smarties-cluster.mongodb.net/smarties_hackathon?retryWrites=true&w=majority`
- **Database**: `smarties_hackathon`
- **Collections**: `products`, `users`, `scan_history`, `dietary_rules`
- **Access Level**: Read/Write for all team members
- **Network Access**: Configured for hackathon venue IP ranges

### AI Service APIs

#### OpenAI API
- **Organization**: SMARTIES Hackathon Team
- **API Key**: `sk-hackathon-[REDACTED-FOR-SECURITY]`
- **Model Access**: GPT-4, GPT-3.5-turbo
- **Rate Limits**: 1000 requests/hour, 50 requests/minute
- **Usage Monitoring**: Enabled with alerts at 80% usage

#### Anthropic API (Fallback)
- **API Key**: `sk-ant-hackathon-[REDACTED-FOR-SECURITY]`
- **Model Access**: Claude-3-haiku, Claude-3-sonnet
- **Rate Limits**: 500 requests/hour, 25 requests/minute
- **Usage**: Fallback when OpenAI is unavailable

### External APIs

#### Open Food Facts
- **Base URL**: `https://world.openfoodfacts.org/api/v0`
- **Authentication**: None required (public API)
- **Rate Limits**: 100 requests/minute (self-imposed)
- **Documentation**: https://wiki.openfoodfacts.org/API

#### USDA Food Data Central (Optional)
- **Base URL**: `https://api.nal.usda.gov/fdc/v1`
- **API Key**: `[OPTIONAL-FOR-HACKATHON]`
- **Usage**: Nutritional data enhancement

## 🛠️ Development Tools

### Code Repository
- **Platform**: GitHub
- **Repository**: `https://github.com/smarties-team/smarties-hackathon`
- **Main Branch**: `main`
- **Branch Protection**: Enabled (requires PR for main)
- **Access**: All team members have write access

### Communication
- **Slack Workspace**: SMARTIES Hackathon
- **Channels**:
  - `#general` - General discussion
  - `#smarties-dev` - Development questions
  - `#smarties-design` - UI/UX discussion
  - `#smarties-testing` - Testing and QA
- **Video Calls**: [Hackathon meeting room link]

### Project Management
- **Tool**: GitHub Projects
- **Board**: SMARTIES Hackathon Sprint
- **Access**: All team members can view/edit
- **Workflow**: To Do → In Progress → Review → Done

## 📱 Testing Devices

### iOS Testing
- **Simulators**: iPhone 15, iPhone 14, iPad Air
- **Physical Devices**: [Available at hackathon venue]
- **iOS Versions**: 17.0+, 16.0+ (compatibility)

### Android Testing
- **Emulators**: Pixel 8 (API 34), Pixel 7 (API 33)
- **Physical Devices**: [Available at hackathon venue]
- **Android Versions**: 14, 13, 12 (compatibility)

## 🔧 Environment Configuration

### Required Environment Variables
```bash
# Copy this to your .env file and fill in actual values

# MongoDB Atlas
MONGODB_URI=mongodb+srv://smarties-hackathon:[PASSWORD]@smarties-cluster.mongodb.net/smarties_hackathon
MONGODB_DATABASE=smarties_hackathon

# AI Services
OPENAI_API_KEY=sk-hackathon-[ACTUAL-KEY]
ANTHROPIC_API_KEY=sk-ant-hackathon-[ACTUAL-KEY]

# External APIs
OPEN_FOOD_FACTS_API_URL=https://world.openfoodfacts.org/api/v0
USDA_API_KEY=[OPTIONAL]

# Development Settings
NODE_ENV=development
LOG_LEVEL=debug
REACT_NATIVE_PACKAGER_HOSTNAME=localhost
```

### Security Notes
- **Never commit** `.env` files to git
- **Rotate keys** after hackathon
- **Use test data** only during development
- **Report security issues** immediately to technical lead

## 📊 Monitoring and Limits

### API Usage Monitoring
- **OpenAI**: Dashboard at https://platform.openai.com/usage
- **Anthropic**: Dashboard at https://console.anthropic.com/usage
- **MongoDB**: Atlas monitoring dashboard

### Rate Limits and Quotas
| Service | Hourly Limit | Daily Limit | Alert Threshold |
|---------|--------------|-------------|-----------------|
| OpenAI | 1000 requests | 10,000 requests | 80% |
| Anthropic | 500 requests | 2,000 requests | 80% |
| MongoDB | Unlimited | 500MB transfer | 400MB |
| Open Food Facts | 6,000 requests | 50,000 requests | N/A |

### Cost Management
- **Budget**: $200 total for hackathon
- **Current Usage**: [Monitor during event]
- **Alerts**: Set at $150 (75% of budget)

## 🚀 Deployment Resources

### Development Environment
- **Platform**: Local development only
- **Database**: Shared MongoDB Atlas cluster
- **APIs**: Shared API keys with rate limiting

### Demo Environment (Optional)
- **Platform**: Expo Go app for quick demos
- **Access**: QR code sharing for stakeholders
- **Limitations**: Limited to Expo-compatible features

## 📋 Team Access Checklist

### Before Hackathon
- [ ] GitHub repository access granted
- [ ] Slack workspace invitation sent
- [ ] MongoDB Atlas access configured
- [ ] API keys distributed securely
- [ ] Development environment tested

### During Hackathon
- [ ] All team members can clone repository
- [ ] Environment variables configured correctly
- [ ] Database connections working
- [ ] API calls successful
- [ ] Tests passing on all machines

## 🆘 Emergency Contacts

### Technical Issues
- **Technical Lead**: [Name] - [Phone] - [Slack: @handle]
- **DevOps Support**: [Name] - [Phone] - [Slack: @handle]

### Service Issues
- **MongoDB Atlas**: Support ticket system
- **OpenAI**: Status page at https://status.openai.com
- **Anthropic**: Status page at https://status.anthropic.com

### Hackathon Organizers
- **Event Coordinator**: [Name] - [Phone]
- **Technical Judge**: [Name] - [Slack: @handle]

## 📝 Usage Guidelines

### Best Practices
- **Test locally** before pushing code
- **Use descriptive** commit messages
- **Create feature branches** for new work
- **Request code reviews** for significant changes
- **Monitor API usage** to avoid hitting limits

### Prohibited Actions
- **Don't share** API keys outside the team
- **Don't commit** sensitive data to git
- **Don't exceed** API rate limits intentionally
- **Don't modify** shared database schema without approval

## 🔄 Resource Updates

This document will be updated during the hackathon as needed. Check for updates:
- **Morning standup**: Resource status review
- **Slack announcements**: Critical updates
- **Git commits**: Documentation changes

---

**Last Updated**: [Current Date]
**Maintained By**: Technical Lead
**Questions?** Post in #smarties-dev Slack channel
