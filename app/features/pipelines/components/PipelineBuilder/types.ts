import type { PipelineNode } from '@/types/pipeline'

export interface PipelineBuilderState {
  nodes: PipelineNode[]
  selectedNodeId: string | null
  isDirty: boolean
}

export interface PipelineBuilderProps {
  pipeline?: import('@/types/pipeline').Pipeline
  onSave?: (pipeline: import('@/types/pipeline').Pipeline) => void | Promise<void>
}
