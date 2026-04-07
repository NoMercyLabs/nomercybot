// Metro resolves platform-specific extensions (.web.tsx / .native.tsx) automatically.
// TypeScript needs a base export to resolve the module during type checking.
// At runtime, Metro will pick DataTable.web.tsx or DataTable.native.tsx.
export { DataTable } from './DataTable.web'
export type { DataTableProps, Column } from './types'
