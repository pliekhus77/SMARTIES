# Design Document

## Overview

The enhanced profile screen will provide a modern, intuitive interface for managing dietary restrictions with visual consistency matching the ScanScreen design. The screen will feature a blue gradient background, prominent SMARTIES logo, and interactive slider controls for managing allergen severity levels. The design emphasizes accessibility, smooth animations, and immediate feedback to create an engaging user experience.

## Architecture

### Component Hierarchy

```
ProfileScreen
├── SafeAreaView (container)
├── Header
│   ├── LogoContainer
│   └── Title ("My Dietary Restrictions")
├── ScrollView (main content)
│   ├── RestrictionCard[] (dynamic list)
│   │   ├── AllergenIcon
│   │   ├── AllergenName
│   │   ├── SeveritySlider
│   │   ├── NotesSection
│   │   └── DeleteButton
│   └── AddRestrictionButton
└── NavigationBar (inherited)
```

### State Management

```typescript
interface ProfileScreenState {
  restrictions: DietaryRestriction[];
  isLoading: boolean;
  isEditing: boolean;
  selectedRestriction: string | null;
}

interface DietaryRestriction {
  id: string;
  name: string;
  icon: string;
  severity: SeverityLevel;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

enum SeverityLevel {
  IRRITATION = 'irritation',
  SEVERE = 'severe',
  ANAPHYLACTIC = 'anaphylactic'
}
```

## Components and Interfaces

### ProfileScreen Component

**Purpose:** Main container component managing the overall profile interface
**Props:** Navigation props from React Navigation
**State:** User's dietary restrictions, loading states, editing modes

```typescript
interface ProfileScreenProps {
  navigation: NavigationProp<any>;
  route: RouteProp<any>;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation, route }) => {
  // Component implementation
};
```

### RestrictionCard Component

**Purpose:** Individual card displaying allergen information with interactive controls
**Props:** Restriction data, callback functions for updates
**Features:** Slider control, notes editing, delete functionality

```typescript
interface RestrictionCardProps {
  restriction: DietaryRestriction;
  onSeverityChange: (id: string, severity: SeverityLevel) => void;
  onNotesChange: (id: string, notes: string) => void;
  onDelete: (id: string) => void;
}
```

### SeveritySlider Component

**Purpose:** Custom slider component for selecting allergen severity levels
**Features:** Three-point scale, color-coded feedback, haptic response
**Styling:** Matches the design mockup with smooth transitions

```typescript
interface SeveritySliderProps {
  value: SeverityLevel;
  onChange: (severity: SeverityLevel) => void;
  disabled?: boolean;
}
```

### AllergenIcon Component

**Purpose:** Displays appropriate icon for each allergen type
**Features:** Consistent sizing, color theming, accessibility labels

```typescript
interface AllergenIconProps {
  allergenType: string;
  size?: number;
  color?: string;
}
```

## Data Models

### DietaryRestriction Model

```typescript
export interface DietaryRestriction {
  id: string;
  name: string;
  type: AllergenType;
  severity: SeverityLevel;
  notes: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum AllergenType {
  PEANUTS = 'peanuts',
  TREE_NUTS = 'tree_nuts',
  MILK = 'milk',
  EGGS = 'eggs',
  FISH = 'fish',
  SHELLFISH = 'shellfish',
  SOY = 'soy',
  WHEAT = 'wheat',
  SESAME = 'sesame',
  GLUTEN = 'gluten'
}

export enum SeverityLevel {
  IRRITATION = 'irritation',
  SEVERE = 'severe',
  ANAPHYLACTIC = 'anaphylactic'
}
```

### Profile Service Interface

```typescript
export interface IProfileService {
  getUserRestrictions(): Promise<DietaryRestriction[]>;
  updateRestriction(restriction: DietaryRestriction): Promise<void>;
  addRestriction(restriction: Omit<DietaryRestriction, 'id' | 'createdAt' | 'updatedAt'>): Promise<DietaryRestriction>;
  deleteRestriction(id: string): Promise<void>;
  syncProfile(): Promise<void>;
}
```

## Error Handling

### Error Types

```typescript
export enum ProfileErrorType {
  NETWORK_ERROR = 'network_error',
  VALIDATION_ERROR = 'validation_error',
  STORAGE_ERROR = 'storage_error',
  SYNC_ERROR = 'sync_error'
}

export interface ProfileError {
  type: ProfileErrorType;
  message: string;
  details?: any;
}
```

### Error Handling Strategy

1. **Network Errors:** Show offline indicator, queue changes for sync
2. **Validation Errors:** Inline validation with clear error messages
3. **Storage Errors:** Fallback to memory storage, warn user
4. **Sync Conflicts:** Present conflict resolution options to user

