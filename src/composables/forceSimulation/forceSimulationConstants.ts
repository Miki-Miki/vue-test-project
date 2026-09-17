// 0 = no separation (circles overlap freely); 1 = fully rigid bounds (nodes never overlap, but can jitter/overshoot at high velocity)
export const FORCE_COLLIDE_STRENGTH = 0.6

// 0 = no pull (nodes drift independently); ~1-3 = gentle drift together; ~10+ = snaps together fast, can overshoot past collision bounds before settling
export const FORCE_ATTRACTION_STRENGTH = 10

// extra margin (px) kept between a node's rendered box and the canvas edge, on top of its own width/height — independent of `radius`, which is only used for node-to-node collision; 0 = the box's edge can touch the wall exactly
export const FORCE_BOUNDARY_PADDING = 1

// 0 = no friction (nodes coast forever, never settle); ~0.4 = d3's default, floaty/bouncy; 1 = max friction, nodes stop almost instantly, feels sluggish
export const FORCE_VELOCITY_DECAY = 0.8

// 0 = radius changes barely reheat the simulation (sluggish/no reaction to hover); ~0.3-0.6 = noticeable but brief reshuffle; 1 = full reheat, most energetic reaction
export const FORCE_RESTART_ALPHA = 1

// 0 = simulation goes cold while dragging (neighbours barely react until drag ends); ~0.3 = stays warm enough to push neighbours live; 1 = maximally energetic throughout the drag
export const FORCE_DRAG_ALPHA_TARGET = 0.3

// px distance forceLink tries to hold between a suggestion node and its parent result node; smaller = suggestions hug tighter
export const FORCE_LINK_DISTANCE = 140

// 0 = link has no pull (suggestion drifts free, only general attraction applies); 1 = rigid link, snaps to exact distance
export const FORCE_LINK_STRENGTH = 0.5
