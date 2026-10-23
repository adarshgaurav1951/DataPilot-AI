export interface ColumnMeta {
  name: string
  dtype: string
  semantic_type: 'numeric' | 'categorical' | 'datetime' | 'boolean' | 'text'
  null_count: number
  null_pct: number
  unique_count: number
  sample_values: (string | number | null)[]
}

export interface NumericStat {
  count: number
  mean: number | null
  std: number | null
  min: number | null
  q25: number | null
  median: number | null
  q75: number | null
  max: number | null
}

export interface CategoricalStatItem {
  value: string
  count: number
}

export interface MissingValueItem {
  column: string
  missing_count: number
  missing_pct: number
}

export interface DatasetProfile {
  rows: number
  columns: number
  memory_mb: number
  duplicate_rows: number
  duplicate_pct: number
  columns_meta: ColumnMeta[]
  numeric_columns: string[]
  categorical_columns: string[]
  datetime_columns: string[]
  numeric_stats: Record<string, NumericStat>
  categorical_stats: Record<string, CategoricalStatItem[]>
  correlation_matrix: Record<string, Record<string, number>>
  missing_values_report: MissingValueItem[]
  preview: Record<string, any>[]
  available_sheets?: string[]
  selected_sheet?: string
}

export interface ChartSpec {
  chart_type: 'bar' | 'line' | 'pie' | 'area' | 'scatter'
  title: string
  x_axis_key: string
  y_axis_key: string
  series_name?: string
  data: Record<string, any>[]
}

export interface ToolCallItem {
  tool: string
  args: Record<string, any>
}

export interface ToolResultItem {
  tool: string
  status: 'success' | 'error'
  output?: any
  error?: string
}

export interface RAGSource {
  doc_id: string
  filename: string
  page_number: number
  snippet: string
  score: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  tool_calls?: ToolCallItem[]
  tool_results?: ToolResultItem[]
  chart_spec?: ChartSpec | null
  rag_sources?: RAGSource[]
  created_at?: string
}
