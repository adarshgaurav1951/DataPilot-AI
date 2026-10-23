import React from 'react'
import { Sparkles, Database, FileSpreadsheet, User, FileText, LogOut } from 'lucide-react'

interface NavbarProps {
  onLoadSample: (type: 'csv' | 'xlsx') => void
  isLoading: boolean
  hasDataset: boolean
  filename?: string
  activeView: string
  onNavigate: (view: string) => void
  user: any
  onOpenAuth: () => void
  onLogout: () => void
  onOpenReport: () => void
}

export const Navbar: React.FC<NavbarProps> = ({
  onLoadSample,
  isLoading,
  hasDataset,
  filename,
  activeView,
  onNavigate,
  user,
  onOpenAuth,
  onLogout,
  onOpenReport,
}) => {
  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 28px',
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(10, 14, 23, 0.88)',
      backdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      flexWrap: 'wrap',
      gap: '12px',
    }}>
      {/* Brand & Left Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div
          onClick={() => onNavigate('landing')}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        >
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(99, 102, 241, 0.4)',
          }}>
            <Sparkles size={20} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h1 className="brand-heading" style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                DataPilot <span className="gradient-text">AI</span>
              </h1>
              <span style={{
                background: 'rgba(99, 102, 241, 0.15)',
                color: '#818cf8',
                fontSize: '0.65rem',
                fontWeight: 600,
                padding: '2px 6px',
                borderRadius: '999px',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                fontFamily: 'var(--font-mono)',
              }}>
                SAAS
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {[
            { id: 'landing', label: 'Product' },
            { id: 'workspace', label: 'Analytics Workspace' },
            { id: 'pricing', label: 'Pricing' },
            { id: 'privacy', label: 'Privacy' },
            { id: 'contact', label: 'Contact' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.84rem',
                fontWeight: activeView === item.id ? 600 : 500,
                color: activeView === item.id ? '#818cf8' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {hasDataset && (
          <button
            onClick={onOpenReport}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.8rem', color: '#c084fc', borderColor: 'rgba(192, 132, 252, 0.3)' }}
          >
            <FileText size={14} />
            <span>Executive Report</span>
          </button>
        )}

        {hasDataset && filename && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 12px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            color: '#34d399',
            fontSize: '0.8rem',
            fontFamily: 'var(--font-mono)',
          }}>
            <Database size={14} />
            <span>{filename}</span>
          </div>
        )}

        {/* Sample Loaders */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => onLoadSample('csv')}
            disabled={isLoading}
            className="btn-secondary"
            style={{ fontSize: '0.78rem', padding: '6px 10px' }}
            title="Load sample_sales.csv"
          >
            <FileSpreadsheet size={14} color="#38bdf8" />
            <span>.csv Demo</span>
          </button>
          <button
            onClick={() => onLoadSample('xlsx')}
            disabled={isLoading}
            className="btn-secondary"
            style={{ fontSize: '0.78rem', padding: '6px 10px' }}
            title="Load sample_sales.xlsx"
          >
            <FileSpreadsheet size={14} color="#34d399" />
            <span>.xlsx Demo</span>
          </button>
        </div>

        {/* User Account / Sign In */}
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 10px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              fontSize: '0.8rem',
              color: '#818cf8',
            }}>
              <User size={13} />
              <span>{user.full_name || user.email.split('@')[0]} ({user.plan_tier})</span>
            </div>
            <button
              onClick={onLogout}
              className="btn-secondary"
              style={{ padding: '6px', borderRadius: '8px' }}
              title="Sign Out"
            >
              <LogOut size={14} color="var(--text-muted)" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="btn-primary"
            style={{ padding: '7px 14px', fontSize: '0.82rem' }}
          >
            <User size={14} />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  )
}
