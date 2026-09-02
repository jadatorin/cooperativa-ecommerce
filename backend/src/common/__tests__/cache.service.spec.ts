import { CacheService } from '../cache.service';

describe('CacheService', () => {
  let service: CacheService;

  beforeEach(() => {
    service = new CacheService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('get', () => {
    it('should return null for non-existent key', () => {
      const result = service.get('nonexistent');
      expect(result).toBeNull();
    });

    it('should return cached value for existing key', () => {
      service.set('test-key', 'test-value');
      const result = service.get('test-key');
      expect(result).toBe('test-value');
    });

    it('should return null for expired entry', () => {
      service.set('test-key', 'test-value', 1); // 1ms TTL
      // Wait for expiration
      const start = Date.now();
      while (Date.now() - start < 10) {
        // busy wait
      }
      const result = service.get('test-key');
      expect(result).toBeNull();
    });

    it('should return complex objects', () => {
      const complexObj = { name: 'test', nested: { value: 123 } };
      service.set('complex', complexObj);
      const result = service.get('complex');
      expect(result).toEqual(complexObj);
    });
  });

  describe('set', () => {
    it('should store a value', () => {
      service.set('key', 'value');
      expect(service.get('key')).toBe('value');
    });

    it('should overwrite existing value', () => {
      service.set('key', 'value1');
      service.set('key', 'value2');
      expect(service.get('key')).toBe('value2');
    });

    it('should use custom TTL', () => {
      service.set('key', 'value', 1000);
      expect(service.get('key')).toBe('value');
    });
  });

  describe('delete', () => {
    it('should remove a cached entry', () => {
      service.set('key', 'value');
      service.delete('key');
      expect(service.get('key')).toBeNull();
    });

    it('should not throw when deleting non-existent key', () => {
      expect(() => service.delete('nonexistent')).not.toThrow();
    });
  });

  describe('clear', () => {
    it('should remove all cached entries', () => {
      service.set('key1', 'value1');
      service.set('key2', 'value2');
      service.clear();
      expect(service.get('key1')).toBeNull();
      expect(service.get('key2')).toBeNull();
    });
  });
});
