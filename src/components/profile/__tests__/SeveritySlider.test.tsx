import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SeveritySlider } from '../SeveritySlider';
import { SeverityLevel } from '../../../types/DietaryRestriction';

describe('SeveritySlider', () => {
  const mockProps = {
    value: SeverityLevel.MODERATE,
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all severity levels', () => {
    const { getByText } = render(<SeveritySlider {...mockProps} />);
    
    expect(getByText('Mild')).toBeTruthy();
    expect(getByText('Moderate')).toBeTruthy();
    expect(getByText('Severe')).toBeTruthy();
  });

  it('should highlight selected severity level', () => {
    const { getByLabelText } = render(<SeveritySlider {...mockProps} />);
    
    const moderateButton = getByLabelText('Set severity to Moderate');
    expect(moderateButton.props.accessibilityState.selected).toBe(true);
  });

  it('should call onChange when different severity selected', () => {
    const { getByLabelText } = render(<SeveritySlider {...mockProps} />);
    
    fireEvent.press(getByLabelText('Set severity to Severe'));
    
    expect(mockProps.onChange).toHaveBeenCalledWith(SeverityLevel.SEVERE);
  });

  it('should not call onChange when same severity selected', () => {
    const { getByLabelText } = render(<SeveritySlider {...mockProps} />);
    
    fireEvent.press(getByLabelText('Set severity to Moderate'));
    
    expect(mockProps.onChange).not.toHaveBeenCalled();
  });
});
