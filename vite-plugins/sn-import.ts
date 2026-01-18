import { loadEnv, type Plugin } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import type {
  FieldType,
  FieldDefinition,
  TableDefinition,
  SNRecord,
} from '../src/types';
import { backfillReferences } from './backfill';

// ServiceNow API response types
interface SNFieldMeta {
  type: string;
  label: string;
  mandatory?: boolean;
  read_only?: boolean;
  max_length?: number;
  reference?: string;
  choices?: Array<{ value: string; label: string }>;
}

interface SNMetaResponse {
  result: {
    columns: Record<string, SNFieldMeta>;
  };
}

interface SNTableResponse {
  result: Array<Record<string, unknown>>;
}

interface SNDbObjectResponse {
  result: Array<{
    label: string;
  }>;
}

interface SNListResponse {
  result: Array<{
    sys_id: string;
    name: string;
  }>;
}

interface SNListElementResponse {
  result: Array<{
    element: string;
    position: string;
  }>;
}

interface SNSectionResponse {
  result: Array<{
    sys_id: string;
    caption: string;
    position: string;
  }>;
}

interface SNElementResponse {
  result: Array<{
    element: string;
    position: string;
    type: string;
  }>;
}

// Intermediate types for parsing SN layout responses
interface ParsedListLayout {
  columns: string[];
}

interface ParsedFormSection {
  name: string;
  label?: string;
  fields: string[];
}

interface ParsedFormLayout {
  sections: ParsedFormSection[];
}

/** Map ServiceNow field types to our internal types */
const snTypeMap: Record<string, FieldType> = {
  string: 'string',
  integer: 'integer',
  boolean: 'boolean',
  reference: 'reference',
  choice: 'choice',
  glide_date_time: 'datetime',
  glide_date: 'date',
  html: 'richtext',
  journal: 'text',
  journal_input: 'text',
  translated_html: 'richtext',
  translated_text: 'text',
  email: 'email',
  url: 'url',
  phone_number_e164: 'phone',
  currency: 'currency',
  decimal: 'integer',
  float: 'integer',
  percent_complete: 'integer',
  sys_class_name: 'string',
  script: 'text',
  script_plain: 'text',
  conditions: 'string',
  documentation_field: 'text',
  table_name: 'string',
  field_name: 'string',
};

/** Transform ServiceNow meta response to our TableDefinition format */
function transformMetaToTableDefinition(
  tableName: string,
  tableLabel: string,
  meta: SNMetaResponse,
  records: SNTableResponse,
  listLayout?: ParsedListLayout,
  formLayout?: ParsedFormLayout,
): TableDefinition {
  const columns = meta.result.columns;
  const fields: FieldDefinition[] = [];
  const fieldNames: string[] = [];

  // Skip internal sys_ fields except sys_id
  const skipFields = new Set([
    'sys_created_by',
    'sys_created_on',
    'sys_mod_count',
    'sys_tags',
    'sys_domain',
    'sys_domain_path',
    'sys_class_name',
  ]);

  for (const [name, fieldMeta] of Object.entries(columns)) {
    if (skipFields.has(name)) continue;

    const fieldType = snTypeMap[fieldMeta.type] || 'string';
    const field: FieldDefinition = {
      name,
      type: fieldType,
      label: fieldMeta.label || name,
    };

    if (fieldMeta.mandatory) field.required = true;
    if (fieldMeta.read_only) field.readonly = true;
    if (fieldMeta.max_length && fieldMeta.max_length > 0) {
      field.maxLength = fieldMeta.max_length;
    }
    if (fieldMeta.reference) field.reference = fieldMeta.reference;
    if (fieldMeta.choices && fieldMeta.choices.length > 0) {
      field.choices = fieldMeta.choices.map((c) => c.label || c.value);
    }

    fields.push(field);
    fieldNames.push(name);
  }

  // Use fetched list columns or fall back to first 8 non-sys fields
  const listColumns = listLayout?.columns.length
    ? listLayout.columns.filter((col) => fieldNames.includes(col))
    : fieldNames
        .filter((f) => !f.startsWith('sys_') || f === 'sys_updated_on')
        .slice(0, 8);

  // Transform records - preserve {value, display_value} structure for all fields
  const data: SNRecord[] = records.result.map((record) => {
    const transformed: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(record)) {
      if (key === 'sys_id') {
        // sys_id stays as plain string
        transformed[key] = typeof value === 'object' && value !== null && 'value' in value
          ? (value as { value: string }).value
          : String(value);
      } else if (typeof value === 'object' && value !== null && 'value' in value) {
        // ServiceNow returns { value, display_value } - preserve both
        const snValue = value as { value: string; display_value?: string };
        transformed[key] = {
          value: snValue.value ?? '',
          display_value: snValue.display_value ?? snValue.value ?? ''
        };
      } else {
        // Simple fields: value and display_value are the same
        const strValue = value === null || value === undefined ? '' : String(value);
        transformed[key] = {
          value: strValue,
          display_value: strValue
        };
      }
    }
    // ServiceNow records always have sys_id
    return transformed as SNRecord;
  });

  const label = tableLabel;

  // Use fetched form sections or fall back to single section with first 12 fields
  const formSections = formLayout?.sections.length
    ? formLayout.sections.map((section, idx) => ({
        name: section.name || `section_${idx}`,
        label: section.label,
        columns: 2 as const,
        fields: section.fields.filter((f) => fieldNames.includes(f)),
      }))
    : [
        {
          name: 'main',
          columns: 2 as const,
          fields: fieldNames.filter((f) => !f.startsWith('sys_')).slice(0, 12),
        },
      ];

  return {
    name: tableName,
    label,
    labelPlural: label + 's',
    fields,
    list: {
      columns: listColumns,
      defaultSort: { field: 'sys_updated_on', direction: 'desc' },
      pageSize: 20,
    },
    form: {
      sections: formSections,
    },
    data,
  };
}

