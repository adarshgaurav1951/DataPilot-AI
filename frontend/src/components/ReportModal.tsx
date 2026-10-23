import React from 'react'
import { X, Download, FileText, CheckCircle2 } from 'lucide-react'

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  reportData: any
  datasetId: string
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  reportData,
  datasetId,
}) => {
  if (!isOpen || !reportData) return null

  const handleDownload = (format: 'html' | 'md') => {
    const url = `/api/datasets/${datasetId}/report/download?format=${format}`
    const a = document.createElement('a')
    a.href = url
    a.download = `datapilot_report_${datasetId.slice(0, 8)}.${format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div className="glass-panel" style={{
        maxWidth: '840px',
        width: '100%',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        background: 'rgba(13, 18, 28, 0.96)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
              <FileText size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Executive Analytical Report</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Generated: {reportData.generated_at}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => handleDownload('html')}
              className="btn-primary"
              style={{ padding: '7px 14px', fontSize: '0.8rem' }}
            >
              <Download size={14} />
              <span>Download HTML</span>
            </button>
            <button
              onClick={() => handleDownload('md')}
              className="btn-secondary"
              style={{ padding: '7px 14px', fontSize: '0.8rem' }}
            >
              <Download size={14} />
              <span>Download Markdown</span>
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                marginLeft: '8px',
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Health Score Banner */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
          }}>
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Overall Data Quality Score
              </h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Calculated from null density, duplicate ratios, and outlier distributions.
              </p>
            </div>
            <div style={{
              fontSize: '1.8rem',
              fontWeight: 800,
              fontFamily: 'var(--font-heading)',
              color: reportData.health_score > 80 ? '#34d399' : '#fbbf24',
            }}>
              {reportData.health_score} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/ 100</span>
            </div>
          </div>

          {/* Metric Highlights Table */}
          {reportData.numeric_highlights && reportData.numeric_highlights.length > 0 && (
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '10px' }}>
                Key Quantitative Metrics (Computed by Pandas)
              </h4>
              <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--border-subtle)' }}>
                      <th style={{ padding: '10px 14px', textAlign: 'left' }}>Metric</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right' }}>Mean</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right' }}>Min</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right' }}>Max</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right' }}>Std Dev</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.numeric_highlights.map((h: any, idx: number) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>{h.metric}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', color: '#818cf8' }}>{h.mean.toLocaleString()}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--text-secondary)' }}>{h.min.toLocaleString()}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--text-secondary)' }}>{h.max.toLocaleString()}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--text-muted)' }}>{h.std.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recommended Questions */}
          {reportData.recommended_questions && reportData.recommended_questions.length > 0 && (
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '10px' }}>
                Recommended Follow-Up Inquiries
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {reportData.recommended_questions.map((q: string, idx: number) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '0.82rem',
                    }}
                  >
                    <CheckCircle2 size={15} color="#34d399" />
                    <span>{q}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
