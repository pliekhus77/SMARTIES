import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NotesSection } from '../NotesSection';

describe('NotesSection', () => {
  const mockProps = {
    notes: 'Test notes',
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display existing notes', () => {
    const { getByText } = render(<NotesSection {...mockProps} />);
    
    expect(getByText('Test notes')).toBeTruthy();
  });

  it('should show placeholder when no notes', () => {
    const { getByText } = render(
      <NotesSection notes="" onChange={mockProps.onChange} />
    );
    
    expect(getByText('Tap to add notes...')).toBeTruthy();
  });

  it('should enter edit mode when tapped', () => {
    const { getByLabelText, getByDisplayValue } = render(<NotesSection {...mockProps} />);
    
    fireEvent.press(getByLabelText('Tap to edit notes'));
    
    expect(getByDisplayValue('Test notes')).toBeTruthy();
  });

  it('should save changes when save button pressed', () => {
    const { getByLabelText, getByDisplayValue, getByText } = render(<NotesSection {...mockProps} />);
    
    fireEvent.press(getByLabelText('Tap to edit notes'));
    fireEvent.changeText(getByDisplayValue('Test notes'), 'Updated notes');
    fireEvent.press(getByText('Save'));
    
    expect(mockProps.onChange).toHaveBeenCalledWith('Updated notes');
  });

  it('should cancel changes when cancel button pressed', () => {
    const { getByLabelText, getByDisplayValue, getByText } = render(<NotesSection {...mockProps} />);
    
    fireEvent.press(getByLabelText('Tap to edit notes'));
    fireEvent.changeText(getByDisplayValue('Test notes'), 'Updated notes');
    fireEvent.press(getByText('Cancel'));
    
    expect(mockProps.onChange).not.toHaveBeenCalled();
  });
});