/** Fetch list layout from sys_ui_list and sys_ui_list_element */
async function fetchListLayout(
  instance: string,
  tableName: string,
  authHeader: string,
): Promise<ParsedListLayout | undefined> {
  try {
    // Get default list configuration (not user-personalized)
    const listUrl = `${instance}/api/now/table/sys_ui_list?sysparm_query=name=${tableName}^view=Default view^userISEMPTY^parent=NULL&sysparm_fields=sys_id&sysparm_limit=1`;
    const listResponse = await fetch(listUrl, {
      headers: { Authorization: authHeader, Accept: 'application/json' },
    });

    if (!listResponse.ok) return undefined;

    const listData = (await listResponse.json()) as SNListResponse;
    if (!listData.result?.[0]?.sys_id) return undefined;

    const listId = listData.result[0].sys_id;

    // Get columns in order
    const elementsUrl = `${instance}/api/now/table/sys_ui_list_element?sysparm_query=list_id=${listId}^ORDERBYposition&sysparm_fields=element,position`;
    const elementsResponse = await fetch(elementsUrl, {
      headers: { Authorization: authHeader, Accept: 'application/json' },
    });

    if (!elementsResponse.ok) return undefined;

    const elementsData =
      (await elementsResponse.json()) as SNListElementResponse;
    const columns = elementsData.result
      .sort((a, b) => parseInt(a.position) - parseInt(b.position))
      .map((el) => el.element);

    return columns.length ? { columns } : undefined;
  } catch {
    return undefined;
  }
}

