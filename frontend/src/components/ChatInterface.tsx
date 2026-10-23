import React, { useState, useRef, useEffect } from 'react'
import type { ChatMessage } from '../types'
import { InteractiveChart } from './InteractiveChart'
import {
  Send,
  Bot,
  User,
  Sparkles,
  Terminal,
  ArrowRight,
} from 'lucide-react'

interface ChatInterfaceProps {
  messages: ChatMessage[]
  onSendMessage: (msg: string) => void
  isLoading: boolean
  hasDataset: boolean
}

const PRESET_QUERIES = [
  'Which region generated the most revenue?',
  'Show monthly revenue trend over time',
  'Compare profit and revenue by category',
  'Audit data health, missing values and duplicates',
]

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isLoading,
  hasDataset,
}) => {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading || !hasDataset) return
    onSendMessage(input.trim())
    setInput('')
  }

  return (
    <div className="glass-panel" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '620px',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(255, 255, 255, 0.01)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            padding: '8px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            color: '#818cf8',
          }}>
            <Bot size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Data Analyst Agent</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Deterministic Pandas Execution • Zero Hallucination Engine
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
          <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 500 }}>Ready</span>
        </div>
      </div>

      {/* Message List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}>
        {messages.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            textAlign: 'center',
            padding: '20px',
            color: 'var(--text-secondary)',
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '20px',
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#818cf8',
              marginBottom: '16px',
            }}>
              <Sparkles size={28} />
            </div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Ask DataPilot Anything About Your Data
            </h4>
            <p style={{ fontSize: '0.85rem', maxWidth: '440px', color: 'var(--text-muted)', marginBottom: '24px' }}>
              All metrics and aggregates are computed directly by Python Pandas tools, with transparent execution logs and automatic charts.
            </p>

            {/* Preset Query Chips */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '420px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'left' }}>
                Suggested inquiries:
              </span>
              {PRESET_QUERIES.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(q)}
                  disabled={!hasDataset || isLoading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '0.82rem',
                    textAlign: 'left',
                    cursor: hasDataset ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s ease',
                    opacity: hasDataset ? 1 : 0.6,
                  }}
                  onMouseEnter={e => {
                    if (hasDataset) {
                      e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.5)'
                      e.currentTarget.style.background = 'rgba(99, 102, 241, 0.08)'
                    }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border-subtle)'
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                  }}
                >
                  <span>{q}</span>
                  <ArrowRight size={14} color="#818cf8" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className="animate-fade-in"
              style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: msg.role === 'user' ? '80%' : '100%',
              }}
            >
              {/* Avatar */}
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: msg.role === 'user' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                border: `1px solid ${msg.role === 'user' ? 'rgba(56, 189, 248, 0.3)' : 'rgba(99, 102, 241, 0.3)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: msg.role === 'user' ? '#38bdf8' : '#818cf8',
                flexShrink: 0,
              }}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>

              {/* Message Body */}
              <div style={{ flex: 1 }}>
                <div style={{
                  padding: '14px 18px',
                  borderRadius: '12px',
                  background: msg.role === 'user' ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(139, 92, 246, 0.25) 100%)' : 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${msg.role === 'user' ? 'rgba(99, 102, 241, 0.4)' : 'var(--border-subtle)'}`,
                  fontSize: '0.88rem',
                  lineHeight: 1.6,
                }}>
                  {/* Tool execution badge if present */}
                  {msg.tool_calls && msg.tool_calls.length > 0 && (
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px',
                      marginBottom: '10px',
                      paddingBottom: '10px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                    }}>
                      {msg.tool_calls.map((tc, tIdx) => (
                        <div
                          key={tIdx}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'rgba(0, 0, 0, 0.3)',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontFamily: 'var(--font-mono)',
                            color: '#34d399',
                            border: '1px solid rgba(16, 185, 129, 0.2)',
                          }}
                        >
                          <Terminal size={12} />
                          <span>Tool: {tc.tool}()</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Text content with simple markdown formatting */}
                  <div style={{ whiteSpace: 'pre-wrap' }}>
                    {msg.content}
                  </div>

                  {/* Render companion chart if present */}
                  {msg.chart_spec && (
                    <InteractiveChart spec={msg.chart_spec} />
                  )}

                  {/* RAG sources if present */}
                  {msg.rag_sources && msg.rag_sources.length > 0 && (
                    <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Reference Citations:
                      </span>
                      {msg.rag_sources.map((src, sIdx) => (
                        <div key={sIdx} style={{ fontSize: '0.75rem', color: '#818cf8', marginTop: '4px' }}>
                          📄 {src.filename} (Page {src.page_number})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}

        {/* Loading / Thinking State */}
        {isLoading && (
          <div className="animate-fade-in" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#818cf8',
            }}>
              <Bot size={16} />
            </div>
            <div style={{
              padding: '12px 18px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: 'var(--text-secondary)',
              fontSize: '0.85rem',
            }}>
              <span className="animate-pulse-glow" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1' }} />
              <span>Analyzing dataset with Python tools...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} style={{
        padding: '14px 20px',
        borderTop: '1px solid var(--border-subtle)',
        background: 'rgba(10, 14, 23, 0.7)',
        display: 'flex',
        gap: '10px',
      }}>
        <input
          type="text"
          placeholder={hasDataset ? "Ask a question (e.g. 'Which region generated the most revenue?')..." : "Please upload or load a sample dataset first..."}
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={!hasDataset || isLoading}
          style={{
            flex: 1,
            background: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            color: 'var(--text-primary)',
            fontSize: '0.88rem',
            outline: 'none',
            transition: 'border-color 0.2s ease',
          }}
          onFocus={e => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
          onBlur={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
        />
        <button
          type="submit"
          disabled={!hasDataset || !input.trim() || isLoading}
          className="btn-primary"
          style={{
            padding: '12px 18px',
            opacity: (!hasDataset || !input.trim() || isLoading) ? 0.5 : 1,
            cursor: (!hasDataset || !input.trim() || isLoading) ? 'not-allowed' : 'pointer',
          }}
        >
          <Send size={16} />
          <span>Ask</span>
        </button>
      </form>
    </div>
  )
}
