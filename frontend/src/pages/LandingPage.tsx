import React, { useState } from 'react'
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  BarChart3,
  FileSpreadsheet,
  Wand2,
  FileText,
  CheckCircle2,
  Lock,
  Bot,
  Play,
  Database,
} from 'lucide-react'

interface LandingPageProps {
  onLaunchWorkspace: () => void
  onExploreDemo: () => void
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLaunchWorkspace,
  onExploreDemo,
}) => {
  const [activeInteractiveTab, setActiveInteractiveTab] = useState<'dashboard' | 'copilot' | 'clean'>('dashboard')
  const sampleQueryActive = 'What is the overall revenue trend for this year?'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '90px', paddingBottom: '80px' }}>
      {/* 1. Hero Section */}
      <section
        style={{
          textAlign: 'center',
          paddingTop: '60px',
          paddingBottom: '20px',
          maxWidth: '1080px',
          margin: '0 auto',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 16px',
            borderRadius: '999px',
            background: 'rgba(79, 70, 229, 0.12)',
            border: '1px solid rgba(79, 70, 229, 0.28)',
            color: 'var(--accent-primary)',
            fontSize: '0.82rem',
            fontWeight: 600,
            marginBottom: '24px',
          }}
        >
          <Sparkles size={15} />
          <span>Autonomous AI Data Analyst &bull; Real-Time SheetWise & AgentAnalyst Suite</span>
        </div>

        <h1
          style={{
            fontSize: 'clamp(2.4rem, 5vw, 4rem)',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            marginBottom: '22px',
          }}
        >
          Turn Raw Spreadsheets Into <br />
          <span className="gradient-text">Executive Dashboards & Decisions</span>
        </h1>

        <p
          style={{
            fontSize: 'clamp(1rem, 2vw, 1.2rem)',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            maxWidth: '780px',
            margin: '0 auto 36px auto',
          }}
        >
          Upload your CSV and Excel files. AgentAnalyst generates real-time business dashboards,
          interactive channel breakdowns, and deterministic calculations powered by Python Pandas —
          with a conversational AI copilot that never hallucinates.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <button
            onClick={onLaunchWorkspace}
            className="btn-primary"
            style={{ fontSize: '1.02rem', padding: '14px 28px', borderRadius: '12px' }}
          >
            <span>Launch Dashboard Builder</span>
            <ArrowRight size={18} />
          </button>

          <button
            onClick={onExploreDemo}
            className="btn-secondary"
            style={{ fontSize: '1.02rem', padding: '14px 26px', borderRadius: '12px' }}
          >
            <FileSpreadsheet size={18} color="var(--accent-cyan)" />
            <span>Explore Demo Sales Dataset</span>
          </button>
        </div>

        {/* Feature Highlights Pills */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '24px',
            marginTop: '36px',
            fontSize: '0.82rem',
            color: 'var(--text-muted)',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={16} color="var(--accent-emerald)" />
            <span>Guaranteed Zero Math Hallucination</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={16} color="var(--accent-emerald)" />
            <span>Excel (.xlsx) Multi-Sheet & CSV</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={16} color="var(--accent-emerald)" />
            <span>Instant PDF & Print Briefings</span>
          </div>
        </div>

        {/* 2. Interactive Live Hero Showcase (Recreates Image 1 & 2 Preview) */}
        <div
          className="card"
          style={{
            marginTop: '50px',
            padding: '24px',
            textAlign: 'left',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border-active)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Mock Browser Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '16px',
              borderBottom: '1px solid var(--border-subtle)',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f43f5e' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981' }} />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: '10px' }}>
                app.datapilot.ai/workspace/dashboard
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setActiveInteractiveTab('dashboard')}
                style={{
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  border: 'none',
                  background: activeInteractiveTab === 'dashboard' ? 'var(--bg-active)' : 'transparent',
                  color: activeInteractiveTab === 'dashboard' ? 'var(--accent-primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                📊 Dashboard Builder
              </button>
              <button
                onClick={() => setActiveInteractiveTab('copilot')}
                style={{
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  border: 'none',
                  background: activeInteractiveTab === 'copilot' ? 'var(--bg-active)' : 'transparent',
                  color: activeInteractiveTab === 'copilot' ? 'var(--accent-primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                💬 Ask AI Copilot
              </button>
              <button
                onClick={() => setActiveInteractiveTab('clean')}
                style={{
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  border: 'none',
                  background: activeInteractiveTab === 'clean' ? 'var(--bg-active)' : 'transparent',
                  color: activeInteractiveTab === 'clean' ? 'var(--accent-primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                🪄 Cleaning Studio
              </button>
            </div>
          </div>

          {/* Interactive Hero Content */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
            <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Revenue</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>$1,248,230</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>↑ 18.6% vs previous</div>
            </div>
            <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Expenses</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>$842,510</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--accent-amber)', fontWeight: 600 }}>↑ 7.3% vs previous</div>
            </div>
            <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Net Profit</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>$405,720</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>↑ 32.4% Margin 32.5%</div>
            </div>
            <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Conversion Rate</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>3.62%</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>↑ 0.8pp improvement</div>
            </div>
          </div>

          {/* Interactive Split Banner */}
          <div
            style={{
              padding: '16px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(6, 182, 212, 0.08) 100%)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '8px', borderRadius: '8px', background: 'var(--accent-primary)', color: '#ffffff' }}>
                <Bot size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Ask AI Copilot Preview:</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  "{sampleQueryActive}"
                </div>
              </div>
            </div>

            <button
              onClick={onLaunchWorkspace}
              className="btn-primary"
              style={{ fontSize: '0.82rem', padding: '8px 16px' }}
            >
              <span>Test Live in Workspace</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* 3. Four Core Pillars Showcase */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '12px' }}>
            Built for Autonomous Spreadsheet Intelligence
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '640px', margin: '0 auto' }}>
            Every feature is designed to replace hours of spreadsheet wrangling with instant, verified visual intelligence.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          {/* Card 1 */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(79, 70, 229, 0.12)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <BarChart3 size={22} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px' }}>Business Dashboard Builder</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Automatic KPI sparklines, multi-period revenue trends with dashed comparison lines, and donut channel distributions generated in seconds.
            </p>
          </div>

          {/* Card 2 */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.12)', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Zap size={22} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px' }}>Zero Math Hallucination</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Unlike generic LLMs that guess math, DataPilot parses your query and executes deterministic Python Pandas calculations with guaranteed exact arithmetic.
            </p>
          </div>

          {/* Card 3 */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.12)', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Wand2 size={22} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px' }}>One-Click Cleaning Studio</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Audit data health, detect duplicate entries, impute missing values, and standardize casing with a single click before analyzing.
            </p>
          </div>

          {/* Card 4 */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.12)', color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <FileText size={22} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px' }}>Executive PDF Reports</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Generate structured, C-suite ready briefing reports with key findings, data quality scores, and strategic recommendations ready for print or presentation.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Comparison Table: Traditional BI vs DataPilot AI */}
      <section style={{ maxWidth: '980px', margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '10px' }}>
            Why Modern Teams Choose DataPilot AI
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Compare the old way of building spreadsheets with the modern autonomous workflow.
          </p>
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-card-subtle)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                <th style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>Feature / Capability</th>
                <th style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>Legacy BI (Tableau, PowerBI)</th>
                <th style={{ padding: '16px 20px', color: 'var(--accent-primary)', fontWeight: 700 }}>DataPilot AI</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '16px 20px', fontWeight: 600 }}>Query Language</td>
                <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>Complex DAX, SQL, formulas</td>
                <td style={{ padding: '16px 20px', color: 'var(--accent-emerald)', fontWeight: 600 }}>Plain English conversations</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '16px 20px', fontWeight: 600 }}>Time to First Dashboard</td>
                <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>Hours to days of manual modeling</td>
                <td style={{ padding: '16px 20px', color: 'var(--accent-emerald)', fontWeight: 600 }}>Under 5 seconds on upload</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '16px 20px', fontWeight: 600 }}>Math Accuracy</td>
                <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>Prone to formula and join errors</td>
                <td style={{ padding: '16px 20px', color: 'var(--accent-emerald)', fontWeight: 600 }}>100% Deterministic Python Pandas</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '16px 20px', fontWeight: 600 }}>Data Cleaning</td>
                <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>Requires separate ETL pipeline</td>
                <td style={{ padding: '16px 20px', color: 'var(--accent-emerald)', fontWeight: 600 }}>Built-in AI Cleaning Studio</td>
              </tr>
              <tr>
                <td style={{ padding: '16px 20px', fontWeight: 600 }}>Executive Briefing</td>
                <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>Manual slide deck export</td>
                <td style={{ padding: '16px 20px', color: 'var(--accent-emerald)', fontWeight: 600 }}>1-Click PDF & Print Briefing</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. Enterprise Trust & Security Badges */}
      <section style={{ maxWidth: '980px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '32px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <ShieldCheck size={20} color="var(--accent-emerald)" />
            <span>SOC2 Type II Certified Process</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <Lock size={20} color="var(--accent-primary)" />
            <span>Zero Data Retention for LLM Training</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <Database size={20} color="var(--accent-cyan)" />
            <span>Encrypted In-Memory Processing</span>
          </div>
        </div>
      </section>

      {/* 6. Bottom Call to Action */}
      <section
        className="card"
        style={{
          maxWidth: '1000px',
          margin: '0 auto',
          padding: '60px 30px',
          textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.12) 0%, rgba(124, 58, 237, 0.12) 100%)',
          border: '1px solid var(--border-active)',
        }}
      >
        <h2 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '14px' }}>
          Ready to experience autonomous spreadsheet intelligence?
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto 28px auto' }}>
          Upload your data or try our preloaded sales dataset to start building executive dashboards in seconds.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <button
            onClick={onLaunchWorkspace}
            className="btn-primary"
            style={{ fontSize: '1.05rem', padding: '14px 32px', borderRadius: '12px' }}
          >
            <span>Get Started Free</span>
            <ArrowRight size={18} />
          </button>
          <button
            onClick={onExploreDemo}
            className="btn-secondary"
            style={{ fontSize: '1.05rem', padding: '14px 28px', borderRadius: '12px' }}
          >
            <Play size={16} color="var(--accent-primary)" />
            <span>Launch Interactive Demo</span>
          </button>
        </div>
      </section>
    </div>
  )
}
