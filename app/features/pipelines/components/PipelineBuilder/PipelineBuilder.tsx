import { Platform } from 'react-native'
import type { PipelineBuilderProps } from './types'

// Platform resolution handled by Metro bundler
// PipelineBuilder.web.tsx → web
// PipelineBuilder.native.tsx → iOS/Android

// This file provides the shared export name
export { PipelineBuilderWeb as PipelineBuilder } from './PipelineBuilder.web'
