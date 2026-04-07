import { useState, useCallback } from 'react'
import type { PipelineNode } from '@/types/pipeline'
import type { PipelineBuilderState } from './types'

export function usePipelineState(initialNodes: PipelineNode[] = []) {
  const [state, setState] = useState<PipelineBuilderState>({
    nodes: initialNodes,
    selectedNodeId: null,
    isDirty: false,
  })

  const addNode = useCallback((node: PipelineNode) => {
    setState((s) => ({ ...s, nodes: [...s.nodes, node], isDirty: true }))
  }, [])

  const updateNode = useCallback((id: string, updates: Partial<PipelineNode>) => {
    setState((s) => ({
      ...s,
      nodes: s.nodes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
      isDirty: true,
    }))
  }, [])

  const removeNode = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      nodes: s.nodes.filter((n) => n.id !== id),
      selectedNodeId: s.selectedNodeId === id ? null : s.selectedNodeId,
      isDirty: true,
    }))
  }, [])

  const selectNode = useCallback((id: string | null) => {
    setState((s) => ({ ...s, selectedNodeId: id }))
  }, [])

  const reorderNodes = useCallback((from: number, to: number) => {
    setState((s) => {
      const nodes = [...s.nodes]
      const [moved] = nodes.splice(from, 1)
      nodes.splice(to, 0, moved)
      return { ...s, nodes, isDirty: true }
    })
  }, [])

  return {
    ...state,
    addNode,
    updateNode,
    removeNode,
    selectNode,
    reorderNodes,
  }
}
