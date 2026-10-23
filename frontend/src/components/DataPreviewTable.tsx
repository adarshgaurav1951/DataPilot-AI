import React, { useState } from 'react'
import type { DatasetProfile } from '../types'
import { Table, Download, Search } from 'lucide-react'

interface DataPreviewTableProps {
  profile: DatasetProfile
  filename: string
}

export const DataPreviewTable: React.FC<DataPreviewTableProps> = ({ profile, filename }) => {
  const [searchTerm, setSearchTerm] = useState('')

  const columns = profile.columns_meta
  const rows = profile.preview

  // Filter columns by search
  const filteredColumns = columns.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const exportCSV = () => {
    if (!rows.length) return
    const colNames = columns.map(c => c.name)
    const csvContent = [
      colNames.join(','),
      ...rows.map(row =>
        colNames.map(col => {
          const val = row[col]
          if (val === null || val === undefined) return ''
          if (typeof val === 'string' && val.includes(',')) return `"${val}"`
          return String(val)
        }).join(',')
      ),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `preview_${filename || 'dataset'}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.12)', color: '#818cf8' }}>
            <Table size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Dataset Preview</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              First {rows.length} rows previewed with schema type inference
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--bg-input)',
            padding: '6px 12px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
          }}>
            <Search size={14} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Filter columns..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '0.82rem',
                outline: 'none',
                width: '130px',
              }}
            />
          </div>

          <button onClick={exportCSV} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ background: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid var(--border-subtle)' }}>
              {filteredColumns.map(col => (
                <th key={col.name} style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{col.name}</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <span className={`badge badge-${col.semantic_type}`}>
                        {col.semantic_type}
                      </span>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rIdx) => (
              <tr
                key={rIdx}
                style={{
                  borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                  background: rIdx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)',
                  transition: 'background 0.15s ease',
                }}
              >
                {filteredColumns.map(col => {
                  const val = row[col.name]
                  const isNull = val === null || val === undefined
                  return (
                    <td key={col.name} style={{ padding: '10px 16px', whiteSpace: 'nowrap', color: isNull ? '#f43f5e' : 'var(--text-secondary)' }}>
                      {isNull ? (
                        <span style={{ fontStyle: 'italic', opacity: 0.7, fontSize: '0.75rem' }}>null</span>
                      ) : (
                        typeof val === 'number' ? (
                          Number.isInteger(val) ? val.toLocaleString() : val.toFixed(2)
                        ) : String(val)
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
