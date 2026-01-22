import { loadEnv, type Plugin } from 'vite';
import { generateText, type LanguageModel } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { ollama } from 'ollama-ai-provider';
import { executeWebSearch } from './tools';

/** Supported AI providers */
type AiProvider = 'anthropic' | 'openai' | 'google' | 'ollama';

/** Default models for each provider */
const DEFAULT_MODELS: Record<AiProvider, string> = {
  anthropic: 'claude-sonnet-4-20250514',
  openai: 'gpt-4o',
  google: 'gemini-1.5-flash',
  ollama: 'llama3.2',
};

/** Request body for AI generation */
interface GenerateRequest {
  provider?: AiProvider;
  model?: string;
  prompt: string;
  maxTokens?: number;
  tools?: string[];
}

/** Get the model instance for a provider */
function getModel(
  provider: AiProvider,
  modelId: string,
  apiKey?: string,
): LanguageModel {
  // Cast through unknown due to SDK version mismatch (some providers return V1, SDK expects V2/V3)
  switch (provider) {
    case 'anthropic':
      return createAnthropic({ apiKey })(modelId) as unknown as LanguageModel;
    case 'openai':
      return createOpenAI({ apiKey })(modelId) as unknown as LanguageModel;
    case 'google':
      return createGoogleGenerativeAI({ apiKey })(
        modelId,
      ) as unknown as LanguageModel;
    case 'ollama':
      return ollama(modelId) as unknown as LanguageModel;
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

/**
 * Execute tools and gather context for enriched generation.
 * Returns tool results as context string.
 */
async function executeToolsForContext(
  model: LanguageModel,
  prompt: string,
  requestedTools: string[],
  env: Record<string, string>,
): Promise<string> {
  const toolsContext: string[] = [];

  // Execute web_search tool if requested
  if (requestedTools.includes('web_search')) {
    const serperKey = env.SERPER_API_KEY;
    if (!serperKey) {
      toolsContext.push(
        '[web_search unavailable: SERPER_API_KEY not configured]',
      );
    } else {
      try {
        // Ask the model to generate a search query based on the prompt
        const queryResult = await generateText({
          model,
          prompt: `Based on this request, generate a concise search query (just the query, nothing else):

"${prompt}"

Search query:`,
          maxOutputTokens: 50,
        });

        const query = queryResult.text.trim();
        if (query) {
          console.log(`[web_search] Searching for: ${query}`);
          const searchResults = await executeWebSearch(query, serperKey);
          toolsContext.push(`[web_search results for "${query}"]\n${searchResults}`);
        }
      } catch (error) {
        console.error('web_search failed:', error);
        toolsContext.push(
          `[web_search error: ${error instanceof Error ? error.message : 'unknown'}]`,
        );
      }
    }
  }

  return toolsContext.join('\n\n');
}

/**
 * Vite plugin that provides an API endpoint for AI content generation.
 * Routes requests through Vercel AI SDK to multiple providers.
 * Supports tools that enrich context before final generation.
 * API keys are kept server-side for security.
 */
export function aiGeneratePlugin(): Plugin {
  return {
    name: 'ai-generate',
    configureServer(server) {
      const env = loadEnv(server.config.mode, process.cwd(), '');

      server.middlewares.use('/api/ai/generate', async (req, res, next) => {
        if (req.method !== 'POST') {
          return next();
        }

        let body = '';
        for await (const chunk of req) {
          body += chunk;
        }

        try {
          const request: GenerateRequest = JSON.parse(body);

          if (!request.prompt) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'prompt is required' }));
            return;
          }

          // Determine provider (from request, env, or default)
          const provider = (request.provider ||
            env.VITE_AI_PROVIDER ||
            'anthropic') as AiProvider;

          // Determine model (from request, env, or provider default)
          const model =
            request.model || env.VITE_AI_MODEL || DEFAULT_MODELS[provider];

          // Get API key (not needed for Ollama)
          const keyEnvVar = `${provider.toUpperCase()}_API_KEY`;
          const apiKey = provider !== 'ollama' ? env[keyEnvVar] : undefined;

          if (provider !== 'ollama' && !apiKey) {
            res.statusCode = 400;
            res.end(
              JSON.stringify({
                error: `${keyEnvVar} not configured. Add it to your .env file.`,
              }),
            );
            return;
          }

          const modelInstance = getModel(provider, model, apiKey);

          // Phase 1: Execute tools to gather context (if tools requested)
          let enrichedPrompt = request.prompt;
          let toolsUsed: string[] = [];

          if (request.tools?.length) {
            const toolContext = await executeToolsForContext(
              modelInstance,
              request.prompt,
              request.tools,
              env,
            );

            if (toolContext) {
              enrichedPrompt = `${request.prompt}

---
Additional context from research:

${toolContext}

---
Use the above research to inform your response.`;
              toolsUsed = request.tools;
            }
          }

          // Phase 2: Generate final content with enriched context
          const result = await generateText({
            model: modelInstance,
            prompt: enrichedPrompt,
            maxOutputTokens: request.maxTokens || 1024,
          });

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              content: result.text,
              provider,
              model,
              toolsUsed,
            }),
          );
        } catch (error) {
          console.error('AI generation failed:', error);
          res.statusCode = 500;
          res.end(
            JSON.stringify({
              error: `Generation failed: ${error instanceof Error ? error.message : String(error)}`,
            }),
          );
        }
      });
    },
  };
}
