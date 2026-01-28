import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  initializeApi,
  getRecords,
  getRecord,
  createRecord,
  updateRecord,
  deleteRecord,
  getTableDefinition,
  getRelatedRecords,
} from '../src/api/mockApi'
import type { TableDefinition, SNRecord } from '../src/types'

// Mock fetch for persistence calls (we don't need actual server)
global.fetch = vi.fn(() => Promise.resolve({ ok: true } as Response))

const createTestTable = (
  records: Partial<SNRecord>[] = []
): TableDefinition => ({
  name: 'test_table',
  label: 'Test Table',
  fields: [
    { name: 'name', type: 'string', label: 'Name' },
    { name: 'description', type: 'text', label: 'Description' },
    { name: 'priority', type: 'choice', label: 'Priority' },
    { name: 'active', type: 'boolean', label: 'Active' },
    { name: 'assigned_to', type: 'reference', label: 'Assigned To', reference: 'sys_user' },
  ],
  list: { columns: ['name', 'priority'], defaultSort: { field: 'name', direction: 'asc' }, pageSize: 20 },
  form: { sections: [{ name: 'general', label: 'General', columns: 1, fields: ['name', 'priority'] }] },
  data: records.map((r, i) => ({
    sys_id: r.sys_id || `id_${i}`,
    ...r,
  })) as SNRecord[],
})

