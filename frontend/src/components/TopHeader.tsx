import React, { useState } from 'react'
import {
  Sparkles,
  Bell,
  Sun,
  Moon,
  Share2,
  Download,
  ChevronDown,
  Plus,
  Building2,
  Check,
  Calendar,
  LogOut,
} from 'lucide-react'

interface TopHeaderProps {
  theme: 'dark' | 'light'
  onToggleTheme: () => void
  onLoadSample: (type: 'csv' | 'xlsx') => void
  onOpenReport: () => void
  user: any
  onOpenAuth: () => void
  onLogout: () => void
  onSearchQuery?: (q: string) => void
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  theme,
  onToggleTheme,
  onLoadSample,
  onOpenReport,
  user,
  onOpenAuth,
  onLogout,
  onSearchQuery,
}) => {
  const [searchValue, setSearchValue] = useState('')
  const [dateRange] = useState('May 1 - May 31, 2025')
  const [comparisonRange] = useState('vs Apr 1 - Apr 30, 2025')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [isCopied, setIsCopied] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false)

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchValue.trim() && onSearchQuery) {
      onSearchQuery(searchValue.trim())
    }
  }

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 24px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-topbar)',
        backdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        height: '64px',
      }}
    >
      {/* Left: Workspace dropdown & Quick Create */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <Building2 size={16} color="var(--accent-primary)" />
            <span>Private Workspace</span>
            <ChevronDown size={14} color="var(--text-muted)" />
          </button>

          {isWorkspaceMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: '110%',
                left: 0,
                width: '220px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                padding: '6px',
                zIndex: 50,
              }}
            >
              <div
                style={{
                  padding: '8px 10px',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                }}
              >
                Switch Workspace
              </div>
              <button
                onClick={() => setIsWorkspaceMenuOpen(false)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-active)',
                  border: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span style={{ fontWeight: 600 }}>🏢 Private Workspace</span>
                <Check size={14} color="var(--accent-primary)" />
              </button>
              <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '4px 0' }} />
              <button
                onClick={() => {
                  onLoadSample('csv')
                  setIsWorkspaceMenuOpen(false)
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--accent-primary)',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                <Plus size={14} />
                <span>Load Sample Dataset</span>
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => onLoadSample('csv')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--accent-primary)',
            color: '#ffffff',
            border: 'none',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)',
          }}
        >
          <Plus size={14} />
          <span>New</span>
        </button>
      </div>

      {/* Center: Search Bar (Image 1 style with ✨ Sparkles) */}
      <form
        onSubmit={handleSearchSubmit}
        style={{
          flex: 1,
          maxWidth: '420px',
          margin: '0 20px',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            pointerEvents: 'none',
            color: 'var(--text-muted)',
          }}
        >
          <Sparkles size={14} color="var(--accent-primary)" />
        </div>
        <input
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Search metrics, sheets, or ask AI..."
          style={{
            width: '100%',
            padding: '8px 14px 8px 34px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
            fontSize: '0.83rem',
            outline: 'none',
            transition: 'all 0.2s',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--accent-primary)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--border-subtle)')}
        />
      </form>

      {/* Right: Controls, Theme Switcher, Notifications & Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Date Filter & Comparison (SheetWise style) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 8px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-card)',
            fontSize: '0.76rem',
            color: 'var(--text-secondary)',
          }}
          className="desktop-filters"
        >
          <Calendar size={13} color="var(--accent-primary)" />
          <span style={{ fontWeight: 500 }}>{dateRange}</span>
          <span style={{ color: 'var(--text-muted)' }}>{comparisonRange}</span>
        </div>

        {/* Auto-Refresh Toggle */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
          }}
        >
          <span>Auto-refresh</span>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            style={{
              width: '34px',
              height: '18px',
              borderRadius: '999px',
              background: autoRefresh ? 'var(--accent-primary)' : 'var(--border-subtle)',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background 0.2s',
              padding: 0,
            }}
          >
            <div
              style={{
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                background: '#ffffff',
                position: 'absolute',
                top: '2px',
                left: autoRefresh ? '18px' : '2px',
                transition: 'left 0.2s',
              }}
            />
          </button>
        </div>

        {/* Share Button */}
        <button
          onClick={handleShare}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
            fontSize: '0.8rem',
            fontWeight: 500,
            cursor: 'pointer',
          }}
          title="Share workspace link"
        >
          {isCopied ? <Check size={14} color="var(--accent-emerald)" /> : <Share2 size={14} />}
          <span>{isCopied ? 'Copied!' : 'Share'}</span>
        </button>

        {/* Export Button */}
        <button
          onClick={onOpenReport}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--accent-primary)',
            border: 'none',
            color: '#ffffff',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(79, 70, 229, 0.25)',
          }}
        >
          <Download size={14} />
          <span>Export</span>
        </button>

        <div style={{ width: '1px', height: '22px', background: 'var(--border-subtle)' }} />

        {/* Dark / Light Theme Toggle (Image 1 style) */}
        <button
          onClick={onToggleTheme}
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          title={theme === 'dark' ? 'Switch to Light Mode (SheetWise)' : 'Switch to Dark Mode (AgentAnalyst)'}
        >
          {theme === 'dark' ? <Sun size={16} color="#fbbf24" /> : <Moon size={16} color="#6366f1" />}
        </button>

        {/* Notification Bell with Badge */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative',
            }}
          >
            <Bell size={16} />
            <span
              style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                background: 'var(--accent-rose)',
                color: '#ffffff',
                fontSize: '0.62rem',
                fontWeight: 700,
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 4px rgba(244, 63, 94, 0.6)',
              }}
            >
              3
            </span>
          </button>

          {isNotificationsOpen && (
            <div
              style={{
                position: 'absolute',
                top: '120%',
                right: 0,
                width: '300px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
                padding: '12px',
                zIndex: 60,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Notifications & Alerts</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--accent-primary)', cursor: 'pointer' }}>Mark all read</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-card-subtle)', fontSize: '0.78rem' }}>
                  <div style={{ fontWeight: 600, color: 'var(--accent-emerald)' }}>🟢 Revenue Trend Alert</div>
                  <div style={{ color: 'var(--text-secondary)' }}>Revenue peaked in July and October (+35% increase).</div>
                </div>
                <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-card-subtle)', fontSize: '0.78rem' }}>
                  <div style={{ fontWeight: 600, color: 'var(--accent-amber)' }}>⚠️ Stock Alert</div>
                  <div style={{ color: 'var(--text-secondary)' }}>iPhone 13 Pro has only 2 units remaining in stock.</div>
                </div>
                <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-card-subtle)', fontSize: '0.78rem' }}>
                  <div style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>✨ AI Insight Ready</div>
                  <div style={{ color: 'var(--text-secondary)' }}>Conversion rate improved by 0.8pp this month.</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => (user ? setIsProfileOpen(!isProfileOpen) : onOpenAuth())}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '3px',
              borderRadius: '999px',
              background: 'transparent',
              border: '2px solid var(--accent-primary)',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.75rem',
              }}
            >
              {user?.full_name ? user.full_name[0].toUpperCase() : 'A'}
            </div>
          </button>

          {isProfileOpen && user && (
            <div
              style={{
                position: 'absolute',
                top: '120%',
                right: 0,
                width: '220px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                padding: '8px',
                zIndex: 60,
              }}
            >
              <div style={{ padding: '8px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '4px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user.full_name || 'Data Analyst'}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{user.email}</div>
                <div style={{ display: 'inline-block', marginTop: '4px', fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)', fontWeight: 600 }}>
                  {user.plan_tier?.toUpperCase() || 'PRO TIER'}
                </div>
              </div>
              <button
                onClick={() => {
                  onLogout()
                  setIsProfileOpen(false)
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--accent-rose)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
