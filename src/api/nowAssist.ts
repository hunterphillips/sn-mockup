import type { FieldDefinition, SNRecord, TableDefinition, AiAssistFieldConfig } from '../types';
import { getDisplayValue } from '../utils/fieldValue';

/** Default context fields if none configured */
const DEFAULT_CONTEXT_FIELDS = ['short_description', 'description', 'number', 'state', 'priority'];

/** Request payload for Now Assist content generation */
export interface NowAssistRequest {
  field: FieldDefinition;
  tableDef: TableDefinition;
  recordData: Partial<SNRecord>;
  refinement?: 'shorter' | 'more_detailed';
}

/** Get resolved AI config for a field */
function getFieldAiConfig(field: FieldDefinition): AiAssistFieldConfig | null {
  if (!field.aiAssist) return null;
  if (field.aiAssist === true) return {};
  if (field.aiAssist.enabled === false) return null;
  return field.aiAssist;
}

/** Response from Now Assist content generation */
export interface NowAssistResponse {
  content: string;
  error?: string;
}

/** Get the configured Anthropic model */
function getModel(): string {
  return import.meta.env.VITE_ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';
}

/** Get the configured Anthropic API key */
function getApiKey(): string {
  return import.meta.env.VITE_ANTHROPIC_API_KEY || '';
}

/** Build context from record data for AI prompt */
function buildRecordContext(
  tableDef: TableDefinition,
  recordData: Partial<SNRecord>,
  contextFields: string[]
): string {
  const contextParts: string[] = [];

  contextParts.push(`Table: ${tableDef.label}`);

  for (const fieldName of contextFields) {
    const value = getDisplayValue(recordData[fieldName]);
    if (value) {
      const fieldDef = tableDef.fields.find((f) => f.name === fieldName);
      const label = fieldDef?.label || fieldName;
      contextParts.push(`${label}: ${value}`);
    }
  }

  return contextParts.join('\n');
}

/** Resolve context fields: field config > table config > defaults */
function resolveContextFields(
  fieldConfig: AiAssistFieldConfig,
  tableDef: TableDefinition
): string[] {
  return fieldConfig.contextFields
    ?? tableDef.aiAssist?.contextFields
    ?? DEFAULT_CONTEXT_FIELDS;
}

/** Call Anthropic API for content generation */
export async function generateContent(
  request: NowAssistRequest
): Promise<NowAssistResponse> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { content: '', error: 'Anthropic API key not configured. Add VITE_ANTHROPIC_API_KEY to your .env file.' };
  }

  // Get field AI config (already validated as enabled by caller)
  const fieldConfig = getFieldAiConfig(request.field) ?? {};
  const contextFields = resolveContextFields(fieldConfig, request.tableDef);
  const recordContext = buildRecordContext(request.tableDef, request.recordData, contextFields);

  let prompt = `You are helping a ServiceNow user fill in the "${request.field.label}" field for a ${request.tableDef.label} record.

Record context:
${recordContext}

Generate appropriate content for the "${request.field.label}" field.`;

  // Add custom instructions if configured
  if (fieldConfig.instructions) {
    prompt += `\n\n${fieldConfig.instructions}`;
  }

  if (request.field.type === 'richtext') {
    prompt += `

Format the content as HTML using appropriate tags like <p>, <ul>, <li>, <strong> for structure.
IMPORTANT: Output raw HTML only. Do NOT wrap in code fences or markdown.`;
  }

  if (request.refinement === 'shorter') {
    prompt += '\n\nMake the content concise and brief.';
  } else if (request.refinement === 'more_detailed') {
    prompt += '\n\nProvide comprehensive, detailed content.';
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: getModel(),
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { content: '', error: `API error: ${response.status} - ${errorText}` };
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '';
    return { content };
  } catch (error) {
    return { content: '', error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}