/** Fetch form layout from sys_ui_section and sys_ui_element */
async function fetchFormLayout(
  instance: string,
  tableName: string,
  authHeader: string,
): Promise<ParsedFormLayout | undefined> {
  try {
    // Get form sections for default view //name=sc_req_item^view=Default view
    const sectionsUrl = `${instance}/api/now/table/sys_ui_section?sysparm_query=name=${tableName}^view=Default view^ORDERBYposition&sysparm_fields=sys_id,caption,position`;
    const sectionsResponse = await fetch(sectionsUrl, {
      headers: { Authorization: authHeader, Accept: 'application/json' },
    });

    if (!sectionsResponse.ok) return undefined;

    const sectionsData = (await sectionsResponse.json()) as SNSectionResponse;
    if (!sectionsData.result?.length) return undefined;

    const sections: ParsedFormSection[] = [];

    // Fetch elements for each section
    for (const section of sectionsData.result) {
      const elementsUrl = `${instance}/api/now/table/sys_ui_element?sysparm_query=sys_ui_section=${section.sys_id}^ORDERBYposition&sysparm_fields=element,position,type`;
      const elementsResponse = await fetch(elementsUrl, {
        headers: { Authorization: authHeader, Accept: 'application/json' },
      });

      if (elementsResponse.ok) {
        const elementsData =
          (await elementsResponse.json()) as SNElementResponse;
        const fields = elementsData.result
          .filter((el) => el.type !== 'formatter' && el.type !== 'annotation')
          .sort((a, b) => parseInt(a.position) - parseInt(b.position))
          .map((el) => el.element);

        if (fields.length) {
          sections.push({
            name:
              section.caption?.toLowerCase().replace(/\s+/g, '_') ||
              `section_${section.position}`,
            label: section.caption || undefined,
            fields,
          });
        }
      }
    }

    return sections.length ? { sections } : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Vite plugin that provides an API endpoint to import ServiceNow table definitions.
 * Proxies requests to ServiceNow to avoid CORS issues.
 */
export function snImportPlugin(): Plugin {
  const tablesDir = path.resolve(__dirname, '../src/data/tables');

  return {
    name: 'sn-import',
    configureServer(server) {
      const env = loadEnv(server.config.mode, process.cwd(), '');
      server.middlewares.use('/api/sn/import', async (req, res, next) => {
        if (req.method !== 'POST') {
          return next();
        }

        let body = '';
        for await (const chunk of req) {
          body += chunk;
        }

        try {
          const { tableName } = JSON.parse(body);
          if (!tableName) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'tableName is required' }));
            return;
          }

          // Read environment variables
          const instance = env.VITE_SN_INSTANCE;
          const username = env.VITE_SN_USERNAME;
          const password = env.VITE_SN_PASSWORD;

          if (!instance || !username || !password) {
            res.statusCode = 400;
            res.end(
              JSON.stringify({
                error:
                  'Missing ServiceNow credentials. Set VITE_SN_INSTANCE, VITE_SN_USERNAME, VITE_SN_PASSWORD in .env',
              }),
            );
            return;
          }

          const authHeader =
            'Basic ' +
            Buffer.from(`${username}:${password}`).toString('base64');

          // Fetch table label from sys_db_object
          const dbObjectUrl = `${instance}/api/now/table/sys_db_object?sysparm_query=name=${tableName}&sysparm_fields=label&sysparm_limit=1`;
          const dbObjectResponse = await fetch(dbObjectUrl, {
            headers: {
              Authorization: authHeader,
              Accept: 'application/json',
            },
          });

          let tableLabel = tableName
            .split('_')
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' '); // Fallback to title case

          if (dbObjectResponse.ok) {
            const dbObject =
              (await dbObjectResponse.json()) as SNDbObjectResponse;
            if (dbObject.result?.[0]?.label) {
              tableLabel = dbObject.result[0].label;
            }
          }

          // Fetch metadata
          const metaUrl = `${instance}/api/now/ui/meta/${tableName}`;
          const metaResponse = await fetch(metaUrl, {
            headers: {
              Authorization: authHeader,
              Accept: 'application/json',
            },
          });

          if (!metaResponse.ok) {
            const errorText = await metaResponse.text();
            res.statusCode = metaResponse.status;
            res.end(
              JSON.stringify({
                error: `Failed to fetch table metadata: ${metaResponse.status} ${errorText}`,
              }),
            );
            return;
          }

          const meta = (await metaResponse.json()) as SNMetaResponse;

          // Fetch sample records
          const recordsUrl = `${instance}/api/now/table/${tableName}?sysparm_limit=10&sysparm_display_value=all`;
          const recordsResponse = await fetch(recordsUrl, {
            headers: {
              Authorization: authHeader,
              Accept: 'application/json',
            },
          });

          if (!recordsResponse.ok) {
            const errorText = await recordsResponse.text();
            res.statusCode = recordsResponse.status;
            res.end(
              JSON.stringify({
                error: `Failed to fetch table records: ${recordsResponse.status} ${errorText}`,
              }),
            );
            return;
          }

          const records = (await recordsResponse.json()) as SNTableResponse;

          // Fetch list and form layouts (these may fail without admin role, so we handle gracefully)
          const [listLayout, formLayout] = await Promise.all([
            fetchListLayout(instance, tableName, authHeader),
            fetchFormLayout(instance, tableName, authHeader),
          ]);

          // Transform to our format
          const tableDef = transformMetaToTableDefinition(
            tableName,
            tableLabel,
            meta,
            records,
            listLayout,
            formLayout,
          );

          // Write to file
          const filePath = path.join(tablesDir, `${tableName}.json`);
          fs.writeFileSync(filePath, JSON.stringify(tableDef, null, 2) + '\n');

          // Backfill missing first-level references for local tables
          const backfilled = await backfillReferences(
            tableDef,
            tablesDir,
            instance,
            authHeader,
          );

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              success: true,
              tableName,
              fieldCount: tableDef.fields.length,
              recordCount: tableDef.data.length,
              backfilled,
              tableDef,
            }),
          );
        } catch (error) {
          console.error('Import failed:', error);
          res.statusCode = 500;
          res.end(
            JSON.stringify({
              error: `Import failed: ${
                error instanceof Error ? error.message : String(error)
              }`,
            }),
          );
        }
      });
    },
  };
}
