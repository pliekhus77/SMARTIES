import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { AddRestrictionButton } from '../AddRestrictionButton';
import { AllergenType } from '../../../types/DietaryRestriction';

jest.mock('../../../services/ProfileService');

describe('AddRestrictionButton', () => {
  const mockProps = {
    onAdd: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render add button', () => {
    const { getByLabelText } = render(<AddRestrictionButton {...mockProps} />);
    
    expect(getByLabelText('Add new dietary restriction')).toBeTruthy();
  });

  it('should open modal when button pressed', async () => {
    const { getByLabelText, getByText } = render(<AddRestrictionButton {...mockProps} />);
    
    fireEvent.press(getByLabelText('Add new dietary restriction'));
    
    await waitFor(() => {
      expect(getByText('Add Dietary Restriction')).toBeTruthy();
    });
  });

  it('should display allergen options in modal', async () => {
    const { getByLabelText, getByText } = render(<AddRestrictionButton {...mockProps} />);
    
    fireEvent.press(getByLabelText('Add new dietary restriction'));
    
    await waitFor(() => {
      expect(getByText('peanuts')).toBeTruthy();
      expect(getByText('tree nuts')).toBeTruthy();
    });
  });

  it('should call onAdd when allergen selected', async () => {
    const { getByLabelText, getByText } = render(<AddRestrictionButton {...mockProps} />);
    
    fireEvent.press(getByLabelText('Add new dietary restriction'));
    
    await waitFor(() => {
      fireEvent.press(getByText('peanuts'));
    });
    
    expect(mockProps.onAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        allergen: AllergenType.PEANUTS,
      })
    );
  });
});
