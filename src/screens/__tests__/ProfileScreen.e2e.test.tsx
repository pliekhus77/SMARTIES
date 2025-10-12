import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { ProfileScreen } from '../ProfileScreen';
import { MockProfileService } from '../../services/ProfileService';
import { AllergenType, SeverityLevel } from '../../types/DietaryRestriction';

jest.mock('../../services/ProfileService');
jest.spyOn(Alert, 'alert');

describe('ProfileScreen E2E Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should complete full user workflow', async () => {
    const { getByLabelText, getByText, queryByText } = render(<ProfileScreen />);

    // Wait for screen to load
    await waitFor(() => {
      expect(getByText('My Dietary Restrictions')).toBeTruthy();
    });

    // Add new restriction
    fireEvent.press(getByLabelText('Add new dietary restriction'));

    await waitFor(() => {
      expect(getByText('Add Dietary Restriction')).toBeTruthy();
    });

    // Select peanuts
    fireEvent.press(getByText('peanuts'));

    await waitFor(() => {
      expect(queryByText('Add Dietary Restriction')).toBeFalsy();
    });

    // Verify restriction was added
    expect(getByText('peanuts')).toBeTruthy();

    // Change severity level
    fireEvent.press(getByLabelText('Set severity to Severe'));

    // Add notes
    fireEvent.press(getByLabelText('Tap to edit notes'));
    fireEvent.changeText(getByDisplayValue(''), 'Severe reaction');
    fireEvent.press(getByText('Save'));

    // Verify notes were saved
    expect(getByText('Severe reaction')).toBeTruthy();

    // Delete restriction
    fireEvent.press(getByLabelText('Delete peanuts restriction'));

    // Confirm deletion
    expect(Alert.alert).toHaveBeenCalledWith(
      'Delete Restriction',
      'Are you sure you want to delete peanuts?',
      expect.any(Array)
    );
  });

  it('should handle multiple restrictions', async () => {
    const { getByLabelText, getByText } = render(<ProfileScreen />);

    await waitFor(() => {
      expect(getByText('My Dietary Restrictions')).toBeTruthy();
    });

    // Add first restriction
    fireEvent.press(getByLabelText('Add new dietary restriction'));
    await waitFor(() => fireEvent.press(getByText('peanuts')));

    // Add second restriction
    fireEvent.press(getByLabelText('Add new dietary restriction'));
    await waitFor(() => fireEvent.press(getByText('tree nuts')));

    // Verify both restrictions exist
    await waitFor(() => {
      expect(getByText('peanuts')).toBeTruthy();
      expect(getByText('tree nuts')).toBeTruthy();
    });
  });

  it('should persist data across app sessions', async () => {
    // First session - add restriction
    const { getByLabelText, getByText, unmount } = render(<ProfileScreen />);

    await waitFor(() => {
      fireEvent.press(getByLabelText('Add new dietary restriction'));
    });

    await waitFor(() => {
      fireEvent.press(getByText('peanuts'));
    });

    unmount();

    // Second session - verify persistence
    const { getByText: getByText2 } = render(<ProfileScreen />);

    await waitFor(() => {
      expect(getByText2('peanuts')).toBeTruthy();
    });
  });

  it('should handle errors gracefully', async () => {
    // Mock service to throw error
    const mockService = new MockProfileService();
    jest.spyOn(mockService, 'addRestriction').mockRejectedValue(new Error('Network error'));

    const { getByLabelText, getByText } = render(<ProfileScreen />);

    await waitFor(() => {
      fireEvent.press(getByLabelText('Add new dietary restriction'));
    });

    await waitFor(() => {
      fireEvent.press(getByText('peanuts'));
    });

    // Should show error alert
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to add restriction');
    });
  });
});
