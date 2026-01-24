import { z } from 'zod';

/** Tool input schemas */
export const toolSchemas = {
  web_search: z.object({
    query: z.string().describe('Search query to find relevant information'),
  }),
  lookup_record: z.object({
    table: z.string().describe('Table name to search'),
    query: z.string().describe('Search term'),
  }),
} as const;

export type ToolName = keyof typeof toolSchemas;

/** Tool result from Serper API */
interface SerperResult {
  title: string;
  link: string;
  snippet: string;
}

interface SerperResponse {
  organic?: SerperResult[];
  answerBox?: { answer?: string; snippet?: string };
  knowledgeGraph?: { description?: string };
}

/** Format Serper results into context string */
function formatSearchResults(data: SerperResponse): string {
  const parts: string[] = [];

  // Include answer box if available
  if (data.answerBox?.answer) {
    parts.push(`Direct Answer: ${data.answerBox.answer}`);
  } else if (data.answerBox?.snippet) {
    parts.push(`Answer: ${data.answerBox.snippet}`);
  }

  // Include knowledge graph
  if (data.knowledgeGraph?.description) {
    parts.push(`Overview: ${data.knowledgeGraph.description}`);
  }

  // Include top organic results
  if (data.organic?.length) {
    const topResults = data.organic.slice(0, 3);
    parts.push('Search Results:');
    topResults.forEach((r, i) => {
      parts.push(`${i + 1}. ${r.title}: ${r.snippet}`);
    });
  }

  return parts.join('\n\n') || 'No results found.';
}

/** Execute web_search tool using Serper API */
export async function executeWebSearch(
  query: string,
  apiKey: string,
): Promise<string> {
  const response = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'X-API-KEY': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ q: query, num: 5 }),
  });

  if (!response.ok) {
    throw new Error(`Serper API error: ${response.status}`);
  }

  const data: SerperResponse = await response.json();
  return formatSearchResults(data);
}

/** Tool descriptions for AI */
export const toolDescriptions: Record<ToolName, string> = {
  web_search: 'Search the web for current information on a topic',
  lookup_record: 'Look up a record in a ServiceNow table',
};
