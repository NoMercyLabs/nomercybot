import type { PipelineGraph, PipelineStep } from '@/types/pipeline'

/**
 * Converts the frontend's visual graph format to the backend's flat steps array.
 * Triggers are stripped (they're handled by EventResponse/Command triggers).
 * Conditions are attached to the NEXT action step.
 */
export function graphToSteps(graph: PipelineGraph): PipelineStep[] {
  const steps: PipelineStep[] = []
  const nodes = graph.nodes.filter((n) => n.type !== 'trigger')

  let pendingCondition: PipelineStep['condition'] | undefined

  for (const node of nodes) {
    if (node.type === 'condition') {
      pendingCondition = {
        type: node.nodeType,
        ...node.config,
      }
    } else if (node.type === 'action') {
      const step: PipelineStep = {
        action: node.nodeType,
        params: node.config as Record<string, unknown>,
      }
      if (pendingCondition) {
        step.condition = pendingCondition
        pendingCondition = undefined
      }
      steps.push(step)
    }
  }

  return steps
}
