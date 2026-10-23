import React from 'react'
import { Check, Sparkles } from 'lucide-react'

interface PricingPageProps {
  onSelectPlan: (plan: string) => void
  currentPlan?: string
}

export const PricingPage: React.FC<PricingPageProps> = ({ onSelectPlan, currentPlan = 'free' }) => {
  const plans = [
    {
      id: 'free',
      name: 'Free Demo',
      price: '₹0',
      period: 'forever',
      description: 'Ideal for testing features with sample datasets and small CSVs.',
      features: [
        'Up to 10 MB file uploads',
        'Max 5,000 rows per dataset',
        '25 AI queries per month',
        'Basic profiling & health audit',
        'Deduplication & imputation',
        'Standard interactive charts',
      ],
      cta: 'Current Plan',
      isPopular: false,
    },
    {
      id: 'starter',
      name: 'Starter',
      price: '₹299',
      period: 'per month',
      description: 'Perfect for shop owners, online sellers, and freelance analysts.',
      features: [
        'Up to 25 MB file uploads',
        'Max 50,000 rows per dataset',
        '250 AI queries per month',
        'Multi-sheet Excel workbook support',
        'Executive report generation',
        'Data cleaning studio with audit logs',
        'Export CSV & formatted HTML',
      ],
      cta: 'Upgrade to Starter',
      isPopular: true,
    },
    {
      id: 'pro',
      name: 'Professional',
      price: '₹999',
      period: 'per month',
      description: 'For growing businesses and BI professionals analyzing large datasets.',
      features: [
        'Up to 50 MB file uploads',
        'Max 150,000 rows per dataset',
        '1,000 AI queries per month',
        'Priority Python compute engine',
        'Reference PDF document RAG',
        'Unrestricted executive report exports',
        'Saved analysis history & threads',
        'Priority email support',
      ],
      cta: 'Upgrade to Pro',
      isPopular: false,
    },
    {
      id: 'enterprise',
      name: 'Business',
      price: 'Custom',
      period: 'tailored',
      description: 'For teams and organizations requiring multi-seat governance and custom APIs.',
      features: [
        '250 MB+ file uploads',
        'Custom row & column limits',
        'Unlimited AI analytical queries',
        'Multi-seat workspace & role access',
        'Custom database connector integrations',
        'Dedicated SLA & support engineer',
      ],
      cta: 'Contact Sales',
      isPopular: false,
    },
  ]

  return (
    <div style={{ maxWidth: '1140px', margin: '0 auto', padding: '40px 20px 80px 20px' }}>
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '999px',
          background: 'rgba(99, 102, 241, 0.12)',
          color: '#818cf8',
          fontSize: '0.82rem',
          fontWeight: 600,
          marginBottom: '16px',
        }}>
          <Sparkles size={14} />
          <span>Transparent Pricing &bull; Predictable Quotas</span>
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '12px' }}>
          Predictable Pricing for <span className="gradient-text">Every Scale</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '620px', margin: '0 auto' }}>
          Start with our free demo tier, then scale to paid plans as your spreadsheet analysis needs expand.
        </p>
      </div>

      {/* Pricing Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '24px',
        marginBottom: '60px',
      }}>
        {plans.map(plan => {
          const isCurrent = currentPlan.toLowerCase() === plan.id
          return (
            <div
              key={plan.id}
              className="glass-panel"
              style={{
                padding: '30px',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                border: plan.isPopular ? '1px solid rgba(99, 102, 241, 0.5)' : undefined,
                boxShadow: plan.isPopular ? '0 0 30px rgba(99, 102, 241, 0.2)' : undefined,
              }}
            >
              {plan.isPopular && (
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                  color: '#ffffff',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '3px 12px',
                  borderRadius: '999px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  Most Popular
                </div>
              )}

              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px' }}>{plan.name}</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', minHeight: '38px', marginBottom: '16px' }}>
                {plan.description}
              </p>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '24px' }}>
                <span style={{ fontSize: '2.4rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                  {plan.price}
                </span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>/{plan.period}</span>
              </div>

              <button
                onClick={() => onSelectPlan(plan.id)}
                disabled={isCurrent}
                className={plan.isPopular ? 'btn-primary' : 'btn-secondary'}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '0.88rem',
                  marginBottom: '28px',
                  opacity: isCurrent ? 0.6 : 1,
                  cursor: isCurrent ? 'default' : 'pointer',
                }}
              >
                {isCurrent ? 'Current Plan' : plan.cta}
              </button>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  What is included:
                </span>
                {plan.features.map((feat, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.85rem' }}>
                    <Check size={16} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Pricing FAQs */}
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '24px', textAlign: 'center' }}>
          Frequently Asked Questions
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '6px' }}>
              What counts as an AI analytical query?
            </h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Each question asked in the conversational workspace (e.g., "Which region has the highest revenue?") counts as one analysis. Failed queries or data profiling do not count toward your monthly quota.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '6px' }}>
              Are my spreadsheet files kept confidential?
            </h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Yes. Your uploaded files are isolated to your account, stored securely with encrypted access, and are never used to train public foundation models.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '6px' }}>
              How does billing and cancellation work?
            </h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Subscriptions are billed monthly. You can upgrade, downgrade, or cancel at any time directly from your account settings without penalties.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
