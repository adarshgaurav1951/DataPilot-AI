import React from 'react'
import { ShieldCheck, Lock, Database, Trash2, EyeOff } from 'lucide-react'

export const PrivacyPage: React.FC = () => {
  return (
    <div style={{ maxWidth: '840px', margin: '0 auto', padding: '40px 20px 80px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '999px',
          background: 'rgba(16, 185, 129, 0.12)',
          color: '#34d399',
          fontSize: '0.82rem',
          fontWeight: 600,
          marginBottom: '16px',
        }}>
          <ShieldCheck size={16} />
          <span>Data Privacy & Security Commitment</span>
        </div>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '12px' }}>
          Your Data Remains <span className="gradient-text">Yours</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.98rem' }}>
          How DataPilot AI safeguards your spreadsheets, queries, and business intelligence.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="glass-panel" style={{ padding: '26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            <EyeOff size={20} color="#6366f1" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600 }}>Zero Foundation Model Training</h3>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            We strictly do not use your uploaded spreadsheets, proprietary business numbers, or analytical queries to train or fine-tune public foundation models. Your data is processed ephemerally for the purpose of answering your specific query.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            <Lock size={20} color="#06b6d4" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600 }}>Encryption in Transit and at Rest</h3>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            All communication with our FastAPI servers is encrypted using modern TLS (HTTPS). When stored on disk, files and database records are isolated behind multi-tenant access controls.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            <Database size={20} color="#10b981" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600 }}>Strict Tenant Isolation</h3>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Every dataset, cleaned transformation, and conversational thread is tied to your authenticated user identifier. Backend authorization checks enforce that no user can view or query another tenant's files.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            <Trash2 size={20} color="#f43f5e" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600 }}>Data Retention & Deletion</h3>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            You maintain full ownership of your data. You can delete datasets at any time, which permanently purges the stored files, profiles, and associated conversation logs from our storage.
          </p>
        </div>
      </div>
    </div>
  )
}
