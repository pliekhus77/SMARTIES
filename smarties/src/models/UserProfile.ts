/**
 * User profile data model
 * Represents user dietary restrictions and preferences
 */

export interface DietaryRestrictions {
  allergies: string[];
  medical: string[];
  religious: string[];
  lifestyle: string[];
}

export interface UserPreferences {
  strict_mode: boolean;
  notification_level: 'high' | 'medium' | 'low';
  language: string;
  theme?: 'light' | 'dark' | 'auto';
  sound_enabled?: boolean;
  vibration_enabled?: boolean;
}

export interface UserProfile {
  _id?: string;
  user_id: string;
  dietary_restrictions: DietaryRestrictions;
  preferences: UserPreferences;
  created_at: Date;
  last_active: Date;
  profile_version?: number;
}

export class UserProfileModel implements UserProfile {
  _id: string;
  user_id: string;
  dietary_restrictions: DietaryRestrictions;
  preferences: UserPreferences;
  created_at: Date;
  last_active: Date;
  profile_version?: number;

  constructor(data: UserProfile) {
    this._id = data._id ?? '';
    this.user_id = data.user_id;
    this.dietary_restrictions = data.dietary_restrictions;
    this.preferences = data.preferences;
    this.created_at = data.created_at;
    this.last_active = data.last_active;
    this.profile_version = data.profile_version || 1;
  }

  /**
   * Get all dietary restrictions as a flat array
   */
  getAllRestrictions(): string[] {
    return [
      ...this.dietary_restrictions.allergies,
      ...this.dietary_restrictions.medical,
      ...this.dietary_restrictions.religious,
      ...this.dietary_restrictions.lifestyle
    ];
  }

  /**
   * Check if user has specific restriction
   */
  hasRestriction(restriction: string): boolean {
    return this.getAllRestrictions().some(r => 
      r.toLowerCase() === restriction.toLowerCase()
    );
  }

  /**
   * Add new dietary restriction
   */
  addRestriction(type: keyof DietaryRestrictions, restriction: string): void {
    if (!this.dietary_restrictions[type].includes(restriction)) {
      this.dietary_restrictions[type].push(restriction);
      this.updateLastActive();
    }
  }

  /**
   * Remove dietary restriction
   */
  removeRestriction(type: keyof DietaryRestrictions, restriction: string): void {
    const index = this.dietary_restrictions[type].indexOf(restriction);
    if (index > -1) {
      this.dietary_restrictions[type].splice(index, 1);
      this.updateLastActive();
    }
  }

  /**
   * Update user preferences
   */
  updatePreferences(newPreferences: Partial<UserPreferences>): void {
    this.preferences = { ...this.preferences, ...newPreferences };
    this.updateLastActive();
  }

  /**
   * Update last active timestamp
   */
  updateLastActive(): void {
    this.last_active = new Date();
  }

  /**
   * Check if profile is complete (has at least one restriction)
   */
  isProfileComplete(): boolean {
    return this.getAllRestrictions().length > 0;
  }

  /**
   * Get profile completeness percentage
   */
  getProfileCompleteness(): number {
    let completeness = 0;
    
    // Basic info (always present)
    completeness += 20;
    
    // Has restrictions
    if (this.getAllRestrictions().length > 0) {
      completeness += 40;
    }
    
    // Has preferences configured
    if (this.preferences.notification_level && this.preferences.language) {
      completeness += 20;
    }
    
    // Has multiple types of restrictions
    const restrictionTypes = [
      this.dietary_restrictions.allergies.length > 0,
      this.dietary_restrictions.medical.length > 0,
      this.dietary_restrictions.religious.length > 0,
      this.dietary_restrictions.lifestyle.length > 0
    ].filter(Boolean).length;
    
    completeness += Math.min(20, restrictionTypes * 5);
    
    return Math.min(100, completeness);
  }

  /**
   * Get days since profile creation
   */
  getProfileAge(): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - this.created_at.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if user is active (used within last 30 days)
   */
  isActiveUser(): boolean {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - this.last_active.getTime());
    const daysSinceActive = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return daysSinceActive <= 30;
  }
}