import React, { useState } from 'react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { ChartSpec } from '../types'
import { BarChart3, LineChart as LineIcon, PieChart as PieIcon } from 'lucide-react'

interface InteractiveChartProps {
  spec: ChartSpec
}

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6']

export const InteractiveChart: React.FC<InteractiveChartProps> = ({ spec }) => {
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart')

  const { chart_type, title, x_axis_key, y_axis_key, data, series_name } = spec

  if (!data || data.length === 0) {
    return null
  }

  return (
    <div className="glass-panel" style={{ padding: '20px', marginTop: '16px', background: 'rgba(12, 17, 29, 0.9)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {chart_type === 'bar' && <BarChart3 size={18} color="#6366f1" />}
          {chart_type === 'line' && <LineIcon size={18} color="#06b6d4" />}
          {chart_type === 'pie' && <PieIcon size={18} color="#10b981" />}
          <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>{title}</h4>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setViewMode('chart')}
            style={{
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem',
              border: 'none',
              background: viewMode === 'chart' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
              color: viewMode === 'chart' ? '#818cf8' : 'var(--text-muted)',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Chart View
          </button>
          <button
            onClick={() => setViewMode('table')}
            style={{
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem',
              border: 'none',
              background: viewMode === 'table' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
              color: viewMode === 'table' ? '#818cf8' : 'var(--text-muted)',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Data Table
          </button>
        </div>
      </div>

      {viewMode === 'table' ? (
        <div style={{ overflowX: 'auto', maxHeight: '260px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>{x_axis_key.replace('_', ' ').toUpperCase()}</th>
                <th style={{ padding: '8px 12px', textAlign: 'right' }}>{(series_name || y_axis_key).replace('_', ' ').toUpperCase()}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
                  <td style={{ padding: '8px 12px', color: 'var(--text-primary)' }}>{String(item[x_axis_key])}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', color: '#818cf8', fontWeight: 600 }}>
                    {typeof item[y_axis_key] === 'number' ? item[y_axis_key].toLocaleString() : String(item[y_axis_key])}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            {chart_type === 'pie' ? (
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey={y_axis_key}
                  nameKey={x_axis_key}
                >
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#0d121c',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '0.78rem', paddingTop: '10px' }} />
              </PieChart>
            ) : chart_type === 'line' ? (
              <LineChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis dataKey={x_axis_key} stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: '#0d121c',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey={y_axis_key}
                  stroke="#06b6d4"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#06b6d4' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            ) : (
              <BarChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis dataKey={x_axis_key} stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: '#0d121c',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                  }}
                />
                <Bar
                  dataKey={y_axis_key}
                  fill="#6366f1"
                  radius={[6, 6, 0, 0]}
                >
                  {data.map((_, index) => (
                    <Cell key={`bar-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
