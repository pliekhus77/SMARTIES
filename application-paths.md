# SMARTIES Application User Paths

## 1. App Launch & Onboarding

**Path:** Launch App → Onboarding Flow

- Set up dietary restrictions (allergies, medical, religious, lifestyle)
- Select severity levels (e.g., severe allergy, mild intolerance)
- Set notification preferences (e.g., push alerts for violations)
- Option to create family profiles (multiple restriction sets)
- Temporary restrictions (e.g., pregnancy, medication)

## 2. Home Screen Navigation

**Path:** Home Screen

- Primary entry: "Scan Barcode" button
- Access recent scans and history
- Quick links to profile, favorites, and settings

## 3. Barcode Scanning & Product Lookup

**Path:** Tap "Scan Barcode" → Camera opens

- Scan UPC barcode (or fallback to image OCR)
- App performs product lookup (Open Food Facts, USDA, manual submissions)
- If offline: uses cached product data and user profile

## 4. Dietary Analysis & Alerts

**Path:** After scan → Analyze product ingredients

**AI pipeline:** Vector similarity search → RAG context → LLM analysis

**Compliance logic:**
- **Strict Mode:** Any violation triggers red warning (allergy/medical)
- **Flexible Mode:** Warnings with user choice (lifestyle preferences)
- **Ingredient hierarchy:** checks base, additives, cross-contamination
- **Certification priority:** certified labels override ingredient analysis

**Alert display:**
- 🔴 **Red:** Violation/Danger (e.g., severe allergy detected)
- 🟡 **Yellow:** Caution (possible risk or uncertainty)
- 🟢 **Green:** Safe (compliant with all restrictions)

**User actions:**
- Save product to history
- Mark as favorite
- Report issue/correction

## 5. Profile Management

**Path:** Profile Screen

- View and edit dietary restrictions
- Update severity levels and notification preferences
- Switch between family profiles
- Immediate re-analysis of saved products after profile update

## 6. Scan History & Analytics

**Path:** History Screen

- View list of scanned products with alert status
- Access analytics (e.g., most scanned, most flagged)
- Option to re-scan or review previous alerts

## 7. Settings & Accessibility

**Path:** Settings Screen

- Configure app preferences (language, notifications, privacy)
- Enable accessibility features (VoiceOver/TalkBack)
- Manage offline data and cache
- Data privacy controls (GDPR: deletion, portability)

## 8. Error Handling & Fallbacks

**Path:** Any scan or lookup failure

- Graceful degradation: show cached data when offline
- Manual product entry if barcode/image fails
- Clear error messages with suggested actions
- Logging for error tracking and product improvement

## 9. Contribution & Feedback

**Path:** Report Issue / Suggest Correction

- Submit ingredient corrections or product data
- Moderation and verification before updates
- User contributions tracked for quality scoring

## 10. Advanced Features (Future Phases)

- **Phase 2:** Package image recognition, improved AI accuracy, family profiles
- **Phase 3:** Plate/meal image recognition, restaurant menu integration, recipe analysis

## Summary Table: SMARTIES User Paths

| Entry Point | Main Actions | Decision Points / Outcomes | Next Steps / Screens |
|-------------|--------------|---------------------------|---------------------|
| App Launch | Onboarding, profile setup | Family/temporary profiles | Home Screen |
| Home Screen | Scan barcode, view history | Scan or navigate to other screens | ScanScreen, HistoryScreen |
| ScanScreen | Barcode/image scan | Alert: Red/Yellow/Green | Save/report/favorite/history |
| ProfileScreen | Edit restrictions, switch profiles | Immediate re-analysis | History, Home |
| HistoryScreen | Review scans, analytics | Re-scan, review alerts | ScanScreen, ProfileScreen |
| SettingsScreen | Configure preferences, privacy | Accessibility, offline mode | Home, Profile |
| Error Handling | Manual entry, fallback | Show cached data, error message | Home, ScanScreen |
| Contribution | Report issue, suggest correction | Moderation, update product data | Home, History |
