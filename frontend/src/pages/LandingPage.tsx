import React from 'react'
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
} from 'lucide-react'

interface LandingPageProps {
  onLaunchWorkspace: () => void
  onExploreDemo: () => void
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLaunchWorkspace,
  onExploreDemo,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '80px', paddingBottom: '60px' }}>
      {/* Hero Section */}
      <section style={{
        textAlign: 'center',
        paddingTop: '60px',
        paddingBottom: '40px',
        maxWidth: '900px',
        margin: '0 auto',
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          borderRadius: '999px',
          background: 'rgba(99, 102, 241, 0.12)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          color: '#818cf8',
          fontSize: '0.82rem',
          fontWeight: 600,
          marginBottom: '24px',
        }}>
          <Sparkles size={15} />
          <span>Deterministic AI Data Analyst &bull; Zero Hallucination Engine</span>
        </div>

        <h1 style={{
          fontSize: '3.2rem',
          fontWeight: 800,
          lineHeight: 1.15,
          letterSpacing: '-0.03em',
          marginBottom: '20px',
        }}>
          Turn Your Data Into <span className="gradient-text">Decisions</span>
        </h1>

        <p style={{
          fontSize: '1.15rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          maxWidth: '720px',
          margin: '0 auto 36px auto',
        }}>
          Upload your CSV and Excel sales spreadsheets. Ask questions in plain English, get guaranteed
          deterministic calculations powered by Python Pandas, interactive charts, and executive reports.
          No SQL or statistics degree required.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <button
            onClick={onLaunchWorkspace}
            className="btn-primary"
            style={{ fontSize: '1rem', padding: '14px 28px', borderRadius: '12px' }}
          >
            <span>Try DataPilot AI Free</span>
            <ArrowRight size={18} />
          </button>

          <button
            onClick={onExploreDemo}
            className="btn-secondary"
            style={{ fontSize: '1rem', padding: '14px 26px', borderRadius: '12px' }}
          >
            <FileSpreadsheet size={18} color="#38bdf8" />
            <span>Explore Demo Dataset</span>
          </button>
        </div>

        {/* Value Badges */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '28px',
          marginTop: '40px',
          fontSize: '0.82rem',
          color: 'var(--text-muted)',
          flexWrap: 'wrap',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={16} color="#10b981" /> No Python or SQL Required
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={16} color="#6366f1" /> Zero LLM Number Hallucinations
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Lock size={16} color="#06b6d4" /> 100% Private & Encrypted
          </span>
        </div>
      </section>

      {/* Feature Grid */}
      <section style={{ maxWidth: '1160px', margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '12px' }}>
            Everything You Need to Analyze Spreadsheets
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '600px', margin: '0 auto' }}>
            From raw messy files to boardroom-ready insights, DataPilot AI automates every step of the analytical pipeline.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
        }}>
          {/* Card 1 */}
          <div className="glass-panel" style={{ padding: '28px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(56, 189, 248, 0.12)',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '18px',
            }}>
              <FileSpreadsheet size={22} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '8px' }}>
              CSV & Multi-Sheet Excel Uploads
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Upload single CSVs or multi-tab Excel workbooks up to 15MB. Automatically select specific worksheets and inspect raw records without altering original files.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-panel" style={{ padding: '28px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(99, 102, 241, 0.12)',
              color: '#818cf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '18px',
            }}>
              <Zap size={22} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '8px' }}>
              Automated Data Profiling
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Instant health audit: row counts, missing-value ratios, duplicate detection, inferred semantic types (numeric, categorical, datetime), and summary statistics.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-panel" style={{ padding: '28px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.12)',
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '18px',
            }}>
              <Wand2 size={22} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '8px' }}>
              Safe Cleaning Studio
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Non-destructive transformations: 1-click duplicate row removal, missing value imputation (mean, median, mode, constant), and column type conversions with audit logs.
            </p>
          </div>

          {/* Card 4 */}
          <div className="glass-panel" style={{ padding: '28px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(245, 158, 11, 0.12)',
              color: '#fbbf24',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '18px',
            }}>
              <Sparkles size={22} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '8px' }}>
              Deterministic AI Analyst
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Controlled LangGraph state machine. The LLM understands your intent and selects approved tools, while Python executes the exact mathematical calculation.
            </p>
          </div>

          {/* Card 5 */}
          <div className="glass-panel" style={{ padding: '28px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(168, 85, 247, 0.12)',
              color: '#c084fc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '18px',
            }}>
              <BarChart3 size={22} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '8px' }}>
              Interactive Charts & Visualizations
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Dynamic Bar, Line, and Pie charts generated on the fly. Switch seamlessly between visual charts and raw tabular numbers with one click.
            </p>
          </div>

          {/* Card 6 */}
          <div className="glass-panel" style={{ padding: '28px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(236, 72, 153, 0.12)',
              color: '#f472b6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '18px',
            }}>
              <FileText size={22} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '8px' }}>
              Executive Reporting & Exports
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Generate comprehensive executive reports containing health scores, numeric highlights, anomalies, and recommendations in Markdown and HTML.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section style={{ maxWidth: '960px', margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '12px' }}>
            How DataPilot AI Works
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Four simple steps from raw spreadsheet to executive insight.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          {[
            { step: '01', title: 'Upload File', desc: 'Drag and drop your .csv or .xlsx sales data.' },
            { step: '02', title: 'Health Audit', desc: 'Instant inspection of missing rows, duplicates & stats.' },
            { step: '03', title: 'Ask in English', desc: 'Query revenue, profit, trends, or comparisons.' },
            { step: '04', title: 'Export Insights', desc: 'Download CSV results, charts, or full executive reports.' },
          ].map((item, idx) => (
            <div key={idx} className="glass-panel" style={{ padding: '24px', position: 'relative' }}>
              <span style={{
                fontSize: '2rem',
                fontWeight: 800,
                color: 'rgba(99, 102, 241, 0.25)',
                fontFamily: 'var(--font-mono)',
                display: 'block',
                marginBottom: '10px',
              }}>
                {item.step}
              </span>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '6px' }}>{item.title}</h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section style={{
        textAlign: 'center',
        padding: '50px 30px',
        borderRadius: '24px',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        maxWidth: '1000px',
        margin: '0 auto',
      }}>
        <h2 style={{ fontSize: '2.2rem', fontWeight: 700, marginBottom: '16px' }}>
          Ready to Pilot Your Data?
        </h2>
        <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', maxWidth: '580px', margin: '0 auto 28px auto' }}>
          Experience deterministic data analysis with sample data or upload your own spreadsheet now.
        </p>
        <button
          onClick={onLaunchWorkspace}
          className="btn-primary"
          style={{ fontSize: '1rem', padding: '14px 32px', borderRadius: '12px' }}
        >
          <span>Launch Free Workspace</span>
          <ArrowRight size={18} />
        </button>
      </section>
    </div>
  )
}
