import { useState } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FilterBuilder } from '../src/components/sn/List/FilterBuilder'
import type { FilterCondition, FieldDefinition } from '../src/types'

const TEST_FIELDS: FieldDefinition[] = [
  { name: 'number', type: 'string', label: 'Number' },
  { name: 'state', type: 'choice', label: 'State', choices: ['New', 'Active', 'Resolved'] },
  { name: 'priority', type: 'string', label: 'Priority' },
]

function FilterBuilderWrapper({
  initialConditions = [],
  onRun = () => {},
}: {
  initialConditions?: FilterCondition[]
  onRun?: () => void
}) {
  const [conditions, setConditions] = useState<FilterCondition[]>(initialConditions)
  return (
    <FilterBuilder
      fields={TEST_FIELDS}
      conditions={conditions}
      onConditionsChange={setConditions}
      onRun={onRun}
    />
  )
}

describe('FilterBuilder', () => {
  it('renders condition row controls when a condition exists', () => {
    render(
      <FilterBuilderWrapper
        initialConditions={[{ field: 'number', operator: 'is', value: '' }]}
      />
    )

    const selects = screen.getAllByRole('combobox')
    // field select + operator select = 2 selects for one string-field condition
    expect(selects.length).toBeGreaterThanOrEqual(2)
    expect(screen.getByPlaceholderText('Enter value...')).toBeInTheDocument()
  })

  it('renders a select for choice fields instead of text input', () => {
    render(
      <FilterBuilderWrapper
        initialConditions={[{ field: 'state', operator: 'is', value: '' }]}
      />
    )

    // choice field renders select with placeholder instead of text input
    expect(screen.queryByPlaceholderText('Enter value...')).not.toBeInTheDocument()
    // 3 selects: field, operator, value (choices)
    const selects = screen.getAllByRole('combobox')
    expect(selects.length).toBe(3)
  })

  it('adds a new condition when AND is clicked', async () => {
    const user = userEvent.setup()
    render(
      <FilterBuilderWrapper
        initialConditions={[{ field: 'number', operator: 'is', value: '' }]}
      />
    )

    // Click the AND button in the toolbar (first one)
    const andButtons = screen.getAllByRole('button', { name: 'AND' })
    await user.click(andButtons[0])

    // Should now have two condition rows — each with field + operator selects
    const selects = screen.getAllByRole('combobox')
    // Row 1: field + operator = 2, Row 2: conjunction + field + operator = 3 → 5 total
    expect(selects.length).toBe(5)
  })

  it('adds a condition with OR conjunction', async () => {
    const user = userEvent.setup()
    render(
      <FilterBuilderWrapper
        initialConditions={[{ field: 'number', operator: 'is', value: '' }]}
      />
    )

    const orButtons = screen.getAllByRole('button', { name: 'OR' })
    await user.click(orButtons[0])

    // The second row's conjunction select should show OR
    const selects = screen.getAllByRole('combobox')
    // The conjunction select is the 3rd select (after row 1's field + operator)
    expect(selects[2]).toHaveValue('OR')
  })

  it('updates value when user types in the input', async () => {
    const user = userEvent.setup()
    render(
      <FilterBuilderWrapper
        initialConditions={[{ field: 'number', operator: 'is', value: '' }]}
      />
    )

    const input = screen.getByPlaceholderText('Enter value...')
    await user.type(input, 'INC001')

    expect(input).toHaveValue('INC001')
  })

  it('calls onRun when Run is clicked', async () => {
    const user = userEvent.setup()
    const onRun = vi.fn()
    render(
      <FilterBuilderWrapper
        initialConditions={[{ field: 'number', operator: 'is', value: 'INC001' }]}
        onRun={onRun}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Run' }))

    expect(onRun).toHaveBeenCalledOnce()
  })

  it('clears all conditions when Reset is clicked', async () => {
    const user = userEvent.setup()
    render(
      <FilterBuilderWrapper
        initialConditions={[
          { field: 'number', operator: 'is', value: 'INC001' },
          { field: 'state', operator: 'is', value: 'New', conjunction: 'AND' },
        ]}
      />
    )

    // Verify conditions exist
    expect(screen.getAllByRole('combobox').length).toBeGreaterThan(2)

    await user.click(screen.getByRole('button', { name: /Reset/i }))

    // After reset, no condition rows — no value inputs or selects beyond toolbar
    expect(screen.queryByPlaceholderText('Enter value...')).not.toBeInTheDocument()
    expect(screen.queryAllByRole('combobox')).toHaveLength(0)
  })

  it('removes a single condition when its remove button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <FilterBuilderWrapper
        initialConditions={[
          { field: 'number', operator: 'is', value: 'INC001' },
          { field: 'state', operator: 'is', value: 'New', conjunction: 'AND' },
        ]}
      />
    )

    const removeButtons = screen.getAllByRole('button', { name: 'Remove condition' })
    expect(removeButtons).toHaveLength(2)

    // Remove first condition
    await user.click(removeButtons[0])

    // Should have one condition left
    expect(screen.getAllByRole('button', { name: 'Remove condition' })).toHaveLength(1)
  })
})
