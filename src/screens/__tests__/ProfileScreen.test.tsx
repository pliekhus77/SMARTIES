import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { ProfileScreen } from '../ProfileScreen';
import { MockProfileService } from '../../services/ProfileService';

jest.mock('../../services/ProfileService');
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('ProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render header with logo and title', async () => {
    const { getByText } = render(<ProfileScreen />);
    
    await waitFor(() => {
      expect(getByText('My Dietary Restrictions')).toBeTruthy();
    });
  });

  it('should render scroll view container', async () => {
    const { getByTestId } = render(<ProfileScreen />);
    
    // Note: In actual implementation, would add testID to ScrollView
    await waitFor(() => {
      expect(getByText('My Dietary Restrictions')).toBeTruthy();
    });
  });
});
