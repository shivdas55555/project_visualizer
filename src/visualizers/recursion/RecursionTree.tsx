import { useMemo } from 'react';
import type { ExecutionTraceStep } from '../../engine/types';

interface TreeNode {
  id: string;
  label: string;
  value?: number | string;
  kind: 'open' | 'base-case' | 'cache-hit' | 'computed';
  children: TreeNode[];
}

/**
 * Reconstructs the call tree from a flat recursion-style trace using a call
 * stack: every `recursion-call` pushes a node (as a child of whatever call
 * is currently on top of the stack), and the matching base-case /
 * cache-hit / table-update / recursion-return for that same state id pops it.
 * This works for any recursive algorithm's trace, not just Fibonacci.
 */
function buildTree(stepsSoFar: ExecutionTraceStep[]): { roots: TreeNode[]; activeId: string | null } {
  const roots: TreeNode[] = [];
  const stack: TreeNode[] = [];
  const nodesById = new Map<string, TreeNode>();
  let activeId: string | null = null;

  for (const step of stepsSoFar) {
    if (!step.state) continue;
    const id = step.state.id;
    activeId = id;

    if (step.type === 'recursion-call') {
      const node: TreeNode = { id, label: id.replace(/_/g, '('), value: undefined, kind: 'open', children: [] };
      nodesById.set(id, node);
      if (stack.length > 0) stack[stack.length - 1].children.push(node);
      else roots.push(node);
      stack.push(node);
    } else {
      const node = nodesById.get(id);
      if (node) {
        node.value = step.state.value;
        node.kind = step.type === 'base-case' ? 'base-case' : step.type === 'cache-hit' ? 'cache-hit' : 'computed';
      }
      // Pop back to (and including) this id, in case of any mismatch.
      while (stack.length > 0 && stack[stack.length - 1].id !== id) stack.pop();
      if (stack.length > 0) stack.pop();
    }
  }

  return { roots, activeId };
}

const kindStyle: Record<TreeNode['kind'], string> = {
  open: 'border-sky-400 text-sky-200 bg-sky-950/40',
  'base-case': 'border-emerald-400 text-emerald-200 bg-emerald-950/40',
  'cache-hit': 'border-amber-400 text-amber-200 bg-amber-950/40',
  computed: 'border-emerald-500 text-emerald-100 bg-emerald-950/30',
};

function Node({ node, activeId }: { node: TreeNode; activeId: string | null }) {
  const isActive = node.id === activeId;
  return (
    <div className="flex flex-col items-start">
      <div
        className={`rounded-md border px-2 py-1 font-mono text-xs ${kindStyle[node.kind]} ${
          isActive ? 'ring-2 ring-sky-300' : ''
        }`}
      >
        {node.label}
        {node.value !== undefined ? `) = ${node.value}` : ')'}
        {node.kind === 'cache-hit' && <span className="ml-1 text-amber-300">&larr; CACHE HIT</span>}
      </div>
      {node.children.length > 0 && (
        <div className="ml-4 mt-1.5 flex flex-col gap-1.5 border-l border-slate-700 pl-4">
          {node.children.map((child) => (
            <Node key={child.id + child.kind} node={child} activeId={activeId} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function RecursionTree({ stepsSoFar }: { stepsSoFar: ExecutionTraceStep[] }) {
  const { roots, activeId } = useMemo(() => buildTree(stepsSoFar), [stepsSoFar]);

  if (roots.length === 0) {
    return <p className="text-sm text-slate-500">Press play to start building the call tree.</p>;
  }

  return (
    <div className="overflow-auto">
      {roots.map((root) => (
        <Node key={root.id} node={root} activeId={activeId} />
      ))}
    </div>
  );
}