describe('mockApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getRecords - filtering', () => {
    describe('operator: is', () => {
      it('matches exact value (case insensitive)', async () => {
        const table = createTestTable([
          { name: { value: 'Alice', display_value: 'Alice' } },
          { name: { value: 'Bob', display_value: 'Bob' } },
          { name: { value: 'alice', display_value: 'alice' } },
        ])
        initializeApi([table])

        const result = await getRecords('test_table', {
          filters: [{ field: 'name', operator: 'is', value: 'alice' }],
        })

        expect(result.data).toHaveLength(2)
        expect(result.total).toBe(2)
      })
    })

    describe('operator: is_not', () => {
      it('excludes matching values', async () => {
        const table = createTestTable([
          { name: { value: 'Alice', display_value: 'Alice' } },
          { name: { value: 'Bob', display_value: 'Bob' } },
        ])
        initializeApi([table])

        const result = await getRecords('test_table', {
          filters: [{ field: 'name', operator: 'is_not', value: 'Alice' }],
        })

        expect(result.data).toHaveLength(1)
        expect(result.data[0].name).toEqual({ value: 'Bob', display_value: 'Bob' })
      })
    })

    describe('operator: contains', () => {
      it('matches substring', async () => {
        const table = createTestTable([
          { name: { value: 'Alice Smith', display_value: 'Alice Smith' } },
          { name: { value: 'Bob Jones', display_value: 'Bob Jones' } },
          { name: { value: 'Charlie Smith', display_value: 'Charlie Smith' } },
        ])
        initializeApi([table])

        const result = await getRecords('test_table', {
          filters: [{ field: 'name', operator: 'contains', value: 'Smith' }],
        })

        expect(result.data).toHaveLength(2)
      })
    })

    describe('operator: starts_with', () => {
      it('matches prefix', async () => {
        const table = createTestTable([
          { name: { value: 'Alice', display_value: 'Alice' } },
          { name: { value: 'Albert', display_value: 'Albert' } },
          { name: { value: 'Bob', display_value: 'Bob' } },
        ])
        initializeApi([table])

        const result = await getRecords('test_table', {
          filters: [{ field: 'name', operator: 'starts_with', value: 'Al' }],
        })

        expect(result.data).toHaveLength(2)
      })
    })

    describe('operator: ends_with', () => {
      it('matches suffix', async () => {
        const table = createTestTable([
          { name: { value: 'Alice', display_value: 'Alice' } },
          { name: { value: 'Grace', display_value: 'Grace' } },
          { name: { value: 'Bob', display_value: 'Bob' } },
        ])
        initializeApi([table])

        const result = await getRecords('test_table', {
          filters: [{ field: 'name', operator: 'ends_with', value: 'ce' }],
        })

        expect(result.data).toHaveLength(2)
      })
    })

    describe('operator: greater_than', () => {
      it('compares string values alphabetically', async () => {
        const table = createTestTable([
          { name: { value: 'Apple', display_value: 'Apple' } },
          { name: { value: 'Banana', display_value: 'Banana' } },
          { name: { value: 'Cherry', display_value: 'Cherry' } },
        ])
        initializeApi([table])

        const result = await getRecords('test_table', {
          filters: [{ field: 'name', operator: 'greater_than', value: 'Banana' }],
        })

        // Only "Cherry" > "banana" alphabetically (case insensitive)
        expect(result.data).toHaveLength(1)
        expect(result.data[0].name).toEqual({ value: 'Cherry', display_value: 'Cherry' })
      })
    })

    describe('operator: less_than', () => {
      it('compares string values', async () => {
        const table = createTestTable([
          { priority: { value: '1', display_value: '1 - Critical' } },
          { priority: { value: '2', display_value: '2 - High' } },
          { priority: { value: '3', display_value: '3 - Medium' } },
        ])
        initializeApi([table])

        const result = await getRecords('test_table', {
          filters: [{ field: 'priority', operator: 'less_than', value: '2' }],
        })

        // "1 - Critical" < "2" alphabetically
        expect(result.data).toHaveLength(1)
      })
    })

    describe('filter conjunctions', () => {
      it('applies AND conjunction by default', async () => {
        const table = createTestTable([
          { name: { value: 'Alice', display_value: 'Alice' }, priority: { value: '1', display_value: '1' } },
          { name: { value: 'Alice', display_value: 'Alice' }, priority: { value: '2', display_value: '2' } },
          { name: { value: 'Bob', display_value: 'Bob' }, priority: { value: '1', display_value: '1' } },
        ])
        initializeApi([table])

        const result = await getRecords('test_table', {
          filters: [
            { field: 'name', operator: 'is', value: 'Alice' },
            { field: 'priority', operator: 'is', value: '1' },
          ],
        })

        expect(result.data).toHaveLength(1)
      })

      it('applies OR conjunction when specified', async () => {
        const table = createTestTable([
          { name: { value: 'Alice', display_value: 'Alice' } },
          { name: { value: 'Bob', display_value: 'Bob' } },
          { name: { value: 'Charlie', display_value: 'Charlie' } },
        ])
        initializeApi([table])

        const result = await getRecords('test_table', {
          filters: [
            { field: 'name', operator: 'is', value: 'Alice', conjunction: 'OR' },
            { field: 'name', operator: 'is', value: 'Bob' },
          ],
        })

        expect(result.data).toHaveLength(2)
      })
    })
  })

  describe('getRecords - search', () => {
    it('searches across string and text fields', async () => {
      const table = createTestTable([
        {
          name: { value: 'Server Issue', display_value: 'Server Issue' },
          description: { value: 'Production down', display_value: 'Production down' },
        },
        {
          name: { value: 'Normal Request', display_value: 'Normal Request' },
          description: { value: 'Need access', display_value: 'Need access' },
        },
        {
          name: { value: 'Another Issue', display_value: 'Another Issue' },
          description: { value: 'Server maintenance', display_value: 'Server maintenance' },
        },
      ])
      initializeApi([table])

      const result = await getRecords('test_table', { search: 'server' })

      expect(result.data).toHaveLength(2)
    })

    it('is case insensitive', async () => {
      const table = createTestTable([
        { name: { value: 'SERVER', display_value: 'SERVER' } },
        { name: { value: 'server', display_value: 'server' } },
        { name: { value: 'Other', display_value: 'Other' } },
      ])
      initializeApi([table])

      const result = await getRecords('test_table', { search: 'Server' })

      expect(result.data).toHaveLength(2)
    })

    it('does not search non-string fields', async () => {
      const table = createTestTable([
        {
          name: { value: 'Test', display_value: 'Test' },
          active: { value: 'true', display_value: 'true' },
        },
      ])
      initializeApi([table])

      // 'active' is boolean type, should not be searched
      const result = await getRecords('test_table', { search: 'true' })

      expect(result.data).toHaveLength(0)
    })
  })

  describe('getRecords - sorting', () => {
    it('sorts ascending by default', async () => {
      const table = createTestTable([
        { name: { value: 'Charlie', display_value: 'Charlie' } },
        { name: { value: 'Alice', display_value: 'Alice' } },
        { name: { value: 'Bob', display_value: 'Bob' } },
      ])
      initializeApi([table])

      const result = await getRecords('test_table', { sortField: 'name' })

      expect(result.data[0].name).toEqual({ value: 'Alice', display_value: 'Alice' })
      expect(result.data[1].name).toEqual({ value: 'Bob', display_value: 'Bob' })
      expect(result.data[2].name).toEqual({ value: 'Charlie', display_value: 'Charlie' })
    })

    it('sorts descending when specified', async () => {
      const table = createTestTable([
        { name: { value: 'Alice', display_value: 'Alice' } },
        { name: { value: 'Bob', display_value: 'Bob' } },
        { name: { value: 'Charlie', display_value: 'Charlie' } },
      ])
      initializeApi([table])

      const result = await getRecords('test_table', {
        sortField: 'name',
        sortDirection: 'desc',
      })

      expect(result.data[0].name).toEqual({ value: 'Charlie', display_value: 'Charlie' })
      expect(result.data[2].name).toEqual({ value: 'Alice', display_value: 'Alice' })
    })

    it('sorts by display_value for FieldValue objects', async () => {
      const table = createTestTable([
        { assigned_to: { value: 'user_3', display_value: 'Charlie' } },
        { assigned_to: { value: 'user_1', display_value: 'Alice' } },
        { assigned_to: { value: 'user_2', display_value: 'Bob' } },
      ])
      initializeApi([table])

      const result = await getRecords('test_table', { sortField: 'assigned_to' })

      // Should sort by display_value, not sys_id value
      expect(result.data[0].assigned_to).toEqual({ value: 'user_1', display_value: 'Alice' })
    })
  })

  describe('getRecords - pagination', () => {
    it('returns first page by default', async () => {
      const records = Array.from({ length: 25 }, (_, i) => ({
        name: { value: `Item ${i}`, display_value: `Item ${i}` },
      }))
      const table = createTestTable(records)
      initializeApi([table])

      const result = await getRecords('test_table')

      expect(result.data).toHaveLength(20) // default pageSize
      expect(result.page).toBe(1)
      expect(result.total).toBe(25)
    })

    it('returns specified page', async () => {
      const records = Array.from({ length: 25 }, (_, i) => ({
        name: { value: `Item ${i}`, display_value: `Item ${i}` },
      }))
      const table = createTestTable(records)
      initializeApi([table])

      const result = await getRecords('test_table', { page: 2 })

      expect(result.data).toHaveLength(5) // remaining items
      expect(result.page).toBe(2)
      expect(result.total).toBe(25)
    })

    it('respects custom pageSize', async () => {
      const records = Array.from({ length: 15 }, (_, i) => ({
        name: { value: `Item ${i}`, display_value: `Item ${i}` },
      }))
      const table = createTestTable(records)
      initializeApi([table])

      const result = await getRecords('test_table', { pageSize: 5 })

      expect(result.data).toHaveLength(5)
      expect(result.pageSize).toBe(5)
    })

    it('returns empty array for page beyond data', async () => {
      const table = createTestTable([
        { name: { value: 'Only', display_value: 'Only' } },
      ])
      initializeApi([table])

      const result = await getRecords('test_table', { page: 10 })

      expect(result.data).toHaveLength(0)
      expect(result.total).toBe(1)
    })

    it('reports total before pagination', async () => {
      const records = Array.from({ length: 50 }, (_, i) => ({
        name: { value: `Item ${i}`, display_value: `Item ${i}` },
      }))
      const table = createTestTable(records)
      initializeApi([table])

      const result = await getRecords('test_table', {
        filters: [{ field: 'name', operator: 'contains', value: '1' }],
        page: 1,
        pageSize: 5,
      })

      // Items containing '1': 1, 10-19, 21, 31, 41 = 14 items
      expect(result.total).toBe(14)
      expect(result.data).toHaveLength(5)
    })
  })

  describe('CRUD operations', () => {
    describe('getRecord', () => {
      it('returns record by sys_id', async () => {
        const table = createTestTable([
          { sys_id: 'abc123', name: { value: 'Test', display_value: 'Test' } },
        ])
        initializeApi([table])

        const record = await getRecord('test_table', 'abc123')

        expect(record).not.toBeNull()
        expect(record?.sys_id).toBe('abc123')
      })

      it('returns null for non-existent sys_id', async () => {
        const table = createTestTable([])
        initializeApi([table])

        const record = await getRecord('test_table', 'nonexistent')

        expect(record).toBeNull()
      })

      it('throws for non-existent table', async () => {
        initializeApi([])

        await expect(getRecord('fake_table', 'id')).rejects.toThrow(
          'Table "fake_table" not found'
        )
      })
    })

    describe('createRecord', () => {
      it('generates sys_id', async () => {
        const table = createTestTable([])
        initializeApi([table])

        const record = await createRecord('test_table', {
          name: { value: 'New', display_value: 'New' },
        })

        expect(record.sys_id).toBeDefined()
        expect(typeof record.sys_id).toBe('string')
        expect(record.sys_id.length).toBeGreaterThan(0)
      })

      it('adds sys_created_on and sys_updated_on', async () => {
        const table = createTestTable([])
        initializeApi([table])

        const record = await createRecord('test_table', {})

        expect(record.sys_created_on).toBeDefined()
        expect(record.sys_updated_on).toBeDefined()
      })

      it('adds record to data', async () => {
        const table = createTestTable([])
        initializeApi([table])

        await createRecord('test_table', {
          name: { value: 'New', display_value: 'New' },
        })

        const result = await getRecords('test_table')
        expect(result.total).toBe(1)
      })
    })

    describe('updateRecord', () => {
      it('preserves sys_id', async () => {
        const table = createTestTable([
          { sys_id: 'fixed_id', name: { value: 'Old', display_value: 'Old' } },
        ])
        initializeApi([table])

        const updated = await updateRecord('test_table', 'fixed_id', {
          sys_id: 'attempted_override',
          name: { value: 'New', display_value: 'New' },
        })

        expect(updated.sys_id).toBe('fixed_id')
      })

      it('merges updates with existing data', async () => {
        const table = createTestTable([
          {
            sys_id: 'id1',
            name: { value: 'Name', display_value: 'Name' },
            priority: { value: '1', display_value: '1' },
          },
        ])
        initializeApi([table])

        const updated = await updateRecord('test_table', 'id1', {
          priority: { value: '2', display_value: '2' },
        })

        expect(updated.name).toEqual({ value: 'Name', display_value: 'Name' })
        expect(updated.priority).toEqual({ value: '2', display_value: '2' })
      })

      it('updates sys_updated_on', async () => {
        const table = createTestTable([{ sys_id: 'id1' }])
        initializeApi([table])

        const before = new Date().toISOString()
        const updated = await updateRecord('test_table', 'id1', {})
        const after = new Date().toISOString()

        expect(updated.sys_updated_on).toBeDefined()
        expect(updated.sys_updated_on! >= before).toBe(true)
        expect(updated.sys_updated_on! <= after).toBe(true)
      })

      it('throws for non-existent record', async () => {
        const table = createTestTable([])
        initializeApi([table])

        await expect(
          updateRecord('test_table', 'nonexistent', {})
        ).rejects.toThrow('Record "nonexistent" not found')
      })
    })

    describe('deleteRecord', () => {
      it('removes record from data', async () => {
        const table = createTestTable([
          { sys_id: 'to_delete' },
          { sys_id: 'to_keep' },
        ])
        initializeApi([table])

        await deleteRecord('test_table', 'to_delete')

        const result = await getRecords('test_table')
        expect(result.total).toBe(1)
        expect(result.data[0].sys_id).toBe('to_keep')
      })

      it('throws for non-existent record', async () => {
        const table = createTestTable([])
        initializeApi([table])

        await expect(deleteRecord('test_table', 'nonexistent')).rejects.toThrow(
          'Record "nonexistent" not found'
        )
      })
    })
  })

  describe('getTableDefinition', () => {
    it('returns table definition', () => {
      const table = createTestTable([])
      initializeApi([table])

      const def = getTableDefinition('test_table')

      expect(def).toBeDefined()
      expect(def?.name).toBe('test_table')
      expect(def?.label).toBe('Test Table')
    })

    it('returns undefined for non-existent table', () => {
      initializeApi([])

      const def = getTableDefinition('fake_table')

      expect(def).toBeUndefined()
    })
  })

  describe('getRelatedRecords', () => {
    it('finds records by reference field value', async () => {
      const table = createTestTable([
        { assigned_to: { value: 'user_1', display_value: 'Alice' } },
        { assigned_to: { value: 'user_1', display_value: 'Alice' } },
        { assigned_to: { value: 'user_2', display_value: 'Bob' } },
      ])
      initializeApi([table])

      const result = await getRelatedRecords('test_table', 'assigned_to', 'user_1')

      expect(result.data).toHaveLength(2)
      expect(result.total).toBe(2)
    })

    it('returns empty for non-existent table', async () => {
      initializeApi([])

      const result = await getRelatedRecords('fake_table', 'field', 'value')

      expect(result.data).toHaveLength(0)
      expect(result.total).toBe(0)
    })
  })
})
