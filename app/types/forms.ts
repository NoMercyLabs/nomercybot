import type { ZodTypeAny } from 'zod'

export type FieldType =
  | 'text'
  | 'number'
  | 'select'
  | 'toggle'
  | 'slider'
  | 'color'
  | 'code'
  | 'duration'
  | 'cron'
  | 'textarea'

export interface FieldOption {
  label: string
  value: string | number
}

export interface FieldDefinition {
  key: string
  label: string
  type: FieldType
  placeholder?: string
  description?: string
  required?: boolean
  defaultValue?: unknown
  options?: FieldOption[]
  min?: number
  max?: number
  step?: number
  language?: string
  validation?: ZodTypeAny
  showWhen?: (formData: Record<string, unknown>) => boolean
  colSpan?: 1 | 2 | 3 | 4
}

export interface FormSection {
  title: string
  description?: string
  columns?: 1 | 2 | 3 | 4
  fields: FieldDefinition[]
}

export interface FormSchema {
  sections: FormSection[]
}
