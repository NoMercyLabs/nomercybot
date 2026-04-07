export interface Column<T = any> {
  key: string
  title: string
  render?: (value: any, row: T) => React.ReactNode
  sortable?: boolean
  width?: number | string
  className?: string
}

export interface DataTableProps<T = any> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (item: T) => string
  onRowPress?: (item: T) => void
  isLoading?: boolean
  emptyMessage?: string
  className?: string
}
