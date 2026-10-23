import React, { useState } from 'react'
import type { DatasetProfile } from '../types'
import { Sparkles, Trash2, Wand2, RefreshCw, CheckCircle2 } from 'lucide-react'

interface CleaningStudioProps {
  profile: DatasetProfile
  onClean: (operations: any[]) => Promise<void>
  isCleaning: boolean
}

export const CleaningStudio: React.FC<CleaningStudioProps> = ({
  profile,
  onClean,
  isCleaning,
}) => {
  const [selectedCol, setSelectedCol] = useState<string>(
    profile.missing_values_report[0]?.column || profile.numeric_columns[0] || ''
  )
  const [strategy, setStrategy] = useState<'mean' | 'median' | 'mode' | 'constant'>('mean')
  const [constantVal, setConstantVal] = useState<string>('0')
  const [statusMsg, setStatusMsg] = useState<string | null>(null)

  const handleDropDuplicates = async () => {
    setStatusMsg(null)
    await onClean([{ op: 'drop_duplicates' }])
    setStatusMsg('Duplicate rows removed successfully!')
  }

  const handleImpute = async () => {
    if (!selectedCol) return
    setStatusMsg(null)
    const val = strategy === 'constant' ? constantVal : undefined
    await onClean([
      {
        op: 'impute',
        column: selectedCol,
        strategy,
        fill_value: val,
      },
    ])
    setStatusMsg(`Imputed missing values in '${selectedCol}' using ${strategy}!`)
  }

  return (
    <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.12)', color: '#34d399' }}>
          <Sparkles size={20} />
        </div>
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Data Cleaning Studio</h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Safe, deterministic data transformations without data loss risk
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {/* Action 1: Deduplication */}
        <div style={{
          padding: '16px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-subtle)',
        }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Trash2 size={16} color="#f43f5e" />
            <span>Remove Duplicates</span>
          </h4>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
            Current duplicates: <strong style={{ color: profile.duplicate_rows > 0 ? '#f43f5e' : '#34d399' }}>{profile.duplicate_rows}</strong> rows
          </p>
          <button
            onClick={handleDropDuplicates}
            disabled={isCleaning || profile.duplicate_rows === 0}
            className="btn-secondary"
            style={{
              width: '100%',
              fontSize: '0.82rem',
              padding: '8px 12px',
              opacity: profile.duplicate_rows === 0 ? 0.5 : 1,
            }}
          >
            <RefreshCw size={14} className={isCleaning ? 'animate-spin' : ''} />
            <span>Drop All Duplicate Rows</span>
          </button>
        </div>

        {/* Action 2: Imputation */}
        <div style={{
          padding: '16px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-subtle)',
        }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Wand2 size={16} color="#38bdf8" />
            <span>Impute Missing Values</span>
          </h4>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
            <select
              value={selectedCol}
              onChange={e => setSelectedCol(e.target.value)}
              style={{
                flex: 1,
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.78rem',
              }}
            >
              {profile.columns_meta.map(c => (
                <option key={c.name} value={c.name}>
                  {c.name} ({c.null_count} nulls)
                </option>
              ))}
            </select>

            <select
              value={strategy}
              onChange={e => setStrategy(e.target.value as any)}
              style={{
                width: '95px',
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.78rem',
              }}
            >
              <option value="mean">Mean</option>
              <option value="median">Median</option>
              <option value="mode">Mode</option>
              <option value="constant">Custom</option>
            </select>

            {strategy === 'constant' && (
              <input
                type="text"
                placeholder="Val"
                value={constantVal}
                onChange={e => setConstantVal(e.target.value)}
                style={{
                  width: '60px',
                  padding: '6px 8px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.78rem',
                }}
              />
            )}
          </div>

          <button
            onClick={handleImpute}
            disabled={isCleaning}
            className="btn-secondary"
            style={{ width: '100%', fontSize: '0.82rem', padding: '8px 12px' }}
          >
            <Sparkles size={14} color="#38bdf8" />
            <span>Apply Imputation</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginTop: '14px',
          padding: '8px 14px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(16, 185, 129, 0.12)',
          color: '#34d399',
          fontSize: '0.82rem',
        }}>
          <CheckCircle2 size={16} />
          <span>{statusMsg}</span>
        </div>
      )}
    </div>
  )
}
