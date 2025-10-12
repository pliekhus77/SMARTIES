import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { RestrictionCard } from '../RestrictionCard';
import { DietaryRestriction, AllergenType, SeverityLevel } from '../../../types/DietaryRestriction';

jest.spyOn(Alert, 'alert');

describe('RestrictionCard', () => {
  const mockRestriction: DietaryRestriction = {
    id: '1',
    allergen: AllergenType.PEANUTS,
    severity: SeverityLevel.MODERATE,
    notes: 'Test notes',
  };

  const mockProps = {
    restriction: mockRestriction,
    onUpdate: jest.fn(),
    onDelete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render allergen name and icon', () => {
    const { getByText } = render(<RestrictionCard {...mockProps} />);
    
    expect(getByText('peanuts')).toBeTruthy();
  });

  it('should show delete confirmation when delete button pressed', () => {
    const { getByLabelText } = render(<RestrictionCard {...mockProps} />);
    
    fireEvent.press(getByLabelText('Delete peanuts restriction'));
    
    expect(Alert.alert).toHaveBeenCalledWith(
      'Delete Restriction',
      'Are you sure you want to delete peanuts?',
      expect.any(Array)
    );
  });

  it('should call onUpdate when severity changes', () => {
    const { getByLabelText } = render(<RestrictionCard {...mockProps} />);
    
    fireEvent.press(getByLabelText('Set severity to Severe'));
    
    expect(mockProps.onUpdate).toHaveBeenCalledWith({
      severity: SeverityLevel.SEVERE
    });
  });
});
