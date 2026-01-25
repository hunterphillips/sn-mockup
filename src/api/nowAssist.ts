import type {
  FieldDefinition,
  SNRecord,
  TableDefinition,
  AiAssistFieldConfig,
  AiAssistTableConfig,
  AiToolName,
  AiToolConfig,
  ClarifyContextConfig,
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
  userInput?: string;
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

/** Resolve tools configuration: field config > table config */
function resolveTools(
  fieldConfig: AiAssistFieldConfig,
  tableDef: TableDefinition,
): string[] {
  const toolsConfig = fieldConfig.tools ?? tableDef.aiAssist?.tools;
  if (!toolsConfig) return [];

  // Normalize to array of tool names
  return toolsConfig
    .map((t: AiToolName | AiToolConfig) => (typeof t === 'string' ? t : t.name))
    .filter((name): name is AiToolName => {
      // Filter out disabled tools
      const config = toolsConfig.find(
        (tc): tc is AiToolConfig => typeof tc === 'object' && tc.name === name,
      );
      return config?.enabled !== false;
    });
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

  // Include additional user input if present
  if (request.userInput?.trim()) {
    prompt += `\n\nUser guidance: ${request.userInput.trim()}`;
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
  const tools = resolveTools(fieldConfig, request.tableDef);

  try {
    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, provider, model, maxTokens, tools }),
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

/** Request payload for context clarification */
export interface ClarifyRequest {
  field: FieldDefinition;
  tableDef: TableDefinition;
  recordData: Partial<SNRecord>;
}

/** Response from context clarification */
export interface ClarifyResponse {
  sufficient: boolean;
  questions?: string[];
  error?: string;
}

/** Get clarifyContext config for a field */
function getClarifyConfig(
  field: FieldDefinition,
): ClarifyContextConfig | null {
  const aiConfig = getFieldAiConfig(field);
  if (!aiConfig?.clarifyContext) return null;
  if (aiConfig.clarifyContext === true) return {};
  return aiConfig.clarifyContext;
}

/** Evaluate context sufficiency and get clarifying questions if needed */
export async function clarifyContext(
  request: ClarifyRequest,
): Promise<ClarifyResponse> {
  const clarifyConfig = getClarifyConfig(request.field);
  if (!clarifyConfig) {
    // Clarify not enabled, context is sufficient
    return { sufficient: true };
  }

  const fieldConfig = getFieldAiConfig(request.field) ?? {};
  const contextFields = resolveAiConfig(
    'contextFields',
    fieldConfig,
    request.tableDef,
    DEFAULT_CONTEXT_FIELDS,
  )!;
  const context = buildRecordContext(
    request.tableDef,
    request.recordData,
    contextFields,
  );

  // Objective: use clarifyConfig.objective, then field.instructions, then default
  const objective =
    clarifyConfig.objective ||
    fieldConfig.instructions ||
    `Generate content for the "${request.field.label}" field`;

  // Provider/model: use clarifyConfig overrides, then resolve normally
  const provider =
    clarifyConfig.provider ??
    resolveAiConfig('provider', fieldConfig, request.tableDef);
  const model =
    clarifyConfig.model ??
    resolveAiConfig('model', fieldConfig, request.tableDef);

  const maxQuestions = clarifyConfig.maxQuestions ?? 3;

  try {
    const response = await fetch('/api/ai/clarify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context,
        objective,
        provider,
        model,
        maxQuestions,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return {
        sufficient: true, // Default to sufficient on error
        error: data.error || `API error: ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      sufficient: data.sufficient ?? true,
      questions: data.questions,
    };
  } catch (error) {
    return {
      sufficient: true, // Default to sufficient on network error
      error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
