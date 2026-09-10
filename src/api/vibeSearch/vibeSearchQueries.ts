import type { Tool } from '@anthropic-ai/sdk/resources/messages'
import type { SearchResult, SearchSuggestion } from '@/types/search'
import { sendMessage } from '@/api/claude/messages'
import { facetKey, buildCacheableTaxonomyBlock } from '@/api/taxonomy/taxonomyUtils'
import {
  MIN_REPLACED,
  MAX_REPLACED,
  SELECT_VIBE_FACETS_TOOL,
  SELECT_REFINED_VIBE_FACETS_TOOL,
  VIBE_SYSTEM_PROMPT,
  VIBE_REFINE_SYSTEM_PROMPT,
} from './vibeSearchConstants'
import { buildRefineUserMessage, parseFacets } from './vibeSearchUtils'

async function callFacetsTool(
  userMessage: string,
  systemPrompt: string,
  tool: Tool,
): Promise<SearchSuggestion[]> {
  const response = await sendMessage([{ role: 'user', content: userMessage }], {
    system: [{ type: 'text', text: systemPrompt }, buildCacheableTaxonomyBlock()],
    tools: [tool],
    tool_choice: { type: 'tool', name: tool.name },
  })

  if (!response.ok) {
    const errorData = response.data as unknown as { error?: string }
    throw new Error(errorData.error ?? `HTTP ${response.status}`)
  }

  const toolUse = response.data.content.find((block) => block.type === 'tool_use')
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error(`Claude did not call ${tool.name}`)
  }

  return parseFacets(toolUse.input)
}

export async function generateVibeSearch(vibePrompt: string): Promise<SearchSuggestion[]> {
  const userMessage = `Vibe: ${vibePrompt}`
  return callFacetsTool(userMessage, VIBE_SYSTEM_PROMPT, SELECT_VIBE_FACETS_TOOL)
}

export async function refineVibeSearch(
  previousFacets: SearchSuggestion[],
  shownResults: SearchResult[],
  picked: SearchSuggestion,
): Promise<SearchSuggestion[]> {
  const userMessage = buildRefineUserMessage(previousFacets, shownResults, picked)

  const refined = await callFacetsTool(userMessage, VIBE_REFINE_SYSTEM_PROMPT, SELECT_REFINED_VIBE_FACETS_TOOL)

  const previousKeys = new Set(previousFacets.map(facetKey))
  const refinedKeys = new Set(refined.map(facetKey))
  const added = refined.filter((facet) => !previousKeys.has(facetKey(facet))).length

  if (added < MIN_REPLACED || added > MAX_REPLACED) {
    throw new Error(`Claude replaced ${added} facets, expected between ${MIN_REPLACED} and ${MAX_REPLACED}`)
  }

  if (!refinedKeys.has(facetKey(picked))) {
    throw new Error('Claude did not include the picked suggestion in the refined facet set')
  }

  return refined
}
