import { cn } from '../../../utils/cn'
import { SNButton } from '../common/SNButton'
import { SNSelect } from '../common/SNSelect'
import { SNInput } from '../common/SNInput'
import type { FilterCondition, FieldDefinition } from '../../../types'
import { X, RotateCcw } from 'lucide-react'

export interface FilterBuilderProps {
  /** Available fields for filtering */
  fields: FieldDefinition[]
  /** Current filter conditions */
  conditions: FilterCondition[]
  /** Callback when conditions change */
  onConditionsChange: (conditions: FilterCondition[]) => void
  /** Callback to run the filter */
  onRun: () => void
  /** Additional CSS classes */
  className?: string
}

const OPERATORS = [
  { value: 'is', label: 'is' },
  { value: 'is_not', label: 'is not' },
  { value: 'contains', label: 'contains' },
  { value: 'starts_with', label: 'starts with' },
  { value: 'ends_with', label: 'ends with' },
  { value: 'greater_than', label: 'greater than' },
  { value: 'less_than', label: 'less than' },
]

/**
 * ServiceNow-styled filter builder with condition rows
 *
 * @example
 * <FilterBuilder
 *   fields={tableFields}
 *   conditions={conditions}
 *   onConditionsChange={setConditions}
 *   onRun={handleFilter}
 * />
 */
export function FilterBuilder({
  fields,
  conditions,
  onConditionsChange,
  onRun,
  className,
}: FilterBuilderProps) {
  const fieldOptions = [
    { value: '', label: '-- choose field --' },
    ...fields
      .map(f => ({ value: f.name, label: f.label }))
      .sort((a, b) => a.label.localeCompare(b.label))
  ]

  const addCondition = (conjunction: 'AND' | 'OR' = 'AND') => {
    const newCondition: FilterCondition = {
      field: fields[0]?.name || '',
      operator: 'is',
      value: '',
      conjunction: conditions.length > 0 ? conjunction : undefined,
    }
    onConditionsChange([...conditions, newCondition])
  }

  const updateCondition = (index: number, updates: Partial<FilterCondition>) => {
    const updated = conditions.map((c, i) =>
      i === index ? { ...c, ...updates } : c
    )
    onConditionsChange(updated)
  }

  const removeCondition = (index: number) => {
    const updated = conditions.filter((_, i) => i !== index)
    // Clear conjunction from first remaining condition
    if (updated.length > 0) {
      updated[0] = { ...updated[0], conjunction: undefined }
    }
    onConditionsChange(updated)
  }

  const clearAll = () => {
    onConditionsChange([])
  }

  // Get choices for a field (if it's a choice field)
  const getFieldChoices = (fieldName: string) => {
    const field = fields.find(f => f.name === fieldName)
    if (field?.choices) {
      return field.choices.map(c => ({ value: c, label: c }))
    }
    return null
  }

  return (
    <div className={cn('bg-sn-neutral-1 border-b border-sn-neutral-3 px-4 py-3', className)}>
      {/* Action buttons */}
      <div className="flex items-center gap-2 mb-3">
        <SNButton variant="primary" size="sm" onClick={onRun}>
          Run
        </SNButton>
        <SNButton variant="secondary" size="sm" onClick={() => {}}>
          Save...
        </SNButton>
        <SNButton variant="secondary" size="sm" onClick={() => addCondition('AND')}>
          AND
        </SNButton>
        <SNButton variant="secondary" size="sm" onClick={() => addCondition('OR')}>
          OR
        </SNButton>
        <SNButton variant="secondary" size="sm" onClick={() => {}}>
          Add Sort
        </SNButton>
        <SNButton variant="bare" size="sm" icon={<RotateCcw className="w-4 h-4" />} onClick={clearAll}>
          Reset
        </SNButton>
      </div>

      {/* Condition rows */}
      <div className="space-y-2">
        {/* Placeholder row when no conditions */}
        {conditions.length === 0 && (
          <div className="flex items-center gap-2">
            <div className="w-20" />
            <SNSelect
              size="sm"
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  onConditionsChange([{ field: e.target.value, operator: 'is', value: '' }])
                }
              }}
              options={fieldOptions}
              className="w-40"
            />
            <SNInput
              size="sm"
              value=""
              disabled
              placeholder="-- value --"
              className="w-32"
            />
            <SNInput
              size="sm"
              value=""
              disabled
              placeholder="-- value --"
              className="w-40"
            />
          </div>
        )}
        {conditions.map((condition, index) => {
          const choices = getFieldChoices(condition.field)

          return (
            <div key={index} className="flex items-center gap-2">
              {/* Conjunction (for conditions after the first) */}
              {index > 0 && (
                <SNSelect
                  size="sm"
                  value={condition.conjunction || 'AND'}
                  onChange={(e) => updateCondition(index, { conjunction: e.target.value as 'AND' | 'OR' })}
                  options={[
                    { value: 'AND', label: 'AND' },
                    { value: 'OR', label: 'OR' },
                  ]}
                  className="w-20"
                />
              )}
              {index === 0 && <div className="w-20" />}

              {/* Field */}
              <SNSelect
                size="sm"
                value={condition.field}
                onChange={(e) => updateCondition(index, { field: e.target.value })}
                options={fieldOptions}
                className="w-40"
              />

              {/* Operator */}
              <SNSelect
                size="sm"
                value={condition.operator}
                onChange={(e) => updateCondition(index, { operator: e.target.value as FilterCondition['operator'] })}
                options={OPERATORS}
                className="w-32"
              />

              {/* Value */}
              {choices ? (
                <SNSelect
                  size="sm"
                  value={condition.value}
                  onChange={(e) => updateCondition(index, { value: e.target.value })}
                  options={choices}
                  placeholder="Select value..."
                  className="w-40"
                />
              ) : (
                <SNInput
                  size="sm"
                  value={condition.value}
                  onChange={(e) => updateCondition(index, { value: e.target.value })}
                  placeholder="Enter value..."
                  className="w-40"
                />
              )}

              {/* AND/OR buttons for this row */}
              <SNButton variant="secondary" size="sm" onClick={() => addCondition('AND')}>
                AND
              </SNButton>
              <SNButton variant="secondary" size="sm" onClick={() => addCondition('OR')}>
                OR
              </SNButton>

              {/* Remove button */}
              <SNButton
                variant="bare"
                size="sm"
                onClick={() => removeCondition(index)}
                aria-label="Remove condition"
              >
                <X className="w-4 h-4 text-sn-critical" />
              </SNButton>
            </div>
          )
        })}
      </div>
    </div>
  )
}
