// Test data builders for consistent test data across the application

export interface TestProduct {
  id: string;
  upc: string;
  name: string;
  ingredients: string[];
  allergens: string[];
  nutritionalInfo?: {
    calories: number;
    sodium: number;
    sugar: number;
  };
}

export interface TestUserProfile {
  id: string;
  email: string;
  allergens: string[];
  dietaryRestrictions: string[];
  medicalConditions: string[];
}

export interface TestScanResult {
  id: string;
  productId: string;
  userId: string;
  timestamp: Date;
  isCompliant: boolean;
  violations: string[];
  warnings: string[];
}

export class TestProductBuilder {
  private product: TestProduct = {
    id: '1',
    upc: '1234567890123',
    name: 'Test Product',
    ingredients: ['water', 'sugar'],
    allergens: [],
  };

  withId(id: string): TestProductBuilder {
    this.product.id = id;
    return this;
  }

  withUpc(upc: string): TestProductBuilder {
    this.product.upc = upc;
    return this;
  }

  withName(name: string): TestProductBuilder {
    this.product.name = name;
    return this;
  }

  withIngredients(ingredients: string[]): TestProductBuilder {
    this.product.ingredients = ingredients;
    return this;
  }

  withAllergens(allergens: string[]): TestProductBuilder {
    this.product.allergens = allergens;
    return this;
  }

  withNutritionalInfo(info: TestProduct['nutritionalInfo']): TestProductBuilder {
    this.product.nutritionalInfo = info;
    return this;
  }

  build(): TestProduct {
    return { ...this.product };
  }

  static create(): TestProductBuilder {
    return new TestProductBuilder();
  }

  // Common test products
  static milkProduct(): TestProduct {
    return TestProductBuilder.create()
      .withName('Milk Chocolate Bar')
      .withIngredients(['milk', 'cocoa', 'sugar'])
      .withAllergens(['milk'])
      .build();
  }

  static nutProduct(): TestProduct {
    return TestProductBuilder.create()
      .withName('Peanut Butter')
      .withIngredients(['peanuts', 'salt', 'oil'])
      .withAllergens(['peanuts'])
      .build();
  }

  static safeProduct(): TestProduct {
    return TestProductBuilder.create()
      .withName('Plain Rice')
      .withIngredients(['rice'])
      .withAllergens([])
      .build();
  }
}

export class TestUserProfileBuilder {
  private profile: TestUserProfile = {
    id: '1',
    email: 'test@example.com',
    allergens: [],
    dietaryRestrictions: [],
    medicalConditions: [],
  };

  withId(id: string): TestUserProfileBuilder {
    this.profile.id = id;
    return this;
  }

  withEmail(email: string): TestUserProfileBuilder {
    this.profile.email = email;
    return this;
  }

  withAllergens(allergens: string[]): TestUserProfileBuilder {
    this.profile.allergens = allergens;
    return this;
  }

  withDietaryRestrictions(restrictions: string[]): TestUserProfileBuilder {
    this.profile.dietaryRestrictions = restrictions;
    return this;
  }

  withMedicalConditions(conditions: string[]): TestUserProfileBuilder {
    this.profile.medicalConditions = conditions;
    return this;
  }

  build(): TestUserProfile {
    return { ...this.profile };
  }

  static create(): TestUserProfileBuilder {
    return new TestUserProfileBuilder();
  }

  // Common test profiles
  static milkAllergic(): TestUserProfile {
    return TestUserProfileBuilder.create()
      .withAllergens(['milk'])
      .build();
  }

  static nutAllergic(): TestUserProfile {
    return TestUserProfileBuilder.create()
      .withAllergens(['peanuts', 'tree nuts'])
      .build();
  }

  static vegan(): TestUserProfile {
    return TestUserProfileBuilder.create()
      .withDietaryRestrictions(['vegan'])
      .build();
  }

  static diabetic(): TestUserProfile {
    return TestUserProfileBuilder.create()
      .withMedicalConditions(['diabetes'])
      .build();
  }
}

export class TestScanResultBuilder {
  private result: TestScanResult = {
    id: '1',
    productId: '1',
    userId: '1',
    timestamp: new Date(),
    isCompliant: true,
    violations: [],
    warnings: [],
  };

  withId(id: string): TestScanResultBuilder {
    this.result.id = id;
    return this;
  }

  withProductId(productId: string): TestScanResultBuilder {
    this.result.productId = productId;
    return this;
  }

  withUserId(userId: string): TestScanResultBuilder {
    this.result.userId = userId;
    return this;
  }

  withTimestamp(timestamp: Date): TestScanResultBuilder {
    this.result.timestamp = timestamp;
    return this;
  }

  withCompliance(isCompliant: boolean): TestScanResultBuilder {
    this.result.isCompliant = isCompliant;
    return this;
  }

  withViolations(violations: string[]): TestScanResultBuilder {
    this.result.violations = violations;
    this.result.isCompliant = violations.length === 0;
    return this;
  }

  withWarnings(warnings: string[]): TestScanResultBuilder {
    this.result.warnings = warnings;
    return this;
  }

  build(): TestScanResult {
    return { ...this.result };
  }

  static create(): TestScanResultBuilder {
    return new TestScanResultBuilder();
  }

  // Common test results
  static safeResult(): TestScanResult {
    return TestScanResultBuilder.create()
      .withCompliance(true)
      .build();
  }

  static violationResult(violations: string[]): TestScanResult {
    return TestScanResultBuilder.create()
      .withViolations(violations)
      .build();
  }
}
