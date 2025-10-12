/**
 * Family Profile Management Service
 * Implements Requirements 11.5 from vector search specification
 */

import { UserProfile, DietaryRestriction } from '../types/core';

export interface FamilyProfile {
  id: string;
  name: string;
  members: UserProfile[];
  sharedRestrictions: DietaryRestriction[];
  conflictResolution: ConflictResolutionStrategy;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConflictResolutionStrategy {
  prioritizeHighSeverity: boolean;
  combineRestrictions: boolean;
  defaultToSafest: boolean;
}

export interface FamilyAnalysisConfig {
  includeAllMembers: boolean;
  resolveConflicts: boolean;
  generateHouseholdSummary: boolean;
}

export class FamilyProfileService {
  private families = new Map<string, FamilyProfile>();

  /**
   * Create new family profile
   */
  createFamily(name: string, members: UserProfile[]): FamilyProfile {
    const family: FamilyProfile = {
      id: `family-${Date.now()}`,
      name,
      members,
      sharedRestrictions: this.identifySharedRestrictions(members),
      conflictResolution: {
        prioritizeHighSeverity: true,
        combineRestrictions: true,
        defaultToSafest: true
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.families.set(family.id, family);
    return family;
  }

  /**
   * Add member to family
   */
  addFamilyMember(familyId: string, member: UserProfile): void {
    const family = this.families.get(familyId);
    if (!family) throw new Error('Family not found');

    family.members.push(member);
    family.sharedRestrictions = this.identifySharedRestrictions(family.members);
    family.updatedAt = new Date();
  }

  /**
   * Get family-wide dietary restrictions
   */
  getFamilyRestrictions(familyId: string): DietaryRestriction[] {
    const family = this.families.get(familyId);
    if (!family) return [];

    const allRestrictions = new Map<string, DietaryRestriction>();

    // Collect all unique restrictions
    for (const member of family.members) {
      for (const restriction of member.restrictions) {
        const key = `${restriction.type}:${restriction.name}`;
        const existing = allRestrictions.get(key);

        if (!existing || this.getRestrictionPriority(restriction) > this.getRestrictionPriority(existing)) {
          allRestrictions.set(key, restriction);
        }
      }
    }

    return Array.from(allRestrictions.values());
  }

  /**
   * Resolve conflicts between family member restrictions
   */
  resolveRestrictionConflicts(familyId: string): DietaryRestriction[] {
    const family = this.families.get(familyId);
    if (!family) return [];

    const restrictions = this.getFamilyRestrictions(familyId);
    
    if (!family.conflictResolution.defaultToSafest) {
      return restrictions;
    }

    // Apply safety-first conflict resolution
    return restrictions.map(restriction => ({
      ...restriction,
      severity: 'high' as const, // Default to highest safety level
      notes: `${restriction.notes} (Family safety-first policy)`
    }));
  }

  /**
   * Generate household dietary summary
   */
  generateHouseholdSummary(familyId: string): {
    totalMembers: number;
    uniqueRestrictions: number;
    highSeverityCount: number;
    commonRestrictions: string[];
    riskProfile: 'low' | 'medium' | 'high';
  } {
    const family = this.families.get(familyId);
    if (!family) {
      return {
        totalMembers: 0,
        uniqueRestrictions: 0,
        highSeverityCount: 0,
        commonRestrictions: [],
        riskProfile: 'low'
      };
    }

    const allRestrictions = this.getFamilyRestrictions(familyId);
    const highSeverity = allRestrictions.filter(r => r.severity === 'high');
    const sharedRestrictions = family.sharedRestrictions.map(r => r.name);

    let riskProfile: 'low' | 'medium' | 'high' = 'low';
    if (highSeverity.length > 3) riskProfile = 'high';
    else if (highSeverity.length > 1) riskProfile = 'medium';

    return {
      totalMembers: family.members.length,
      uniqueRestrictions: allRestrictions.length,
      highSeverityCount: highSeverity.length,
      commonRestrictions: sharedRestrictions,
      riskProfile
    };
  }

  /**
   * Identify shared restrictions across family members
   */
  private identifySharedRestrictions(members: UserProfile[]): DietaryRestriction[] {
    if (members.length < 2) return [];

    const restrictionCounts = new Map<string, { restriction: DietaryRestriction; count: number }>();

    // Count occurrences of each restriction
    for (const member of members) {
      for (const restriction of member.restrictions) {
        const key = `${restriction.type}:${restriction.name}`;
        const existing = restrictionCounts.get(key);
        
        if (existing) {
          existing.count++;
        } else {
          restrictionCounts.set(key, { restriction, count: 1 });
        }
      }
    }

    // Return restrictions shared by multiple members
    return Array.from(restrictionCounts.values())
      .filter(item => item.count > 1)
      .map(item => item.restriction);
  }

  /**
   * Get restriction priority for conflict resolution
   */
  private getRestrictionPriority(restriction: DietaryRestriction): number {
    const severityScore = restriction.severity === 'high' ? 3 : restriction.severity === 'medium' ? 2 : 1;
    const typeScore = restriction.type === 'allergy' ? 3 : restriction.type === 'medical' ? 2 : 1;
    return severityScore * typeScore;
  }

  /**
   * Get all families
   */
  getAllFamilies(): FamilyProfile[] {
    return Array.from(this.families.values());
  }

  /**
   * Get family by ID
   */
  getFamily(familyId: string): FamilyProfile | undefined {
    return this.families.get(familyId);
  }
}
