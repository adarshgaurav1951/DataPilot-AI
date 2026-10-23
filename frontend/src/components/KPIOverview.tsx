import React from 'react'
import type { DatasetProfile } from '../types'
import { Rows, Columns, AlertTriangle, CopyCheck, Sparkles } from 'lucide-react'

interface KPIOverviewProps {
  profile: DatasetProfile
  onQuickCleanDuplicates?: () => void
  isCleaning?: boolean
}

export const KPIOverview: React.FC<KPIOverviewProps> = ({
  profile,
  onQuickCleanDuplicates,
  isCleaning,
}) => {
  const missingCount = profile.missing_values_report.reduce((acc, curr) => acc + curr.missing_count, 0)

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
      gap: '16px',
      marginBottom: '20px',
    }}>
      {/* Total Rows */}
      <div className="glass-panel" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Total Records
          </span>
          <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.12)', color: '#818cf8' }}>
            <Rows size={18} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
            {profile.rows.toLocaleString()}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>rows loaded</span>
        </div>
      </div>

      {/* Columns & Schema */}
      <div className="glass-panel" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Dataset Schema
          </span>
          <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8' }}>
            <Columns size={18} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
            {profile.columns}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>columns</span>
        </div>
        <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
          <span className="badge badge-numeric">{profile.numeric_columns.length} num</span>
          <span className="badge badge-categorical">{profile.categorical_columns.length} cat</span>
          {profile.datetime_columns.length > 0 && (
            <span className="badge badge-datetime">{profile.datetime_columns.length} date</span>
          )}
        </div>
      </div>

      {/* Missing Values */}
      <div className="glass-panel" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Missing Values
          </span>
          <div style={{
            padding: '6px',
            borderRadius: '8px',
            background: missingCount > 0 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
            color: missingCount > 0 ? '#fbbf24' : '#34d399',
          }}>
            <AlertTriangle size={18} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            fontFamily: 'var(--font-heading)',
            color: missingCount > 0 ? '#fbbf24' : '#34d399',
          }}>
            {missingCount}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {missingCount > 0 ? `across ${profile.missing_values_report.length} cols` : '100% complete'}
          </span>
        </div>
      </div>

      {/* Duplicate Rows */}
      <div className="glass-panel" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Duplicate Rows
          </span>
          <div style={{
            padding: '6px',
            borderRadius: '8px',
            background: profile.duplicate_rows > 0 ? 'rgba(244, 63, 94, 0.12)' : 'rgba(16, 185, 129, 0.12)',
            color: profile.duplicate_rows > 0 ? '#f43f5e' : '#34d399',
          }}>
            <CopyCheck size={18} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              fontFamily: 'var(--font-heading)',
              color: profile.duplicate_rows > 0 ? '#f43f5e' : '#34d399',
            }}>
              {profile.duplicate_rows}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              ({profile.duplicate_pct}%)
            </span>
          </div>

          {profile.duplicate_rows > 0 && onQuickCleanDuplicates && (
            <button
              onClick={onQuickCleanDuplicates}
              disabled={isCleaning}
              className="btn-primary"
              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
            >
              <Sparkles size={12} />
              <span>Clean</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
