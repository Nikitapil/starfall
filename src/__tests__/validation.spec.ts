import { beforeAll, describe, expect, it } from 'vitest';
import { validate } from 'vee-validate';
import { validation } from '@/plugins/validation';

beforeAll(validation);

describe('max_value validation', () => {
  it.each([50, 500, '', null])('preserves the built-in rule for %s', async (value) => {
    const result = await validate(value, 'max_value:500');
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it.each([50, 500])('includes the configured maximum %s in the error message', async (max) => {
    const result = await validate(max + 1, `max_value:${max}`);
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual([`max value is ${max}`]);
  });

  it('supports named rule parameters', async () => {
    const result = await validate(501, { max_value: { max: 500 } });
    expect(result.errors).toEqual(['max value is 500']);
  });
});
