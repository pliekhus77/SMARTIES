import { MockProfileService } from '../ProfileService';
import { DietaryRestriction, AllergenType, SeverityLevel } from '../../types/DietaryRestriction';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage');

describe('ProfileService', () => {
  let service: MockProfileService;
  const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

  beforeEach(() => {
    service = new MockProfileService();
    jest.clearAllMocks();
  });

  const createMockRestriction = (overrides?: Partial<DietaryRestriction>): DietaryRestriction => ({
    id: '1',
    allergen: AllergenType.PEANUTS,
    severity: SeverityLevel.SEVERE,
    notes: 'Test notes',
    ...overrides
  });

  describe('getRestrictions', () => {
    it('should return empty array when no data stored', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);
      
      const restrictions = await service.getRestrictions();
      
      expect(restrictions).toEqual([]);
    });

    it('should return stored restrictions', async () => {
      const mockRestrictions = [createMockRestriction()];
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockRestrictions));
      
      const restrictions = await service.getRestrictions();
      
      expect(restrictions).toEqual(mockRestrictions);
    });
  });

  describe('addRestriction', () => {
    it('should add valid restriction', async () => {
      const restriction = createMockRestriction();
      
      await service.addRestriction(restriction);
      
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'dietary_restrictions',
        JSON.stringify([restriction])
      );
    });

    it('should throw error for invalid restriction', async () => {
      const invalidRestriction = { id: '', allergen: 'invalid' } as any;
      
      await expect(service.addRestriction(invalidRestriction)).rejects.toThrow('Invalid restriction data');
    });
  });

  describe('updateRestriction', () => {
    it('should update existing restriction', async () => {
      const restriction = createMockRestriction();
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify([restriction]));
      
      await service.getRestrictions();
      await service.updateRestriction('1', { severity: SeverityLevel.MILD });
      
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'dietary_restrictions',
        JSON.stringify([{ ...restriction, severity: SeverityLevel.MILD }])
      );
    });

    it('should throw error for non-existent restriction', async () => {
      await expect(service.updateRestriction('999', {})).rejects.toThrow('Restriction not found');
    });
  });

  describe('deleteRestriction', () => {
    it('should remove restriction', async () => {
      const restriction = createMockRestriction();
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify([restriction]));
      
      await service.getRestrictions();
      await service.deleteRestriction('1');
      
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'dietary_restrictions',
        JSON.stringify([])
      );
    });
  });
});
