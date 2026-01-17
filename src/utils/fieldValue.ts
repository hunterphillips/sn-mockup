import type { FieldValue } from '../types'

/**
 * Extract display_value from a field value
 * Handles both FieldValue objects and legacy primitive values
 */
export function getDisplayValue(field: unknown): string {
  if (field === null || field === undefined) {
    return ''
  }
  if (typeof field === 'object' && 'display_value' in field) {
    return String((field as FieldValue).display_value ?? '')
  }
  return String(field)
}

/**
 * Extract raw value from a field value (e.g., sys_id for references)
 * Handles both FieldValue objects and legacy primitive values
 */
export function getValue(field: unknown): string {
  if (field === null || field === undefined) {
    return ''
  }
  if (typeof field === 'object' && 'value' in field) {
    return String((field as FieldValue).value ?? '')
  }
  return String(field)
}

/**
 * Create a FieldValue object
 * If displayValue not provided, uses value for both
 */
export function createFieldValue(value: string, displayValue?: string): FieldValue {
  return {
    value,
    display_value: displayValue ?? value
  }
}

/**
 * Check if a value is a FieldValue object
 */
export function isFieldValue(field: unknown): field is FieldValue {
  return (
    typeof field === 'object' &&
    field !== null &&
    'value' in field &&
    'display_value' in field
  )
}
