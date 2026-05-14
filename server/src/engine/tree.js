import { v4 as uuidv4 } from 'uuid'
import { TOPICS } from '../constants.js'

// ─── 3.3 createTree ───────────────────────────────────────────────────────────

export function createTree(sessionId, subject) {
  return {
    session_id: sessionId,
    subject,
    nodes:      {},
    root_id:    null,
    context: {
      current_focus:     subject,
      active_node_id:    null,
      observations:      [],
      covered_topics:    [],
      pending_topics:    [...(TOPICS[subject] ?? [subject])],
      contradictions:    [],
      candidate_summary: '',
      started_at:        Date.now(),
    },
  }
}

// ─── 3.4 addNode ─────────────────────────────────────────────────────────────

export function addNode(tree, parentId, nodeData) {
  const id   = uuidv4()
  const node = { ...nodeData, id, parent_id: parentId ?? null, children: [] }

  tree.nodes[id] = node

  if (parentId === null) {
    tree.root_id = id
  } else {
    const parent = tree.nodes[parentId]
    if (!parent) throw new Error(`Parent node ${parentId} not found`)
    parent.children.push(id)
  }

  return id
}

// ─── 3.5 updateNodeStatus ─────────────────────────────────────────────────────

export function updateNodeStatus(tree, nodeId, status) {
  const node = tree.nodes[nodeId]
  if (!node) throw new Error(`Node ${nodeId} not found`)
  node.status = status

  if (status === 'active') {
    tree.context.active_node_id = nodeId
  } else if (tree.context.active_node_id === nodeId) {
    tree.context.active_node_id = null
  }
}

// ─── 3.6 canCollapse ─────────────────────────────────────────────────────────
// True only when this node AND every descendant is explored or skipped (never pending/active)

export function canCollapse(tree, nodeId) {
  const node = tree.nodes[nodeId]
  if (!node) return false
  if (node.status === 'pending' || node.status === 'active') return false

  return node.children.every(childId => canCollapse(tree, childId))
}

// ─── 3.7 prepareTreeForLLM ───────────────────────────────────────────────────
// Returns a compact representation:
//   • fully-explored subtrees → collapsed to { id, type, summary/question, status: 'explored' }
//   • active / pending nodes  → sent in full

export function prepareTreeForLLM(tree) {
  if (tree.root_id === null) return { nodes: [], context: tree.context }

  const nodes = []
  _collectForLLM(tree, tree.root_id, nodes)
  return { nodes, context: tree.context }
}

function _collectForLLM(tree, nodeId, out) {
  const node = tree.nodes[nodeId]
  if (!node) return

  if (canCollapse(tree, nodeId)) {
    // collapsed stub
    out.push(_collapseStub(node))
    return
  }

  out.push({ ...node })
  for (const childId of node.children) {
    _collectForLLM(tree, childId, out)
  }
}

function _collapseStub(node) {
  const stub = {
    id:     node.id,
    type:   node.type,
    status: node.status,
  }
  if (node.type === 'interviewer_question') {
    stub.summary  = node.summary ?? node.question
    stub.topic    = node.topic
    stub.depth    = node.depth
    stub.children = node.children
  } else {
    stub.children = node.children
  }
  return stub
}

// ─── 3.8 getPendingNodes ─────────────────────────────────────────────────────

export function getPendingNodes(tree) {
  return Object.values(tree.nodes).filter(n => n.status === 'pending')
}

// ─── helpers ──────────────────────────────────────────────────────────────────

export function getNode(tree, nodeId) {
  return tree.nodes[nodeId] ?? null
}

export function getActiveNode(tree) {
  return tree.context.active_node_id
    ? tree.nodes[tree.context.active_node_id] ?? null
    : null
}
