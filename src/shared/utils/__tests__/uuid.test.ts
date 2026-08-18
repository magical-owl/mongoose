import { z } from 'zod';
import { generateUUID } from '../uuid';

describe('generateUUID', () => {
  it('should generate a valid RFC4122 v4 UUID string', () => {
    const uuid = generateUUID();
    expect(typeof uuid).toBe('string');
    
    // Validate with Zod UUID schema
    const uuidSchema = z.string().uuid();
    const result = uuidSchema.safeParse(uuid);
    expect(result.success).toBe(true);
  });

  it('should generate unique UUIDs on consecutive calls', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateUUID()));
    expect(ids.size).toBe(100);
  });
});
