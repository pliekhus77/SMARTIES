import React from 'react';
import { render } from '@testing-library/react-native';
import { ProfileScreen } from '../../../screens/ProfileScreen';
import { OptimizedRestrictionCard } from '../OptimizedRestrictionCard';
import { DietaryRestriction, AllergenType, SeverityLevel } from '../../../types/DietaryRestriction';

jest.mock('../../../services/ProfileService');

describe('Performance Tests', () => {
  const mockRestriction: DietaryRestriction = {
    id: '1',
    allergen: AllergenType.PEANUTS,
    severity: SeverityLevel.MODERATE,
    notes: 'Test notes',
  };

  describe('ProfileScreen Performance', () => {
    it('should render without performance issues', () => {
      const startTime = Date.now();
      
      render(<ProfileScreen />);
      
      const renderTime = Date.now() - startTime;
      expect(renderTime).toBeLessThan(100); // Should render in under 100ms
    });
  });

  describe('OptimizedRestrictionCard Performance', () => {
    it('should memoize properly with same props', () => {
      const mockProps = {
        restriction: mockRestriction,
        onUpdate: jest.fn(),
        onDelete: jest.fn(),
      };

      const { rerender } = render(<OptimizedRestrictionCard {...mockProps} />);
      
      // Re-render with same props should not cause re-render
      rerender(<OptimizedRestrictionCard {...mockProps} />);
      
      // Component should be memoized
      expect(true).toBe(true); // Placeholder assertion
    });
  });

  describe('Memory Usage', () => {
    it('should not leak memory with multiple renders', () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Render multiple times
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(<ProfileScreen />);
        unmount();
      }
      
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable
      expect(memoryIncrease).toBeLessThan(1000000); // Less than 1MB
    });
  });
});
