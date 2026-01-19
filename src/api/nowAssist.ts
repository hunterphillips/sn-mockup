import type {
  FieldDefinition,
  SNRecord,
  TableDefinition,
  AiAssistFieldConfig,
  AiAssistTableConfig,
} from '../types';
import { getDisplayValue } from '../utils/fieldValue';

/** Default context fields if none configured */
const DEFAULT_CONTEXT_FIELDS = [
  'short_description',
  'description',
  'number',
  'state',
  'priority',
];

/** Request payload for Now Assist content generation */
export interface NowAssistRequest {
  field: FieldDefinition;
  tableDef: TableDefinition;
  recordData: Partial<SNRecord>;
  refinement?: 'shorter' | 'more_detailed';
}

/** Response from Now Assist content generation */
export interface NowAssistResponse {
  content: string;
  error?: string;
}

/** Get resolved AI config for a field */
function getFieldAiConfig(field: FieldDefinition): AiAssistFieldConfig | null {
  if (!field.aiAssist) return null;
  if (field.aiAssist === true) return {};
  if (field.aiAssist.enabled === false) return null;
  return field.aiAssist;
}

/** Build context from record data for AI prompt */
function buildRecordContext(
  tableDef: TableDefinition,
  recordData: Partial<SNRecord>,
  contextFields: string[],
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

/** Resolve AI config value: field config > table config > default */
function resolveAiConfig<
  K extends keyof AiAssistFieldConfig & keyof AiAssistTableConfig,
>(
  key: K,
  fieldConfig: AiAssistFieldConfig,
  tableDef: TableDefinition,
  defaultValue?: AiAssistFieldConfig[K],
): AiAssistFieldConfig[K] {
  return fieldConfig[key] ?? tableDef.aiAssist?.[key] ?? defaultValue;
}

/** Build the full prompt for AI generation */
function buildPrompt(
  request: NowAssistRequest,
  fieldConfig: AiAssistFieldConfig,
): string {
  const contextFields = resolveAiConfig(
    'contextFields',
    fieldConfig,
    request.tableDef,
    DEFAULT_CONTEXT_FIELDS,
  )!;
  const recordContext = buildRecordContext(
    request.tableDef,
    request.recordData,
    contextFields,
  );

  let prompt = `You are helping a ServiceNow user fill in the "${request.field.label}" field for a ${request.tableDef.label} record.

Record context:
${recordContext}

Generate appropriate content for the "${request.field.label}" field.`;

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

  return prompt;
}

/** Generate content using AI (via server-side proxy) */
export async function generateContent(
  request: NowAssistRequest,
): Promise<NowAssistResponse> {
  const fieldConfig = getFieldAiConfig(request.field) ?? {};
  const prompt = buildPrompt(request, fieldConfig);
  const provider = resolveAiConfig('provider', fieldConfig, request.tableDef);
  const model = resolveAiConfig('model', fieldConfig, request.tableDef);
  const maxTokens = resolveAiConfig(
    'maxTokens',
    fieldConfig,
    request.tableDef,
    request.field.maxLength ?? 2048,
  );

  try {
    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, provider, model, maxTokens }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return {
        content: '',
        error: data.error || `API error: ${response.status}`,
      };
    }

    const data = await response.json();
    return { content: data.content || '' };
  } catch (error) {
    return {
      content: '',
      error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
