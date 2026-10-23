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
import { Navbar } from './components/Navbar'
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
  MessageSquare,
  Table,
  Wand2,
  AlertCircle,
} from 'lucide-react'

export const App: React.FC = () => {
  // Navigation State: 'landing' | 'workspace' | 'pricing' | 'privacy' | 'contact'
  const [currentView, setCurrentView] = useState<string>('workspace')
  const [activeTab, setActiveTab] = useState<'chat' | 'preview' | 'clean'>('chat')

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

  // Load user profile on mount
  useEffect(() => {
    fetchUserProfile().then(u => {
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
    setMessages(prev => [...prev, userMsg])
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
      setMessages(prev => [...prev, assistantMsg])
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation */}
      <Navbar
        onLoadSample={handleLoadSample}
        isLoading={isLoading}
        hasDataset={!!datasetId}
        filename={filename}
        activeView={currentView}
        onNavigate={setCurrentView}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        onOpenReport={handleOpenReport}
      />

      {/* Main Content Router */}
      <main style={{ maxWidth: '1240px', width: '100%', margin: '0 auto', padding: '24px 20px', flex: 1 }}>
        {/* Error Alert */}
        {errorMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#f43f5e',
            fontSize: '0.85rem',
            marginBottom: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', fontSize: '1rem' }}
            >
              ×
            </button>
          </div>
        )}

        {/* View 1: Marketing Landing Page */}
        {currentView === 'landing' && (
          <LandingPage
            onLaunchWorkspace={() => setCurrentView('workspace')}
            onExploreDemo={() => {
              handleLoadSample('csv')
              setCurrentView('workspace')
            }}
          />
        )}

        {/* View 2: Pricing Page */}
        {currentView === 'pricing' && (
          <PricingPage
            currentPlan={user?.plan_tier || 'free'}
            onSelectPlan={(planId) => {
              if (!user) {
                setIsAuthOpen(true)
              } else {
                fetch('/api/auth/upgrade', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('datapilot_token')}`,
                  },
                  body: JSON.stringify({ plan_tier: planId }),
                }).then(() => fetchUserProfile().then(setUser))
              }
            }}
          />
        )}

        {/* View 3: Privacy Page */}
        {currentView === 'privacy' && <PrivacyPage />}

        {/* View 4: Contact Page */}
        {currentView === 'contact' && <ContactPage />}

        {/* View 5: Authenticated Analytics Workspace */}
        {currentView === 'workspace' && (
          <>
            <UploadSection
              onFileUpload={handleFileUpload}
              onLoadSample={handleLoadSample}
              isLoading={isLoading}
              currentFilename={filename}
              availableSheets={availableSheets}
              selectedSheet={selectedSheet}
              onSelectSheet={handleSelectSheet}
            />

            {profile && (
              <>
                <KPIOverview
                  profile={profile}
                  onQuickCleanDuplicates={() => handleClean([{ op: 'drop_duplicates' }])}
                  isCleaning={isCleaning}
                />

                {/* Navigation Tabs */}
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  borderBottom: '1px solid var(--border-subtle)',
                  marginBottom: '20px',
                  paddingBottom: '2px',
                }}>
                  <button
                    onClick={() => setActiveTab('chat')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 18px',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: `2px solid ${activeTab === 'chat' ? 'var(--accent-primary)' : 'transparent'}`,
                      color: activeTab === 'chat' ? 'var(--text-primary)' : 'var(--text-muted)',
                      fontWeight: activeTab === 'chat' ? 600 : 500,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <MessageSquare size={16} color={activeTab === 'chat' ? '#818cf8' : undefined} />
                    <span>AI Analyst Chat</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('preview')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 18px',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: `2px solid ${activeTab === 'preview' ? 'var(--accent-primary)' : 'transparent'}`,
                      color: activeTab === 'preview' ? 'var(--text-primary)' : 'var(--text-muted)',
                      fontWeight: activeTab === 'preview' ? 600 : 500,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Table size={16} color={activeTab === 'preview' ? '#818cf8' : undefined} />
                    <span>Data Preview & Schema</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('clean')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 18px',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: `2px solid ${activeTab === 'clean' ? 'var(--accent-primary)' : 'transparent'}`,
                      color: activeTab === 'clean' ? 'var(--text-primary)' : 'var(--text-muted)',
                      fontWeight: activeTab === 'clean' ? 600 : 500,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Wand2 size={16} color={activeTab === 'clean' ? '#818cf8' : undefined} />
                    <span>Cleaning Studio</span>
                  </button>
                </div>

                {/* Tab Views */}
                {activeTab === 'chat' && (
                  <ChatInterface
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    isLoading={isLoading}
                    hasDataset={!!datasetId}
                  />
                )}

                {activeTab === 'preview' && (
                  <DataPreviewTable profile={profile} filename={filename} />
                )}

                {activeTab === 'clean' && (
                  <CleaningStudio
                    profile={profile}
                    onClean={handleClean}
                    isCleaning={isCleaning}
                  />
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(_, loggedInUser) => setUser(loggedInUser)}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        reportData={reportData}
        datasetId={datasetId || ''}
      />

      {/* Global SaaS Footer */}
      <footer style={{
        padding: '24px 28px',
        borderTop: '1px solid var(--border-subtle)',
        background: 'rgba(8, 11, 17, 0.95)',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '8px' }}>
          <button onClick={() => setCurrentView('landing')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>Product</button>
          <button onClick={() => setCurrentView('pricing')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>Pricing</button>
          <button onClick={() => setCurrentView('privacy')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>Privacy & Security</button>
          <button onClick={() => setCurrentView('contact')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>Support</button>
        </div>
        <div>
          DataPilot AI &bull; Built for Autonomous Spreadsheet Intelligence &bull; Deterministic Python Pandas Compute Engine
        </div>
      </footer>
    </div>
  )
}

export default App
