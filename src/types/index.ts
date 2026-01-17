/** Field value wrapper - all record fields use this shape */
export interface FieldValue {
  value: string
  display_value: string
}

/** Field types supported in ServiceNow forms */
export type FieldType =
  | 'string'
  | 'text'
  | 'richtext'
  | 'integer'
  | 'boolean'
  | 'choice'
  | 'reference'
  | 'datetime'
  | 'date'
  | 'email'
  | 'url'
  | 'phone'
  | 'currency'

/** Definition of a single field in a table */
export interface FieldDefinition {
  name: string
  type: FieldType
  label: string
  required?: boolean
  readonly?: boolean
  choices?: string[]
  reference?: string // Table name for reference fields
  defaultValue?: unknown
  maxLength?: number
}

/** List view configuration */
export interface ListConfig {
  columns: string[]
  defaultSort?: {
    field: string
    direction: 'asc' | 'desc'
  }
  pageSize?: number
}

/** Form section configuration */
export interface FormSection {
  name: string
  label?: string
  columns: 1 | 2
  fields: string[]
  collapsible?: boolean
  collapsed?: boolean
}

/** Form view configuration */
export interface FormConfig {
  sections: FormSection[]
}

/** Related list definition for form views */
export interface RelatedListDefinition {
  /** Table containing the related records */
  table: string
  /** Display title for the related list tab */
  title: string
  /** Field in the related table that references this record */
  parentField: string
  /** Columns to display in the related list (defaults to table's list.columns) */
  columns?: string[]
}

/** A single record from any table */
export interface SNRecord {
  sys_id: string
  [key: string]: unknown
}

/** Complete table definition */
export interface TableDefinition {
  name: string
  label: string
  labelPlural?: string
  fields: FieldDefinition[]
  list: ListConfig
  form: FormConfig
  relatedLists?: RelatedListDefinition[]
  data: SNRecord[]
}

/** Query parameters for listing records */
export interface QueryParams {
  page?: number
  pageSize?: number
  sortField?: string
  sortDirection?: 'asc' | 'desc'
  filters?: FilterCondition[]
  search?: string
}

/** Filter condition for queries */
export interface FilterCondition {
  field: string
  operator: 'is' | 'is_not' | 'contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than'
  value: string
  conjunction?: 'AND' | 'OR'
}

/** API response for listing records */
export interface ListResponse {
  data: SNRecord[]
  total: number
  page: number
  pageSize: number
}

/** Navigation item in the app menu */
export interface NavItem {
  id: string
  label: string
  table?: string
  icon?: string
  children?: NavItem[]
}

/** User profile for the current session */
export interface UserProfile {
  sys_id: string
  name: string
  email: string
  avatar?: string
  title?: string
  company?: string
}
