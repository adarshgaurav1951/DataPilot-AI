import React, { useState } from 'react'
import {
  LayoutDashboard,
  Bot,
  Table,
  Wand2,
  FileText,
  Folder,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  Plus,
} from 'lucide-react'

interface SidebarDockProps {
  currentTab: 'dashboard' | 'chat' | 'preview' | 'clean' | 'report'
  onChangeTab: (tab: 'dashboard' | 'chat' | 'preview' | 'clean' | 'report') => void
  currentView: string
  onNavigateView: (view: string) => void
  onOpenUpgrade: () => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export const SidebarDock: React.FC<SidebarDockProps> = ({
  currentTab,
  onChangeTab,
  currentView,
  onNavigateView,
  onOpenUpgrade,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const [selectedFolder, setSelectedFolder] = useState<string>('Sales & Marketing')

  const navItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'chat' as const, label: 'Ask AI Copilot', icon: Bot, badge: 'AI' },
    { id: 'preview' as const, label: 'Spreadsheets', icon: Table },
    { id: 'clean' as const, label: 'Cleaning Studio', icon: Wand2 },
    { id: 'report' as const, label: 'Reports', icon: FileText },
  ]

  const folders = [
    { name: 'Sales & Marketing', color: '#6366f1' },
    { name: 'Finance & P&L', color: '#10b981' },
    { name: 'Operations', color: '#06b6d4' },
    { name: 'HR & Personnel', color: '#f59e0b' },
    { name: 'Archive', color: '#8b5cf6' },
  ]

  return (
    <aside
      style={{
        width: isCollapsed ? '72px' : '240px',
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        zIndex: 45,
        userSelect: 'none',
      }}
    >
      {/* Top Brand Logo Section */}
      <div>
        <div
          onClick={() => onNavigateView('landing')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: isCollapsed ? '16px 14px' : '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            cursor: 'pointer',
          }}
        >
          {/* Glowing Hexagon / Akira Style Icon (Image 1) */}
          <div
            style={{
              width: '38px',
              height: '38px',
              minWidth: '38px',
              borderRadius: '11px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(79, 70, 229, 0.45)',
              position: 'relative',
            }}
          >
            <span
              style={{
                color: '#ffffff',
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                fontSize: '1.25rem',
                letterSpacing: '-0.02em',
              }}
            >
              A
            </span>
          </div>

          {!isCollapsed && (
            <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  Agent<span style={{ color: 'var(--accent-primary)' }}>Analyst</span>
                </span>
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                Powered by DataPilot
              </span>
            </div>
          )}
        </div>

        {/* Section: MAIN NAVIGATION */}
        <div style={{ padding: isCollapsed ? '12px 8px' : '14px 12px' }}>
          {!isCollapsed && (
            <div
              style={{
                fontSize: '0.68rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '8px',
                paddingLeft: '10px',
              }}
            >
              MAIN
            </div>
          )}

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = currentView === 'workspace' && currentTab === item.id

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (currentView !== 'workspace') onNavigateView('workspace')
                    onChangeTab(item.id)
                  }}
                  title={item.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                    padding: isCollapsed ? '10px' : '10px 14px',
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    background: isActive ? 'var(--bg-active)' : 'transparent',
                    color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    fontSize: '0.86rem',
                    fontWeight: isActive ? 600 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'var(--bg-card-hover)'
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <Icon size={18} color={isActive ? 'var(--accent-primary)' : 'currentColor'} />
                  {!isCollapsed && (
                    <span style={{ flex: 1, textAlign: 'left', whiteSpace: 'nowrap' }}>
                      {item.label}
                    </span>
                  )}
                  {!isCollapsed && item.badge && (
                    <span
                      style={{
                        padding: '1px 6px',
                        borderRadius: '999px',
                        background: 'rgba(99, 102, 241, 0.15)',
                        color: 'var(--accent-primary)',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '3px',
                        height: '20px',
                        borderRadius: '0 4px 4px 0',
                        background: 'var(--accent-primary)',
                      }}
                    />
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Section: FOLDERS / PROJECTS (Image 1 & 2) */}
        {!isCollapsed && (
          <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border-subtle)' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingLeft: '10px',
                marginBottom: '8px',
              }}
            >
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                FOLDERS
              </span>
              <Plus size={14} color="var(--text-muted)" style={{ cursor: 'pointer' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {folders.map((folder) => {
                const isFolderActive = selectedFolder === folder.name

                return (
                  <button
                    key={folder.name}
                    onClick={() => setSelectedFolder(folder.name)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '7px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      background: isFolderActive ? 'var(--bg-active)' : 'transparent',
                      color: isFolderActive ? 'var(--text-primary)' : 'var(--text-muted)',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Folder size={15} color={folder.color} />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {folder.name}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Section: Upgrade Banner & Collapse Toggle */}
      <div style={{ padding: isCollapsed ? '12px 8px' : '14px 12px' }}>
        {/* Upgrade to Pro Card (Image 2 style) */}
        {!isCollapsed ? (
          <div
            style={{
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(124, 58, 237, 0.12) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              marginBottom: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <Sparkles size={14} color="var(--accent-primary)" />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Upgrade to Pro
              </span>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '10px' }}>
              Unlock advanced AI, more connectors & unlimited exports.
            </p>
            <button
              onClick={onOpenUpgrade}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '6px 12px',
                fontSize: '0.78rem',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <span>Upgrade Now</span>
              <ArrowUpRight size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenUpgrade}
            title="Upgrade to Pro"
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-active)',
              border: '1px solid var(--border-active)',
              color: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              marginBottom: '10px',
            }}
          >
            <Sparkles size={18} />
          </button>
        )}

        {/* Collapse / Expand Toggle Button */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'space-between',
              padding: '8px 10px',
              borderRadius: 'var(--radius-sm)',
              background: 'transparent',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              fontSize: '0.75rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {!isCollapsed && <span>Collapse Sidebar</span>}
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        )}
      </div>
    </aside>
  )
}
