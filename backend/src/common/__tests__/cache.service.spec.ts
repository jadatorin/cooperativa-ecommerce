import { CacheService } from '../cache.service';

describe('CacheService', () => {
  let service: CacheService;

  beforeEach(() => {
    service = new CacheService(null);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('get', () => {
    it('should return null for non-existent key', async () => {
      const result = await service.get('nonexistent');
      expect(result).toBeNull();
    });

    it('should return cached value for existing key', async () => {
      await service.set('test-key', 'test-value');
      const result = await service.get('test-key');
      expect(result).toBe('test-value');
    });

    it('should return null for expired entry', async () => {
      await service.set('test-key', 'test-value', 1);
      const start = Date.now();
      while (Date.now() - start < 10) {
        // busy wait
      }
      const result = await service.get('test-key');
      expect(result).toBeNull();
    });

    it('should return complex objects', async () => {
      const complexObj = { name: 'test', nested: { value: 123 } };
      await service.set('complex', complexObj);
      const result = await service.get('complex');
      expect(result).toEqual(complexObj);
    });
  });

  describe('set', () => {
    it('should store a value', async () => {
      await service.set('key', 'value');
      expect(await service.get('key')).toBe('value');
    });

    it('should overwrite existing value', async () => {
      await service.set('key', 'value1');
      await service.set('key', 'value2');
      expect(await service.get('key')).toBe('value2');
    });

    it('should use custom TTL', async () => {
      await service.set('key', 'value', 1000);
      expect(await service.get('key')).toBe('value');
    });
  });

  describe('delete', () => {
    it('should remove a cached entry', async () => {
      await service.set('key', 'value');
      await service.delete('key');
      expect(await service.get('key')).toBeNull();
    });

    it('should not throw when deleting non-existent key', async () => {
      await expect(service.delete('nonexistent')).resolves.not.toThrow();
    });
  });

  describe('clear', () => {
    it('should remove all cached entries', async () => {
      await service.set('key1', 'value1');
      await service.set('key2', 'value2');
      await service.clear();
      expect(await service.get('key1')).toBeNull();
      expect(await service.get('key2')).toBeNull();
    });
  });

  describe('ping', () => {
    it('should return connected for in-memory fallback', async () => {
      const result = await service.ping();
      expect(result).toBe('connected');
    });
  });
});
