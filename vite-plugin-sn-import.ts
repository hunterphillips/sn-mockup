// import type { Plugin } from 'vite';
import { loadEnv, type Plugin } from 'vite'; // Fixed import
import fs from 'node:fs';
import path from 'node:path';

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

type FieldType =
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
  | 'currency';

interface FieldDefinition {
  name: string;
  type: FieldType;
  label: string;
  required?: boolean;
  readonly?: boolean;
  choices?: string[];
  reference?: string;
  maxLength?: number;
}

interface TableDefinition {
  name: string;
  label: string;
  labelPlural: string;
  fields: FieldDefinition[];
  list: {
    columns: string[];
    defaultSort?: { field: string; direction: 'asc' | 'desc' };
    pageSize: number;
  };
  form: {
    sections: Array<{
      name: string;
      label?: string;
      columns: 1 | 2;
      fields: string[];
    }>;
  };
  data: Array<Record<string, unknown>>;
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
  meta: SNMetaResponse,
  records: SNTableResponse
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

  // Generate list columns: first 8 non-sys fields (keep sys_id, sys_updated_on)
  const listColumns = fieldNames
    .filter((f) => !f.startsWith('sys_') || f === 'sys_updated_on')
    .slice(0, 8);

  // Transform records - extract display values
  const data = records.result.map((record) => {
    const transformed: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(record)) {
      if (typeof value === 'object' && value !== null && 'value' in value) {
        // ServiceNow returns { value, display_value } for reference/choice fields
        transformed[key] = (value as { value: string }).value;
      } else {
        transformed[key] = value;
      }
    }
    return transformed;
  });

  // Generate a readable label from table name
  const label = tableName
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

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
      sections: [
        {
          name: 'main',
          columns: 2,
          fields: fieldNames.filter((f) => !f.startsWith('sys_')).slice(0, 12),
        },
      ],
    },
    data,
  };
}

/**
 * Vite plugin that provides an API endpoint to import ServiceNow table definitions.
 * Proxies requests to ServiceNow to avoid CORS issues.
 */
export function snImportPlugin(): Plugin {
  const tablesDir = path.resolve(__dirname, 'src/data/tables');

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
              })
            );
            return;
          }

          const authHeader =
            'Basic ' +
            Buffer.from(`${username}:${password}`).toString('base64');

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
              })
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
              })
            );
            return;
          }

          const records = (await recordsResponse.json()) as SNTableResponse;

          // Transform to our format
          const tableDef = transformMetaToTableDefinition(
            tableName,
            meta,
            records
          );

          // Write to file
          const filePath = path.join(tablesDir, `${tableName}.json`);
          fs.writeFileSync(filePath, JSON.stringify(tableDef, null, 2) + '\n');

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              success: true,
              tableName,
              fieldCount: tableDef.fields.length,
              recordCount: tableDef.data.length,
              tableDef,
            })
          );
        } catch (error) {
          console.error('Import failed:', error);
          res.statusCode = 500;
          res.end(
            JSON.stringify({
              error: `Import failed: ${
                error instanceof Error ? error.message : String(error)
              }`,
            })
          );
        }
      });
    },
  };
}
