import { beforeAll, describe, expect, it } from 'vitest';
import { validate } from 'vee-validate';
import { validation } from '@/plugins/validation';

beforeAll(validation);

describe('required validation', () => {
  it.each([0, 50, -1, 50.5, '0', 'pilot@example.com', 'secret', 'Pilot Nova'])(
    'accepts a provided value: %s',
    async (value) => {
      const result = await validate(value, 'required');
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    }
  );

  it.each(['', '   ', '\t\n', null, undefined])('rejects an empty value: %s', async (value) => {
    const result = await validate(value, 'required', { label: 'Starting hp' });
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(['Starting hp is required']);
  });

  it('keeps the fallback field label', async () => {
    const result = await validate('', 'required');
    expect(result.errors).toEqual(['This Field is required']);
  });
});

describe('integer validation', () => {
  it.each([10, 50, 500, '75', '', null])('accepts integers or optional empty values: %s', async (value) => {
    const result = await validate(value, 'integer');
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it.each([50.5, '50.5', '50,5', '5e-1', NaN, Infinity])('rejects non-integer HP: %s', async (value) => {
    const result = await validate(value, 'integer');
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(['Must be a whole number']);
  });
});

describe('max_value validation', () => {
  it.each([50, 500, '', null])('preserves the built-in rule for %s', async (value) => {
    const result = await validate(value, 'max_value:500');
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it.each([50, 500])('includes the configured maximum %s in the error message', async (max) => {
    const result = await validate(max + 1, `max_value:${max}`);
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual([`Max value is ${max}`]);
  });

  it('supports named rule parameters', async () => {
    const result = await validate(501, { max_value: { max: 500 } });
    expect(result.errors).toEqual(['Max value is 500']);
  });
});

describe('min_value validation', () => {
  it.each([10, 50, 500, '', null])('preserves the built-in rule for %s', async (value) => {
    const result = await validate(value, 'min_value:10');
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it.each([1, 10])('includes the configured minimum %s in the error message', async (min) => {
    const result = await validate(min - 1, `min_value:${min}`);
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual([`Min value is ${min}`]);
  });

  it('supports named rule parameters', async () => {
    const result = await validate(9, { min_value: { min: 10 } });
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(['Min value is 10']);
  });
});
