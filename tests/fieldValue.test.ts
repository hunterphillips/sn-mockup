import { describe, it, expect } from 'vitest';
import {
  getDisplayValue,
  getValue,
  createFieldValue,
  isFieldValue,
} from '../src/utils/fieldValue';

describe('fieldValue utilities', () => {
  describe('getDisplayValue', () => {
    it('extracts display_value from FieldValue objects', () => {
      const field = { value: 'sys_123', display_value: 'John Doe' };
      expect(getDisplayValue(field)).toBe('John Doe');
    });

    it('handles legacy primitive strings', () => {
      expect(getDisplayValue('plain string')).toBe('plain string');
    });

    it('handles numbers by converting to string', () => {
      expect(getDisplayValue(42)).toBe('42');
    });

    it('returns empty string for null', () => {
      expect(getDisplayValue(null)).toBe('');
    });

    it('returns empty string for undefined', () => {
      expect(getDisplayValue(undefined)).toBe('');
    });

    it('handles FieldValue with null display_value', () => {
      const field = { value: 'abc', display_value: null };
      expect(getDisplayValue(field)).toBe('');
    });

    it('handles FieldValue with undefined display_value', () => {
      const field = { value: 'abc', display_value: undefined };
      expect(getDisplayValue(field)).toBe('');
    });
  });

  describe('getValue', () => {
    it('extracts value from FieldValue objects', () => {
      const field = { value: 'sys_123', display_value: 'John Doe' };
      expect(getValue(field)).toBe('sys_123');
    });

    it('handles legacy primitive strings', () => {
      expect(getValue('plain string')).toBe('plain string');
    });

    it('handles numbers by converting to string', () => {
      expect(getValue(42)).toBe('42');
    });

    it('returns empty string for null', () => {
      expect(getValue(null)).toBe('');
    });

    it('returns empty string for undefined', () => {
      expect(getValue(undefined)).toBe('');
    });

    it('handles FieldValue with null value', () => {
      const field = { value: null, display_value: 'Display' };
      expect(getValue(field)).toBe('');
    });
  });

  describe('createFieldValue', () => {
    it('creates FieldValue with both value and display_value', () => {
      const result = createFieldValue('sys_123', 'John Doe');
      expect(result).toEqual({ value: 'sys_123', display_value: 'John Doe' });
    });

    it('uses value for display_value when not provided', () => {
      const result = createFieldValue('simple');
      expect(result).toEqual({ value: 'simple', display_value: 'simple' });
    });
  });

  describe('isFieldValue', () => {
    it('returns true for valid FieldValue objects', () => {
      expect(isFieldValue({ value: 'a', display_value: 'b' })).toBe(true);
    });

    it('returns false for null', () => {
      expect(isFieldValue(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isFieldValue(undefined)).toBe(false);
    });

    it('returns false for arrays', () => {
      expect(isFieldValue(['a', 'b'])).toBe(false);
    });
  });
});
