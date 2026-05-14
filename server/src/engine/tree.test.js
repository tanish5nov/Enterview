// Phase 3.9 — tree engine unit tests
// Run: node src/engine/tree.test.js

import {
  createTree,
  addNode,
  updateNodeStatus,
  canCollapse,
  prepareTreeForLLM,
  getPendingNodes,
  getActiveNode,
} from './tree.js'

let passed = 0
let failed = 0

function assert(label, condition) {
  if (condition) {
    console.log(`PASS — ${label}`)
    passed++
  } else {
    console.error(`FAIL — ${label}`)
    failed++
  }
}

// ─── createTree ───────────────────────────────────────────────────────────────

const tree = createTree('sess-1', 'DSA')
assert('createTree: session_id set',            tree.session_id === 'sess-1')
assert('createTree: subject set',               tree.subject === 'DSA')
assert('createTree: nodes empty',               Object.keys(tree.nodes).length === 0)
assert('createTree: root_id null',              tree.root_id === null)
assert('createTree: context has pending topics', tree.context.pending_topics.length > 0)

// ─── addNode ─────────────────────────────────────────────────────────────────

const rootId = addNode(tree, null, {
  type:     'interviewer_question',
  status:   'pending',
  question: 'What is a linked list?',
  topic:    'Linked Lists',
  depth:    0,
  summary:  null,
})
assert('addNode: root_id set',                  tree.root_id === rootId)
assert('addNode: root node present',            !!tree.nodes[rootId])
assert('addNode: root parent_id null',          tree.nodes[rootId].parent_id === null)
assert('addNode: root children empty',          tree.nodes[rootId].children.length === 0)

const childId = addNode(tree, rootId, {
  type:     'interviewee_response',
  status:   'pending',
  answer:   'A linked list is a sequence of nodes...',
  parent_id: null, // addNode overwrites this
})
assert('addNode: child parent_id correct',      tree.nodes[childId].parent_id === rootId)
assert('addNode: root.children includes child', tree.nodes[rootId].children.includes(childId))

const grandchildId = addNode(tree, childId, {
  type:    'interviewer_question',
  status:  'pending',
  question: 'What is the time complexity of search in a singly linked list?',
  topic:   'Linked Lists',
  depth:   1,
  summary: null,
})
assert('addNode: grandchild depth preserved',   tree.nodes[grandchildId].depth === 1)

// ─── updateNodeStatus ─────────────────────────────────────────────────────────

updateNodeStatus(tree, rootId, 'active')
assert('updateNodeStatus: status updated',       tree.nodes[rootId].status === 'active')
assert('updateNodeStatus: active_node_id set',   tree.context.active_node_id === rootId)

updateNodeStatus(tree, rootId, 'explored')
assert('updateNodeStatus: explored clears active', tree.context.active_node_id === null)

// ─── canCollapse ─────────────────────────────────────────────────────────────

// root=explored, child=pending, grandchild=pending → cannot collapse
assert('canCollapse: pending child blocks',      !canCollapse(tree, rootId))

updateNodeStatus(tree, childId, 'explored')
// root=explored, child=explored, grandchild=pending → cannot collapse
assert('canCollapse: pending grandchild blocks', !canCollapse(tree, rootId))

updateNodeStatus(tree, grandchildId, 'explored')
// all explored → can collapse
assert('canCollapse: all explored → true',       canCollapse(tree, rootId))

// leaf node with no children and explored → can collapse
assert('canCollapse: leaf explored',             canCollapse(tree, grandchildId))

// reset grandchild to pending for further tests
updateNodeStatus(tree, grandchildId, 'pending')

// ─── getPendingNodes ─────────────────────────────────────────────────────────

// root=explored, child=explored, grandchild=pending
const pending = getPendingNodes(tree)
assert('getPendingNodes: returns only pending',  pending.every(n => n.status === 'pending'))
assert('getPendingNodes: count correct',         pending.length === 1)
assert('getPendingNodes: grandchild in list',    pending.some(n => n.id === grandchildId))

// ─── prepareTreeForLLM ───────────────────────────────────────────────────────

const payload = prepareTreeForLLM(tree)
assert('prepareTreeForLLM: returns nodes array', Array.isArray(payload.nodes))
assert('prepareTreeForLLM: context present',     !!payload.context)

// root+child are fully explored with a pending grandchild — root cannot collapse
// so all 3 nodes should appear in full
assert('prepareTreeForLLM: non-collapsible tree sends all nodes', payload.nodes.length === 3)

// now mark grandchild explored → whole subtree collapsible → collapsed to 1 stub
updateNodeStatus(tree, grandchildId, 'explored')
const payloadCollapsed = prepareTreeForLLM(tree)
assert('prepareTreeForLLM: fully explored tree collapses to 1 stub', payloadCollapsed.nodes.length === 1)
assert('prepareTreeForLLM: stub has summary field', payloadCollapsed.nodes[0].summary !== undefined)

// ─── getActiveNode ────────────────────────────────────────────────────────────

const tree2  = createTree('sess-2', 'OS')
const nId    = addNode(tree2, null, {
  type: 'interviewer_question', status: 'pending',
  question: 'What is a process?', topic: 'Processes & Threads', depth: 0, summary: null,
})
assert('getActiveNode: null when none active',   getActiveNode(tree2) === null)
updateNodeStatus(tree2, nId, 'active')
assert('getActiveNode: returns active node',     getActiveNode(tree2)?.id === nId)

// ─── summary ─────────────────────────────────────────────────────────────────

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
