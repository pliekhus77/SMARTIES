import { ProductLookupService } from '../ProductLookupService';

// Mock fetch
global.fetch = jest.fn();

describe('ProductLookupService', () => {
  let service: ProductLookupService;

  beforeEach(() => {
    service = new ProductLookupService();
    jest.clearAllMocks();
  });

  it('successfully looks up existing product', async () => {
    const mockResponse = {
      status: 1,
      product: {
        code: '1234567890123',
        product_name: 'Test Product',
        ingredients_text: 'Water, Sugar',
        allergens: 'en:milk,en:eggs',
      },
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await service.lookupProduct('1234567890123');
    
    expect(result.success).toBe(true);
    expect(result.product?.name).toBe('Test Product');
    expect(result.product?.allergens).toEqual(['milk', 'eggs']);
  });

  it('handles product not found', async () => {
    const mockResponse = {
      status: 0,
      status_verbose: 'product not found',
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await service.lookupProduct('0000000000000');
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Product not found');
  });

  it('handles network errors', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const result = await service.lookupProduct('1234567890123');
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('Network error');
  });

  it('retries on server errors', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          status: 1,
          product: { code: '123', product_name: 'Test' },
        }),
      });

    const result = await service.retryLookup('123', 2);
    
    expect(result.success).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
