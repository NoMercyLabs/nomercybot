import { View } from 'react-native'
import { usePipelineState } from './usePipelineState'
import { PipelineStepList } from './PipelineStepList'
import { PipelineToolbar } from './PipelineToolbar'
import type { PipelineBuilderProps } from './types'

export function PipelineBuilderNative({ pipeline, onSave }: PipelineBuilderProps) {
  const {
    nodes,
    selectedNodeId,
    isDirty,
    addNode,
    updateNode,
    removeNode,
    selectNode,
    reorderNodes,
  } = usePipelineState(pipeline?.graph.nodes ?? [])

  return (
    <View className="flex-1">
      <PipelineToolbar
        isDirty={isDirty}
        onAddNode={addNode}
        onSave={() => {
          if (pipeline) {
            onSave?.({ ...pipeline, graph: { ...pipeline.graph, nodes } })
          }
        }}
      />
      <PipelineStepList
        nodes={nodes}
        selectedNodeId={selectedNodeId}
        onSelect={selectNode}
        onRemove={removeNode}
        onReorder={reorderNodes}
      />
    </View>
  )
}
