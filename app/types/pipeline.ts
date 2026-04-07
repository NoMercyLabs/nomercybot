export type NodeCategory = 'trigger' | 'condition' | 'action'

export interface ConfigField {
  key: string
  label: string
  type: 'text' | 'number' | 'select' | 'toggle' | 'variable'
  options?: { label: string; value: string }[]
  placeholder?: string
  required?: boolean
}

export interface NodeType {
  id: string
  category: NodeCategory
  label: string
  description: string
  icon: string
  defaultConfig: Record<string, unknown>
  configSchema: ConfigField[]
}

export interface PipelineNode {
  id: string
  type: NodeCategory
  nodeType: string
  label: string
  config: Record<string, unknown>
  position: { x: number; y: number }
}

export interface PipelineConnection {
  id: string
  sourceId: string
  targetId: string
  sourcePort: string
  targetPort: string
}

export interface PipelineGraph {
  nodes: PipelineNode[]
  connections: PipelineConnection[]
}

export interface Pipeline {
  id: number
  channelId: string
  name: string
  description?: string
  isEnabled: boolean
  graph: PipelineGraph
  triggerCount: number
  lastTriggeredAt?: string
  createdAt: string
  updatedAt: string
}

export interface PipelineListItem {
  id: number
  name: string
  description?: string
  isEnabled: boolean
  triggerCount: number
  lastTriggeredAt?: string
  updatedAt: string
}

export interface PipelineStep {
  action: string
  params: Record<string, unknown>
  condition?: {
    type: string
    [key: string]: unknown
  }
}

export interface PipelineTestResult {
  nodeId: string
  status: 'success' | 'skipped' | 'error'
  output?: string
  duration: number
}
