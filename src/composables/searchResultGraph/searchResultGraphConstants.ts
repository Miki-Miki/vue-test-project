export const NODE_BASE_RADIUS = 80

// initial size for a freshly spawned result node, before its real box is measured and
// reconciled via handleNodeResize (ResultsNode's height grows with its tag count)
export const NODE_WIDTH = 150
export const NODE_HEIGHT = 120

// must match the rendered pill size in SuggestionNode.scss
export const SUGGESTION_NODE_RADIUS = 28
export const SUGGESTION_NODE_WIDTH = 90
export const SUGGESTION_NODE_HEIGHT = 40
export const SUGGESTION_STACK_OFFSET_Y = 50

// where a freshly spawned result node is seeded relative to the previous newest node
export const NODE_SPAWN_OFFSET_X = 220
export const NODE_SPAWN_JITTER_Y = 60