### Error Recovery

- Automatic retry for network operations
- Local storage backup for critical data
- Graceful degradation when services unavailable
- Clear user communication about error states

## Testing Strategy

### Unit Testing

**Components to Test:**
- ProfileScreen state management
- RestrictionCard interactions
- SeveritySlider value changes
- AllergenIcon rendering
- Profile service operations

**Test Scenarios:**
- Slider value updates trigger correct callbacks
- Notes editing saves properly
- Delete confirmation works correctly
- Add restriction flow completes successfully
- Error states display appropriate messages

### Integration Testing

**Service Integration:**
- Profile data loading from storage
- Real-time sync with backend
- Offline mode functionality
- Cross-device synchronization

**UI Integration:**
- Navigation between screens
- Keyboard and accessibility interactions
- Animation performance
- Memory usage optimization

### Accessibility Testing

**Screen Reader Testing:**
- All elements properly labeled
- Logical navigation order
- Severity changes announced
- Error messages accessible

**Motor Accessibility:**
- Slider alternative input methods
- Large touch targets
- Voice control compatibility
- Switch navigation support

## Visual Design Specifications

### Color Scheme

```typescript
export const ProfileColors = {
  background: '#1E88E5', // Primary blue gradient
  backgroundSecondary: '#1976D2', // Darker blue for gradient
  cardBackground: 'rgba(255, 255, 255, 0.15)',
  cardBorder: 'rgba(255, 255, 255, 0.3)',
  text: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  
  // Severity colors
  irritation: '#4CAF50', // Green
  severe: '#FF9800', // Orange
  anaphylactic: '#F44336', // Red
  
  // Interactive elements
  buttonPrimary: '#FFFFFF',
  buttonSecondary: 'rgba(255, 255, 255, 0.15)',
  deleteButton: '#F44336'
};
```

### Typography

```typescript
export const ProfileTypography = {
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF'
  },
  severityLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF'
  },
  notes: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontStyle: 'italic'
  }
};
```

### Layout Specifications

```typescript
export const ProfileLayout = {
  headerPadding: { top: 20, bottom: 20, horizontal: 0 },
  cardMargin: { horizontal: 20, vertical: 10 },
  cardPadding: { horizontal: 20, vertical: 16 },
  cardBorderRadius: 16,
  sliderHeight: 40,
  iconSize: 48,
  addButtonSize: 60,
  deleteButtonSize: 24
};
```

### Animation Specifications

```typescript
export const ProfileAnimations = {
  cardEntry: {
    duration: 300,
    easing: 'easeOutCubic',
    transform: 'translateY(50) -> translateY(0)',
    opacity: '0 -> 1'
  },
  sliderChange: {
    duration: 200,
    easing: 'easeInOutQuad',
    hapticFeedback: 'light'
  },
  cardDelete: {
    duration: 250,
    easing: 'easeInCubic',
    transform: 'scale(1) -> scale(0.8)',
    opacity: '1 -> 0'
  }
};
```

## Performance Considerations

### Optimization Strategies

1. **Lazy Loading:** Load restriction icons on demand
2. **Memoization:** Cache expensive calculations and renders
3. **Virtualization:** Use FlatList for large restriction lists
4. **Debouncing:** Debounce slider changes to reduce updates
5. **Image Optimization:** Use optimized icon assets

### Memory Management

- Proper cleanup of event listeners
- Efficient state updates to prevent re-renders
- Image caching for allergen icons
- Garbage collection of unused components

### Performance Targets

- **Initial Load:** < 500ms to first meaningful paint
- **Slider Response:** < 16ms for smooth 60fps animations
- **Memory Usage:** < 50MB additional memory footprint
- **Battery Impact:** Minimal background processing

## Security Considerations

### Data Protection

- Encrypt sensitive health information locally
- Use secure storage for user preferences
- Implement proper session management
- Validate all user inputs

### Privacy Compliance

- GDPR compliance for EU users
- HIPAA considerations for health data
- Clear data usage policies
- User consent for data collection

## Implementation Notes

### Development Phases

**Phase 1:** Basic UI structure and static content
**Phase 2:** Interactive sliders and state management
**Phase 3:** Notes editing and persistence
**Phase 4:** Add/delete functionality
**Phase 5:** Accessibility and polish

### Technical Dependencies

- React Native Slider component or custom implementation
- Haptic feedback library
- Icon library (react-native-vector-icons)
- Animation library (react-native-reanimated)
- Storage service (AsyncStorage or Realm)

### Integration Points

- Profile service for data persistence
- Navigation service for screen transitions
- Notification service for sync status
- Analytics service for usage tracking