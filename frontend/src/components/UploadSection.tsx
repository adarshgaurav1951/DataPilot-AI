import React, { useRef, useState } from 'react'
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react'

interface UploadSectionProps {
  onFileUpload: (file: File) => void
  onLoadSample: (type: 'csv' | 'xlsx') => void
  isLoading: boolean
  currentFilename?: string
  availableSheets?: string[]
  selectedSheet?: string
  onSelectSheet?: (sheet: string) => void
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  onFileUpload,
  onLoadSample,
  isLoading,
  currentFilename,
  availableSheets = [],
  selectedSheet,
  onSelectSheet,
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const validateAndUpload = (file: File) => {
    setErrorMsg(null)
    const fname = file.name.toLowerCase()
    if (!fname.endsWith('.csv') && !fname.endsWith('.xlsx')) {
      setErrorMsg('Please upload a valid .csv or .xlsx file.')
      return
    }
    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('File exceeds 15MB limit.')
      return
    }
    onFileUpload(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndUpload(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndUpload(e.target.files[0])
    }
  }

  return (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${isDragging ? '#6366f1' : 'rgba(255, 255, 255, 0.15)'}`,
          borderRadius: 'var(--radius-lg)',
          padding: '36px 20px',
          textAlign: 'center',
          cursor: 'pointer',
          background: isDragging ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255, 255, 255, 0.01)',
          transition: 'all 0.2s ease',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        <div style={{
          width: '54px',
          height: '54px',
          borderRadius: '16px',
          background: 'rgba(99, 102, 241, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px auto',
          color: '#818cf8',
        }}>
          <UploadCloud size={28} />
        </div>

        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '6px' }}>
          Drop your dataset here, or <span style={{ color: '#818cf8' }}>browse files</span>
        </h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Supports CSV or Excel (.xlsx) files up to 15MB • Automatic schema profiling
        </p>

        {currentFilename && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '999px',
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#34d399',
            fontSize: '0.82rem',
            fontWeight: 500,
          }}>
            <CheckCircle2 size={16} />
            <span>Active Dataset: {currentFilename}</span>
          </div>
        )}

        {availableSheets && availableSheets.length > 1 && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              marginTop: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Worksheet:
            </span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {availableSheets.map((sheet) => (
                <button
                  key={sheet}
                  type="button"
                  onClick={() => onSelectSheet && onSelectSheet(sheet)}
                  disabled={isLoading}
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.78rem',
                    borderRadius: '6px',
                    border: sheet === selectedSheet ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.1)',
                    background: sheet === selectedSheet ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                    color: sheet === selectedSheet ? '#a5b4fc' : 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {sheet}
                </button>
              ))}
            </div>
          </div>
        )}


        {errorMsg && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '999px',
            background: 'rgba(244, 63, 94, 0.15)',
            color: '#f43f5e',
            fontSize: '0.82rem',
            marginTop: '12px',
          }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Quick Load Sample Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: '16px',
        paddingTop: '16px',
        borderTop: '1px solid var(--border-subtle)',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          Need demo data to test?
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => onLoadSample('csv')}
            disabled={isLoading}
            className="btn-secondary"
            style={{ padding: '6px 14px', fontSize: '0.82rem' }}
          >
            <FileSpreadsheet size={15} color="#38bdf8" />
            <span>Load sample_sales.csv</span>
          </button>
          <button
            onClick={() => onLoadSample('xlsx')}
            disabled={isLoading}
            className="btn-secondary"
            style={{ padding: '6px 14px', fontSize: '0.82rem' }}
          >
            <FileSpreadsheet size={15} color="#34d399" />
            <span>Load sample_sales.xlsx</span>
          </button>
        </div>
      </div>
    </div>
  )
}
