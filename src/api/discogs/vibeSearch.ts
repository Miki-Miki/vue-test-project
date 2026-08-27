import type { Tool } from '@anthropic-ai/sdk/resources/messages'
import { SearchMode } from '@/types/search'
import type { SearchResult, SearchSuggestion } from '@/types/search'
import { sendMessage } from '@/api/claude/messages'
import { formatTaxonomyWithVibes, taxonomyFor, toSearchMode, facetKey } from '@/api/discogs/taxonomyPrompt'

const MIN_FACETS = 2
const MAX_FACETS = 7
const MIN_REPLACED = 1
const MAX_REPLACED = 4

const FACETS_SCHEMA: Tool.InputSchema = {
  type: 'object',
  properties: {
    facets: {
      type: 'array',
      minItems: MIN_FACETS,
      maxItems: MAX_FACETS,
      items: {
        type: 'object',
        properties: {
          mode: { type: 'string', enum: ['genre', 'style'] },
          value: { type: 'string' },
        },
        required: ['mode', 'value'],
      },
    },
  },
  required: ['facets'],
}

const SELECT_VIBE_FACETS_TOOL: Tool = {
  name: 'select_vibe_facets',
  description: 'Pick 2-7 genres/styles that together capture a described listening vibe.',
  input_schema: FACETS_SCHEMA,
}

const SELECT_REFINED_VIBE_FACETS_TOOL: Tool = {
  name: 'select_refined_vibe_facets',
  description: 'Pick a new set of 2-7 genres/styles that lightly refines a previous vibe search.',
  input_schema: FACETS_SCHEMA,
}

const VIBE_SYSTEM_PROMPT = `You are a music-discovery guide inside a Discogs genre/style explorer. The
user describes an open-ended listening "vibe" in free text (mood, setting,
energy — not a specific genre name). Your job is to translate that vibe into
a concrete set of 2-7 genres/styles whose combination captures it.

Rules:
1. Every facet's \`value\` must be an exact, case-sensitive match to one entry
   in the provided genre or style list — never invent, abbreviate, or reword one.
2. Prefer styles over genres — there are far more styles than genres, and
   styles capture a specific vibe far more precisely than a broad genre does.
   Only include a genre when no combination of styles captures part of the vibe.
3. Pick between 2 and 7 facets. Use enough to triangulate the vibe from a few
   angles, but keep every facet clearly relevant — don't pad the set.
4. No duplicate facets.
5. Call \`select_vibe_facets\` with your chosen facets. Do not respond with any text.`

const VIBE_REFINE_SYSTEM_PROMPT = `You are a music-discovery guide inside a Discogs genre/style explorer. The
user started with a vibe search (a set of genres/styles), was shown the 10
most popular results for it, and just picked one suggested next genre/style
to lean into. Your job is to produce a refined facet set for the next search.

Weighting — in order of importance:
1. Strongly anchor on the previous facet set — it's the user's original vibe
   and should still dominate the result.
2. Strongly fold in the picked suggestion — it MUST appear in the output.
3. Lightly let the genre/style tags seen in the last shown results nudge which
   of the previous facets get replaced and what they get replaced with.

Rules:
1. Every facet's \`value\` must be an exact, case-sensitive match to one entry
   in the provided genre or style list — never invent, abbreviate, or reword one.
2. Prefer styles over genres for the same reason as before — more precise,
   more numerous, less repetitive.
3. Keep the majority of the previous facet set unchanged: replace only 1 to 4
   of the previous facets (add/swap), keeping the rest exactly as they were.
4. The picked suggestion must be present in the returned facet set.
5. Return between 2 and 7 facets total, no duplicates.
6. Call \`select_refined_vibe_facets\` with your chosen facets. Do not respond with any text.`

interface RawFacet {
  mode: string
  value: string
}

interface FacetsToolInput {
  facets: RawFacet[]
}

function buildTaxonomyBlock(): string {
  return [
    `Genres (name: vibe):\n${formatTaxonomyWithVibes(SearchMode.Genre)}`,
    `Styles (name: vibe):\n${formatTaxonomyWithVibes(SearchMode.Style)}`,
  ].join('\n\n')
}

function parseFacets(input: unknown): SearchSuggestion[] {
  const raw = input as Partial<FacetsToolInput> | undefined
  if (!raw || !Array.isArray(raw.facets) || raw.facets.length < MIN_FACETS || raw.facets.length > MAX_FACETS) {
    throw new Error(`Claude did not return between ${MIN_FACETS} and ${MAX_FACETS} facets`)
  }

  const seen = new Set<string>()
  return raw.facets.map((facet) => {
    const mode = toSearchMode(facet.mode)
    if (!mode || !taxonomyFor(mode).includes(facet.value)) {
      throw new Error(`Claude returned an invalid facet: ${JSON.stringify(facet)}`)
    }
    const parsed: SearchSuggestion = { mode, value: facet.value }
    const key = facetKey(parsed)
    if (seen.has(key)) {
      throw new Error(`Claude returned a duplicate facet: ${JSON.stringify(facet)}`)
    }
    seen.add(key)
    return parsed
  })
}

async function callFacetsTool(
  userMessage: string,
  system: string,
  tool: Tool,
): Promise<SearchSuggestion[]> {
  const response = await sendMessage([{ role: 'user', content: userMessage }], {
    system,
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
  const userMessage = [buildTaxonomyBlock(), `Vibe: ${vibePrompt}`].join('\n\n')
  return callFacetsTool(userMessage, VIBE_SYSTEM_PROMPT, SELECT_VIBE_FACETS_TOOL)
}

export async function refineVibeSearch(
  previousFacets: SearchSuggestion[],
  shownResults: SearchResult[],
  picked: SearchSuggestion,
): Promise<SearchSuggestion[]> {
  const shownTags = [...new Set(shownResults.flatMap((r) => [...(r.genre ?? []), ...(r.style ?? [])]))]

  const userMessage = [
    buildTaxonomyBlock(),
    `Previous facets (strong anchor): ${JSON.stringify(previousFacets)}`,
    `Genre/style tags seen in the last shown results (light signal): ${JSON.stringify(shownTags)}`,
    `Picked suggestion (strong signal, must appear in the output): ${JSON.stringify(picked)}`,
  ].join('\n\n')

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
