import React, { useState, useEffect } from 'react'
import type { DatasetProfile, ChatMessage } from './types'
import {
  loadSampleDataset,
  uploadDataset,
  switchSheet,
  cleanDataset,
  sendChatMessage,
  fetchReport,
  fetchUserProfile,
} from './api'
import { TopHeader } from './components/TopHeader'
import { SidebarDock } from './components/SidebarDock'
import { BusinessDashboard } from './components/BusinessDashboard'
import { UploadSection } from './components/UploadSection'
import { KPIOverview } from './components/KPIOverview'
import { DataPreviewTable } from './components/DataPreviewTable'
import { ChatInterface } from './components/ChatInterface'
import { CleaningStudio } from './components/CleaningStudio'
import { AuthModal } from './components/AuthModal'
import { ReportModal } from './components/ReportModal'
import { LandingPage } from './pages/LandingPage'
import { PricingPage } from './pages/PricingPage'
import { PrivacyPage } from './pages/PrivacyPage'
import { ContactPage } from './pages/ContactPage'
import {
  AlertCircle,
  ArrowRight,
  Sun,
  Moon,
} from 'lucide-react'

export const App: React.FC = () => {
  // Theme state: 'dark' (AgentAnalyst) | 'light' (SheetWise)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('datapilot_theme') as 'dark' | 'light') || 'dark'
  })

  // Navigation State
  const [currentView, setCurrentView] = useState<string>('workspace')
  const [activeTab, setActiveTab] = useState<'dashboard' | 'chat' | 'preview' | 'clean' | 'report'>('dashboard')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false)

  // Dataset & Analytics State
  const [datasetId, setDatasetId] = useState<string | null>(null)
  const [filename, setFilename] = useState<string>('')
  const [availableSheets, setAvailableSheets] = useState<string[]>([])
  const [selectedSheet, setSelectedSheet] = useState<string>('')
  const [profile, setProfile] = useState<DatasetProfile | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isCleaning, setIsCleaning] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Auth & User State
  const [user, setUser] = useState<any>(null)
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false)

  // Report Modal State
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false)
  const [reportData, setReportData] = useState<any>(null)

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('datapilot_theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  // Load user profile & initial sample dataset on mount
  useEffect(() => {
    fetchUserProfile().then((u) => {
      if (u) setUser(u)
    })
    handleLoadSample('csv')
  }, [])

  const handleLoadSample = async (type: 'csv' | 'xlsx') => {
    setIsLoading(true)
    setErrorMsg(null)
    try {
      const data = await loadSampleDataset(type)
      setDatasetId(data.dataset_id)
      setFilename(data.filename)
      setProfile(data.profile)
      setAvailableSheets(data.profile.available_sheets || [])
      setSelectedSheet(data.profile.selected_sheet || '')
      setMessages([])
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load sample dataset')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (file: File) => {
    setIsLoading(true)
    setErrorMsg(null)
    try {
      const data = await uploadDataset(file)
      setDatasetId(data.dataset_id)
      setFilename(data.filename)
      setProfile(data.profile)
      setAvailableSheets(data.profile.available_sheets || [])
      setSelectedSheet(data.profile.selected_sheet || '')
      setMessages([])
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to upload dataset')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectSheet = async (sheet: string) => {
    if (!datasetId || sheet === selectedSheet) return
    setIsLoading(true)
    setErrorMsg(null)
    try {
      const res = await switchSheet(datasetId, sheet)
      setProfile(res.profile)
      setSelectedSheet(res.selected_sheet)
      setAvailableSheets(res.available_sheets || [])
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to switch sheet')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClean = async (operations: any[]) => {
    if (!datasetId) return
    setIsCleaning(true)
    setErrorMsg(null)
    try {
      const res = await cleanDataset(datasetId, operations)
      setProfile(res.updated_profile)
    } catch (err: any) {
      setErrorMsg(err.message || 'Cleaning operation failed')
    } finally {
      setIsCleaning(false)
    }
  }

  const handleSendMessage = async (msgText: string) => {
    if (!datasetId || !msgText.trim()) return

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      role: 'user',
      content: msgText,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    setIsLoading(true)
    setErrorMsg(null)

    try {
      const res = await sendChatMessage(datasetId, msgText)
      const assistantMsg: ChatMessage = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: res.reply,
        tool_calls: res.tool_calls,
        tool_results: res.tool_results,
        chart_spec: res.chart_spec,
        rag_sources: res.rag_sources,
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (err: any) {
      setErrorMsg(err.message || 'Agent failed to respond')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenReport = async () => {
    if (!datasetId) return
    setIsLoading(true)
    try {
      const res = await fetchReport(datasetId)
      setReportData(res.report)
      setIsReportOpen(true)
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate report')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('datapilot_token')
    setUser(null)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-app)' }}>
      {/* If viewing marketing pages, render top promotional header */}
      {currentView !== 'workspace' ? (
        <>
          <header
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 28px',
              borderBottom: '1px solid var(--border-subtle)',
              background: 'var(--bg-topbar)',
              backdropFilter: 'blur(16px)',
              position: 'sticky',
              top: 0,
              zIndex: 50,
            }}
          >
            {/* Brand Logo */}
            <div
              onClick={() => setCurrentView('landing')}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 16px rgba(79, 70, 229, 0.45)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '1.15rem',
                }}
              >
                A
              </div>
              <div>
                <span style={{ fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
                  Agent<span style={{ color: 'var(--accent-primary)' }}>Analyst</span>
                </span>
                <span
                  style={{
                    marginLeft: '8px',
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    padding: '2px 6px',
                    borderRadius: '999px',
                    background: 'var(--bg-active)',
                    color: 'var(--accent-primary)',
                  }}
                >
                  SheetWise AI
                </span>
              </div>
            </div>

            {/* Links */}
            <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => setCurrentView('landing')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  color: currentView === 'landing' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontWeight: currentView === 'landing' ? 600 : 500,
                  cursor: 'pointer',
                }}
              >
                Product
              </button>
              <button
                onClick={() => {
                  setCurrentView('workspace')
                  setActiveTab('dashboard')
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Dashboard Builder
              </button>
              <button
                onClick={() => setCurrentView('pricing')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  color: currentView === 'pricing' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontWeight: currentView === 'pricing' ? 600 : 500,
                  cursor: 'pointer',
                }}
              >
                Pricing
              </button>
              <button
                onClick={() => setCurrentView('privacy')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  color: currentView === 'privacy' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontWeight: currentView === 'privacy' ? 600 : 500,
                  cursor: 'pointer',
                }}
              >
                Security
              </button>
              <button
                onClick={() => setCurrentView('contact')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  color: currentView === 'contact' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontWeight: currentView === 'contact' ? 600 : 500,
                  cursor: 'pointer',
                }}
              >
                Contact
              </button>
            </nav>

            {/* CTAs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={toggleTheme}
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
                }}
              >
                {theme === 'dark' ? <Sun size={15} color="#fbbf24" /> : <Moon size={15} color="#4f46e5" />}
              </button>
              <button
                onClick={() => {
                  setCurrentView('workspace')
                  setActiveTab('dashboard')
                }}
                className="btn-primary"
                style={{ fontSize: '0.84rem', padding: '8px 16px' }}
              >
                <span>Launch App</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </header>

          <main style={{ maxWidth: '1240px', width: '100%', margin: '0 auto', padding: '24px 20px', flex: 1 }}>
            {currentView === 'landing' && (
              <LandingPage
                onLaunchWorkspace={() => {
                  setCurrentView('workspace')
                  setActiveTab('dashboard')
                }}
                onExploreDemo={() => {
                  handleLoadSample('csv')
                  setCurrentView('workspace')
                  setActiveTab('dashboard')
                }}
              />
            )}
            {currentView === 'pricing' && (
              <PricingPage
                currentPlan={user?.plan_tier || 'free'}
                onSelectPlan={() => setIsAuthOpen(true)}
              />
            )}
            {currentView === 'privacy' && <PrivacyPage />}
            {currentView === 'contact' && <ContactPage />}
          </main>
        </>
      ) : (
        /* Workspace Dual Layout: SidebarDock + TopHeader + Dashboard Canvas */
        <div style={{ display: 'flex', flex: 1, minHeight: '100vh', overflow: 'hidden' }}>
          {/* Left Dock (Image 1 & 2) */}
          <SidebarDock
            currentTab={activeTab}
            onChangeTab={(t) => {
              if (t === 'report') {
                handleOpenReport()
              } else {
                setActiveTab(t)
              }
            }}
            currentView={currentView}
            onNavigateView={setCurrentView}
            onOpenUpgrade={() => setCurrentView('pricing')}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />

          {/* Right Main Content Area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', minWidth: 0 }}>
            {/* Top Header */}
            <TopHeader
              theme={theme}
              onToggleTheme={toggleTheme}
              onLoadSample={handleLoadSample}
              onOpenReport={handleOpenReport}
              user={user}
              onOpenAuth={() => setIsAuthOpen(true)}
              onLogout={handleLogout}
              onSearchQuery={(q) => {
                setActiveTab('chat')
                handleSendMessage(q)
              }}
            />

            {/* Main Canvas */}
            <main style={{ padding: '20px 24px', flex: 1, maxWidth: '1600px', width: '100%', margin: '0 auto' }}>
              {/* Error Banner */}
              {errorMsg && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 18px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(244, 63, 94, 0.12)',
                    border: '1px solid rgba(244, 63, 94, 0.25)',
                    color: 'var(--accent-rose)',
                    fontSize: '0.85rem',
                    marginBottom: '18px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={18} />
                    <span>{errorMsg}</span>
                  </div>
                  <button
                    onClick={() => setErrorMsg(null)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', fontSize: '1.1rem' }}
                  >
                    ×
                  </button>
                </div>
              )}

              {/* View 1: Master Business Dashboard Builder (Centerpiece) */}
              {activeTab === 'dashboard' && (
                <BusinessDashboard
                  profile={profile}
                  filename={filename}
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  isLoading={isLoading}
                  onOpenReport={handleOpenReport}
                  onSwitchToSpreadsheet={() => setActiveTab('preview')}
                />
              )}

              {/* View 2: Fullscreen Ask AI Analyst Chat */}
              {activeTab === 'chat' && (
                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                  <ChatInterface
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    isLoading={isLoading}
                    hasDataset={!!datasetId}
                  />
                </div>
              )}

              {/* View 3: Spreadsheets Data Preview & Schema */}
              {activeTab === 'preview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <UploadSection
                    onFileUpload={handleFileUpload}
                    onLoadSample={handleLoadSample}
                    isLoading={isLoading}
                    currentFilename={filename}
                    availableSheets={availableSheets}
                    selectedSheet={selectedSheet}
                    onSelectSheet={handleSelectSheet}
                  />
                  {profile && <DataPreviewTable profile={profile} filename={filename} />}
                </div>
              )}

              {/* View 4: Cleaning Studio */}
              {activeTab === 'clean' && profile && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <KPIOverview
                    profile={profile}
                    onQuickCleanDuplicates={() => handleClean([{ op: 'drop_duplicates' }])}
                    isCleaning={isCleaning}
                  />
                  <CleaningStudio
                    profile={profile}
                    onClean={handleClean}
                    isCleaning={isCleaning}
                  />
                </div>
              )}
            </main>
          </div>
        </div>
      )}

      {/* Global Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(_, loggedInUser) => setUser(loggedInUser)}
      />

      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        reportData={reportData}
        datasetId={datasetId || ''}
      />

      {/* Global SaaS Footer on non-workspace pages */}
      {currentView !== 'workspace' && (
        <footer
          style={{
            padding: '24px 28px',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-card)',
            textAlign: 'center',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', flexWrap: 'wrap', marginBottom: '8px' }}>
            <button onClick={() => setCurrentView('landing')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>Product</button>
            <button onClick={() => setCurrentView('pricing')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>Pricing</button>
            <button onClick={() => setCurrentView('privacy')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>Security & Zero Retention</button>
            <button onClick={() => setCurrentView('contact')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>Developer API & Support</button>
          </div>
          <div>
            DataPilot AI &bull; Autonomous Spreadsheet Intelligence &bull; Powered by Deterministic Python Pandas Engine
          </div>
        </footer>
      )}
    </div>
  )
}

export default App
