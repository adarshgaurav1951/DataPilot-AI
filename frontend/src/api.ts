import type { DatasetProfile } from './types'

const API_BASE = import.meta.env.VITE_API_URL || ''

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('datapilot_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function loadSampleDataset(fileType: 'csv' | 'xlsx' = 'csv'): Promise<{ dataset_id: string; filename: string; profile: DatasetProfile }> {
  const res = await fetch(`${API_BASE}/api/load-sample?file_type=${fileType}`, {
    method: 'POST',
    headers: { ...getAuthHeaders() },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to load sample data' }))
    throw new Error(err.detail || 'Failed to load sample dataset')
  }
  return res.json()
}

export async function uploadDataset(file: File, sheetName?: string): Promise<{ dataset_id: string; filename: string; profile: DatasetProfile }> {
  const formData = new FormData()
  formData.append('file', file)
  if (sheetName) {
    formData.append('sheet_name', sheetName)
  }

  const res = await fetch(`${API_BASE}/api/upload`, {
    method: 'POST',
    headers: { ...getAuthHeaders() },
    body: formData,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Upload failed' }))
    throw new Error(err.detail || 'Upload failed')
  }
  return res.json()
}

export async function switchSheet(
  datasetId: string,
  sheetName: string
): Promise<{ dataset_id: string; selected_sheet: string; available_sheets: string[]; profile: DatasetProfile }> {
  const res = await fetch(`${API_BASE}/api/datasets/${datasetId}/select-sheet`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ sheet_name: sheetName }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to switch sheet' }))
    throw new Error(err.detail || 'Failed to switch worksheet')
  }
  return res.json()
}


export async function cleanDataset(datasetId: string, operations: any[]): Promise<{ updated_profile: DatasetProfile; actions_performed: string[] }> {
  const res = await fetch(`${API_BASE}/api/datasets/${datasetId}/clean`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ operations }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Cleaning failed' }))
    throw new Error(err.detail || 'Cleaning failed')
  }
  return res.json()
}

export async function sendChatMessage(
  datasetId: string,
  message: string,
  conversationId?: string
): Promise<{
  conversation_id: string
  reply: string
  intent: string
  tool_calls: any[]
  tool_results: any[]
  chart_spec: any
  rag_sources: any[]
}> {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      dataset_id: datasetId,
      message,
      conversation_id: conversationId,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Chat request failed' }))
    throw new Error(err.detail || 'Agent failed to respond')
  }
  return res.json()
}

export async function fetchReport(datasetId: string): Promise<{ report: any; markdown: string }> {
  const res = await fetch(`${API_BASE}/api/datasets/${datasetId}/report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to generate report' }))
    throw new Error(err.detail || 'Failed to generate report')
  }
  return res.json()
}

export async function fetchUserProfile(): Promise<any> {
  const token = localStorage.getItem('datapilot_token')
  if (!token) return null

  const res = await fetch(`${API_BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    localStorage.removeItem('datapilot_token')
    return null
  }
  return res.json()
}
