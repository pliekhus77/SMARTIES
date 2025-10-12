import React from 'react';
import { render } from '@testing-library/react-native';
import { RestrictionCard } from '../RestrictionCard';
import { SeveritySlider } from '../SeveritySlider';
import { AddRestrictionButton } from '../AddRestrictionButton';
import { DietaryRestriction, AllergenType, SeverityLevel } from '../../../types/DietaryRestriction';

describe('Accessibility Tests', () => {
  const mockRestriction: DietaryRestriction = {
    id: '1',
    allergen: AllergenType.PEANUTS,
    severity: SeverityLevel.MODERATE,
    notes: 'Test notes',
  };

  describe('RestrictionCard Accessibility', () => {
    it('should have proper accessibility labels', () => {
      const { getByLabelText } = render(
        <RestrictionCard
          restriction={mockRestriction}
          onUpdate={jest.fn()}
          onDelete={jest.fn()}
        />
      );

      expect(getByLabelText('Delete peanuts restriction')).toBeTruthy();
    });
  });

  describe('SeveritySlider Accessibility', () => {
    it('should have accessibility state for selected option', () => {
      const { getByLabelText } = render(
        <SeveritySlider
          value={SeverityLevel.MODERATE}
          onChange={jest.fn()}
        />
      );

      const moderateButton = getByLabelText('Set severity to Moderate');
      expect(moderateButton.props.accessibilityState.selected).toBe(true);
    });

    it('should have proper labels for all severity levels', () => {
      const { getByLabelText } = render(
        <SeveritySlider
          value={SeverityLevel.MODERATE}
          onChange={jest.fn()}
        />
      );

      expect(getByLabelText('Set severity to Mild')).toBeTruthy();
      expect(getByLabelText('Set severity to Moderate')).toBeTruthy();
      expect(getByLabelText('Set severity to Severe')).toBeTruthy();
    });
  });

  describe('AddRestrictionButton Accessibility', () => {
    it('should have proper accessibility label', () => {
      const { getByLabelText } = render(
        <AddRestrictionButton onAdd={jest.fn()} />
      );

      expect(getByLabelText('Add new dietary restriction')).toBeTruthy();
    });
  });
});
