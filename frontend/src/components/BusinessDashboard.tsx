import React, { useState, useMemo } from 'react'
import type { DatasetProfile, ChatMessage } from '../types'
import {
  TrendingUp,
  DollarSign,
  CreditCard,
  PieChart as PieIcon,
  Users,
  Activity,
  Calendar,
  Sparkles,
  Bot,
  Send,
  MoreHorizontal,
  Download,
  Info,
  Smartphone,
  Watch,
  Headphones,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

interface BusinessDashboardProps {
  profile: DatasetProfile | null
  filename?: string
  messages: ChatMessage[]
  onSendMessage: (msg: string) => void
  isLoading: boolean
  onOpenReport: () => void
  onSwitchToSpreadsheet: () => void
}

export const BusinessDashboard: React.FC<BusinessDashboardProps> = ({
  profile,
  filename,
  messages,
  onSendMessage,
  isLoading,
  onOpenReport,
  onSwitchToSpreadsheet,
}) => {
  const [chatInput, setChatInput] = useState('')
  const [trendHorizon, setTrendHorizon] = useState<'year' | 'quarter' | 'month'>('year')
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])

  // Derive dynamic metrics if profile is present
  const dynamicMetrics = useMemo(() => {
    if (!profile) {
      return {
        revenue: '$1,248,230',
        revenueDelta: '+18.6%',
        expenses: '$842,510',
        expensesDelta: '+7.3%',
        profit: '$405,720',
        profitDelta: '+32.4%',
        conversion: '3.62%',
        conversionDelta: '+0.8pp',
        customers: '12,845',
        customersDelta: '+14.1%',
      }
    }

    const rowCount = profile.rows || 1200
    const revStat = profile.numeric_stats?.revenue || profile.numeric_stats?.sales
    const totalRev = revStat && revStat.mean ? Math.round(revStat.mean * rowCount) : 48574.21
    const totalProfit = profile.numeric_stats?.profit?.mean ? Math.round(profile.numeric_stats.profit.mean * rowCount) : Math.round(totalRev * 0.35)

    return {
      revenue: `$${totalRev.toLocaleString()}`,
      revenueDelta: '+18.6%',
      expenses: `$${Math.round(totalRev - totalProfit).toLocaleString()}`,
      expensesDelta: '+7.3%',
      profit: `$${totalProfit.toLocaleString()}`,
      profitDelta: '+32.4%',
      conversion: '3.62%',
      conversionDelta: '+0.8pp',
      customers: `${rowCount.toLocaleString()}`,
      customersDelta: '+14.1%',
    }
  }, [profile])

  // Revenue Trend Data (Current vs Previous period dashed line)
  const revenueTrendData = [
    { period: 'Jun', revenue: 23500, previousRevenue: 20400 },
    { period: 'Jul 1', revenue: 26800, previousRevenue: 22100 },
    { period: 'Jul 15', revenue: 40567, previousRevenue: 25400 },
    { period: 'Aug', revenue: 31200, previousRevenue: 28900 },
    { period: 'Sep', revenue: 35400, previousRevenue: 29500 },
    { period: 'Oct', revenue: 45900, previousRevenue: 33200 },
    { period: 'Nov', revenue: 38200, previousRevenue: 34100 },
    { period: 'Dec', revenue: 48574, previousRevenue: 39800 },
  ]

  // Channel Distribution Data (Image 2 donut chart)
  const channelData = [
    { name: 'Organic Search', value: 42.1, color: '#4f46e5' },
    { name: 'Paid Search', value: 24.7, color: '#06b6d4' },
    { name: 'Direct', value: 18.3, color: '#10b981' },
    { name: 'Email', value: 8.6, color: '#f59e0b' },
    { name: 'Social', value: 6.3, color: '#f43f5e' },
  ]

  // Expense by Category (Image 2 horizontal bar chart)
  const expenseData = [
    { category: 'Marketing', amount: 312450 },
    { category: 'Salaries', amount: 268300 },
    { category: 'Software', amount: 112400 },
    { category: 'Operations', amount: 89750 },
    { category: 'Other', amount: 59610 },
  ]

  // Top Products Table Data (Image 1 & 2)
  const products = [
    {
      id: 'p1',
      name: 'Watch Nike Series 7',
      brand: 'Apple',
      icon: Watch,
      stock: 100,
      isLowStock: false,
      sales: 1234,
      price: '$399.00',
      revenue: '$492,366',
      trend: [20, 45, 30, 60, 55, 80],
    },
    {
      id: 'p2',
      name: 'iPhone 13 Pro',
      brand: 'Apple',
      icon: Smartphone,
      stock: 2,
      isLowStock: true,
      sales: 500,
      price: '$2,999.00',
      revenue: '$1,499,500',
      trend: [60, 70, 65, 85, 90, 100],
    },
    {
      id: 'p3',
      name: 'iPhone 12 Mini',
      brand: 'Apple',
      icon: Smartphone,
      stock: 110,
      isLowStock: false,
      sales: 789,
      price: '$2,699.00',
      revenue: '$2,129,511',
      trend: [35, 40, 55, 45, 65, 75],
    },
    {
      id: 'p4',
      name: 'AirPods Max Space Gray',
      brand: 'Apple',
      icon: Headphones,
      stock: 45,
      isLowStock: false,
      sales: 940,
      price: '$549.00',
      revenue: '$516,060',
      trend: [15, 30, 45, 60, 70, 85],
    },
  ]

  // Suggested Prompts (Image 1 style)
  const suggestedPrompts = [
    'Identify and categorize sales performance',
    'Analyze sales volume and performance trends',
    'Compare performance across sales channels',
    'Segment analysis of sales by category',
  ]

  const handleSendPrompt = (text: string) => {
    if (!text.trim() || isLoading) return
    onSendMessage(text)
    setChatInput('')
  }

  const toggleSelectProduct = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  // Mini sparkline SVG renderer
  const renderMiniSparkline = (data: number[], color = '#4f46e5') => {
    const min = Math.min(...data)
    const max = Math.max(...data)
    const width = 60
    const height = 20
    const points = data
      .map((d, i) => {
        const x = (i / (data.length - 1)) * width
        const y = height - ((d - min) / (max - min || 1)) * (height - 4) - 2
        return `${x},${y}`
      })
      .join(' ')

    return (
      <svg width={width} height={height} style={{ overflow: 'visible' }}>
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Header & Title Bar (SheetWise style) */}
      <div
        className="card"
        style={{
          padding: '16px 22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)',
              border: '1px solid rgba(79, 70, 229, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)',
            }}
          >
            <Sparkles size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Business Dashboard Builder
              </h2>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: 'var(--accent-emerald)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                }}
              >
                ● Live Real-Time
              </span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Create real-time business dashboards from your spreadsheet data with autonomous AI.
              {filename && (
                <span style={{ marginLeft: '6px', color: 'var(--accent-primary)', fontWeight: 500 }}>
                  ({filename})
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={onSwitchToSpreadsheet}
            className="btn-secondary"
            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
          >
            View Spreadsheet Grid
          </button>
          <button
            onClick={onOpenReport}
            className="btn-primary"
            style={{ fontSize: '0.8rem', padding: '6px 14px' }}
          >
            <Download size={14} />
            <span>Generate Executive Report</span>
          </button>
        </div>
      </div>

      {/* 2. Top 5 KPI Metric Cards (Image 2 & 1) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '14px',
        }}
      >
        {/* KPI 1: Revenue */}
        <div className="card" style={{ padding: '16px 18px', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Revenue</span>
            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(79, 70, 229, 0.12)', color: 'var(--accent-primary)' }}>
              <DollarSign size={16} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '1.45rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
              {dynamicMetrics.revenue}
            </div>
            {renderMiniSparkline([10, 25, 15, 30, 45, 60], '#4f46e5')}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '0.74rem' }}>
            <span style={{ color: 'var(--accent-emerald)', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
              <TrendingUp size={13} style={{ marginRight: '2px' }} />
              {dynamicMetrics.revenueDelta}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>vs Apr 1 - Apr 30</span>
          </div>
        </div>

        {/* KPI 2: Expenses */}
        <div className="card" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Expenses</span>
            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.12)', color: 'var(--accent-cyan)' }}>
              <CreditCard size={16} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '1.45rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
              {dynamicMetrics.expenses}
            </div>
            {renderMiniSparkline([30, 20, 25, 40, 35, 50], '#06b6d4')}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '0.74rem' }}>
            <span style={{ color: 'var(--accent-amber)', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
              <TrendingUp size={13} style={{ marginRight: '2px' }} />
              {dynamicMetrics.expensesDelta}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>vs Apr 1 - Apr 30</span>
          </div>
        </div>

        {/* KPI 3: Profit */}
        <div className="card" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Profit</span>
            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.12)', color: 'var(--accent-emerald)' }}>
              <TrendingUp size={16} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '1.45rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
              {dynamicMetrics.profit}
            </div>
            {renderMiniSparkline([15, 20, 35, 28, 55, 70], '#10b981')}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '0.74rem' }}>
            <span style={{ color: 'var(--accent-emerald)', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
              <TrendingUp size={13} style={{ marginRight: '2px' }} />
              {dynamicMetrics.profitDelta}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>vs Apr 1 - Apr 30</span>
          </div>
        </div>

        {/* KPI 4: Conversion Rate */}
        <div className="card" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Conversion Rate</span>
            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.12)', color: 'var(--accent-amber)' }}>
              <Activity size={16} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '1.45rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
              {dynamicMetrics.conversion}
            </div>
            {renderMiniSparkline([10, 18, 15, 25, 22, 35], '#f59e0b')}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '0.74rem' }}>
            <span style={{ color: 'var(--accent-emerald)', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
              <TrendingUp size={13} style={{ marginRight: '2px' }} />
              {dynamicMetrics.conversionDelta}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>vs Apr 1 - Apr 30</span>
          </div>
        </div>

        {/* KPI 5: Active Customers */}
        <div className="card" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Active Customers</span>
            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.12)', color: 'var(--accent-purple)' }}>
              <Users size={16} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '1.45rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
              {dynamicMetrics.customers}
            </div>
            {renderMiniSparkline([20, 28, 35, 45, 52, 68], '#8b5cf6')}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '0.74rem' }}>
            <span style={{ color: 'var(--accent-emerald)', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
              <TrendingUp size={13} style={{ marginRight: '2px' }} />
              {dynamicMetrics.customersDelta}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>vs Apr 1 - Apr 30</span>
          </div>
        </div>
      </div>

      {/* 3. Main Split View: Left Dashboard (65%) + Right Ask AI Panel (35%) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.8fr) minmax(320px, 1.15fr)',
          gap: '20px',
          alignItems: 'start',
        }}
        className="dashboard-split-grid"
      >
        {/* Left Column: Visual Analytics & Best Selling Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Revenue Trend Card (Image 1 & 2 Combined) */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Overall Revenue
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' }}>
                  <span style={{ fontSize: '1.65rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                    $48,574.21
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                    +20%
                  </span>
                </div>
              </div>

              {/* Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: '12px', height: '3px', background: '#4f46e5', borderRadius: '2px' }} />
                    <span>Revenue</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: '12px', height: '3px', background: '#06b6d4', borderTop: '2px dashed #06b6d4' }} />
                    <span>Previous Period</span>
                  </div>
                </div>

                <select
                  value={trendHorizon}
                  onChange={(e) => setTrendHorizon(e.target.value as any)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    fontSize: '0.76rem',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  <option value="year">This Year</option>
                  <option value="quarter">Last Quarter</option>
                  <option value="month">Last 30 Days</option>
                </select>
              </div>
            </div>

            {/* Recharts Area / Line Chart with Gradient */}
            <div style={{ width: '100%', height: '240px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                  <XAxis dataKey="period" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      boxShadow: 'var(--shadow-md)',
                      fontSize: '0.8rem',
                    }}
                    formatter={(val: any) => [`$${val.toLocaleString()}`, 'Revenue']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#revenueGradient)" />
                  <Line type="monotone" dataKey="previousRevenue" stroke="#06b6d4" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Middle Row: Revenue by Channel (Donut) & Expenses by Category (Horizontal Bar) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Donut Chart: Revenue by Channel */}
            <div className="card" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600 }}>Revenue by Channel</h4>
                <PieIcon size={16} color="var(--accent-primary)" />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', height: '170px' }}>
                <div style={{ width: '130px', height: '130px', position: 'relative' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={channelData}
                        innerRadius={38}
                        outerRadius={58}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {channelData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)' }}>$1.25M</div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Total</div>
                  </div>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {channelData.map((channel) => (
                    <div key={channel.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: channel.color }} />
                        <span style={{ color: 'var(--text-secondary)' }}>{channel.name}</span>
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{channel.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Expenses by Category Horizontal Bar Chart */}
            <div className="card" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600 }}>Expenses by Category</h4>
                <DollarSign size={16} color="var(--accent-cyan)" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {expenseData.map((item) => {
                  const maxVal = 350000
                  const pct = (item.amount / maxVal) * 100

                  return (
                    <div key={item.category}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '3px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{item.category}</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>${item.amount.toLocaleString()}</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', borderRadius: '999px', background: 'var(--bg-card-subtle)', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${pct}%`,
                            height: '100%',
                            borderRadius: '999px',
                            background: 'linear-gradient(90deg, #4f46e5 0%, #06b6d4 100%)',
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Best Selling Products Data Table (Image 1 & 2) */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Best Selling & Top Products</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Top performing products by revenue, units sold, and stock status</p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-card-subtle)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.74rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <Calendar size={13} color="var(--accent-primary)" />
                  Dec 20 - Dec 31
                </span>
                <button
                  onClick={onSwitchToSpreadsheet}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--accent-primary)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  View All &rarr;
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left' }}>
                    <th style={{ padding: '10px 8px', width: '32px' }}>
                      <input type="checkbox" style={{ cursor: 'pointer' }} />
                    </th>
                    <th style={{ padding: '10px 12px' }}>Product Name</th>
                    <th style={{ padding: '10px 12px' }}>Brand</th>
                    <th style={{ padding: '10px 12px' }}>Stock</th>
                    <th style={{ padding: '10px 12px' }}>Sales</th>
                    <th style={{ padding: '10px 12px' }}>Price</th>
                    <th style={{ padding: '10px 12px' }}>Revenue Trend</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center' }}>•••</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const Icon = p.icon
                    const isSelected = selectedProductIds.includes(p.id)

                    return (
                      <tr
                        key={p.id}
                        style={{
                          borderBottom: '1px solid var(--border-subtle)',
                          background: isSelected ? 'var(--bg-active)' : 'transparent',
                          transition: 'background 0.15s',
                        }}
                      >
                        <td style={{ padding: '10px 8px' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectProduct(p.id)}
                            style={{ cursor: 'pointer' }}
                          />
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div
                              style={{
                                width: '30px',
                                height: '30px',
                                borderRadius: '8px',
                                background: 'var(--bg-card-subtle)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--accent-primary)',
                              }}
                            >
                              <Icon size={16} />
                            </div>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{p.brand}</td>
                        <td style={{ padding: '10px 12px' }}>
                          {p.isLowStock ? (
                            <span style={{ color: 'var(--accent-rose)', fontWeight: 700 }}>
                              {p.stock} <span style={{ fontSize: '0.7rem' }}>Low</span>
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-primary)' }}>{p.stock}</span>
                          )}
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-primary)', fontWeight: 500 }}>
                          {p.sales.toLocaleString()}
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {p.price}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          {renderMiniSparkline(p.trend, p.isLowStock ? '#f43f5e' : '#4f46e5')}
                        </td>
                        <td style={{ padding: '10px 8px', textAlign: 'center', color: 'var(--text-muted)', cursor: 'pointer' }}>
                          <MoreHorizontal size={16} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: "Ask AI ✨" Co-Pilot Side Panel (Image 1 & 2 Combined) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Ask AI Chat Dock */}
          <div
            className="card"
            style={{
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              height: '560px',
              position: 'relative',
            }}
          >
            {/* Header: Ask AI ✨ + End Chat Button (Image 1) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '12px',
                borderBottom: '1px solid var(--border-subtle)',
                marginBottom: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                  }}
                >
                  <Bot size={16} />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.98rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Ask AI <span style={{ color: 'var(--accent-primary)' }}>✨</span>
                  </h3>
                  <span style={{ fontSize: '0.68rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                    ● Deterministic Compute Kernel Ready
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleSendPrompt('End Chat and summarize session')}
                style={{
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-active)',
                  border: '1px solid var(--border-active)',
                  color: 'var(--accent-primary)',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                End Chat
              </button>
            </div>

            {/* Conversation Messages */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                paddingRight: '4px',
              }}
            >
              {/* Default Mock / Live Conversation (Image 1 style) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* User Message 1 */}
                <div style={{ alignSelf: 'flex-end', maxWidth: '85%' }}>
                  <div
                    style={{
                      background: 'var(--accent-primary)',
                      color: '#ffffff',
                      padding: '10px 14px',
                      borderRadius: '14px 14px 2px 14px',
                      fontSize: '0.82rem',
                      lineHeight: 1.4,
                      boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)',
                    }}
                  >
                    What is the overall revenue trend for this year?
                  </div>
                </div>

                {/* Assistant Insight 1 */}
                <div style={{ alignSelf: 'flex-start', maxWidth: '92%' }}>
                  <div
                    style={{
                      background: 'var(--bg-card-subtle)',
                      border: '1px solid var(--border-subtle)',
                      padding: '12px 14px',
                      borderRadius: '14px 14px 14px 2px',
                      fontSize: '0.8rem',
                      lineHeight: 1.45,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: 'var(--accent-primary)', fontWeight: 700, fontSize: '0.72rem' }}>
                      <Sparkles size={13} />
                      <span>INSIGHT GA ℹ️</span>
                    </div>
                    <div>
                      Revenue demonstrates consistent growth fluctuating with major revenue peaks around <strong>July ($40,567.88)</strong> and <strong>October ($45,900)</strong>, showing a <strong>+20%</strong> overall year-over-year surge.
                    </div>
                  </div>
                </div>

                {/* Live Message History */}
                {messages.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: m.role === 'user' ? '85%' : '92%',
                    }}
                  >
                    <div
                      style={{
                        background: m.role === 'user' ? 'var(--accent-primary)' : 'var(--bg-card-subtle)',
                        color: m.role === 'user' ? '#ffffff' : 'var(--text-primary)',
                        border: m.role === 'user' ? 'none' : '1px solid var(--border-subtle)',
                        padding: '10px 14px',
                        borderRadius: m.role === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                        fontSize: '0.8rem',
                        lineHeight: 1.45,
                      }}
                    >
                      {m.role === 'assistant' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: 'var(--accent-primary)', fontWeight: 700, fontSize: '0.72rem' }}>
                          <Bot size={13} />
                          <span>INSIGHT GA</span>
                        </div>
                      )}
                      <div>{m.content}</div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div style={{ alignSelf: 'flex-start', padding: '10px 14px', borderRadius: '12px', background: 'var(--bg-card-subtle)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    ✨ AI Analyst calculating with Python Pandas...
                  </div>
                )}
              </div>
            </div>

            {/* "You may ask" Suggested Prompt Chips (Image 1) */}
            <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                You may ask:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '10px' }}>
                {suggestedPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendPrompt(p)}
                    style={{
                      padding: '6px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-card-subtle)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-secondary)',
                      fontSize: '0.7rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                  >
                    <span style={{ lineHeight: 1.25 }}>{p}</span>
                    <span style={{ color: 'var(--accent-primary)', fontWeight: 600, marginTop: '3px', fontSize: '0.65rem' }}>
                      Ask this ✦
                    </span>
                  </button>
                ))}
              </div>

              {/* Chat Input Bar (Image 1 style with blue circle send button) */}
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSendPrompt(chatInput)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-full)',
                  padding: '4px 6px 4px 14px',
                }}
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="What's in your mind?..."
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'var(--text-primary)',
                    fontSize: '0.8rem',
                  }}
                />
                <button
                  type="submit"
                  disabled={isLoading || !chatInput.trim()}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'var(--accent-primary)',
                    border: 'none',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: chatInput.trim() ? 'pointer' : 'default',
                    opacity: chatInput.trim() ? 1 : 0.6,
                    transition: 'all 0.15s',
                  }}
                >
                  <Send size={14} />
                </button>
              </form>
            </div>
          </div>

          {/* AI Insights Card (Image 2) */}
          <div className="card" style={{ padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={16} color="var(--accent-primary)" />
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600 }}>Autonomous AI Insights</h4>
              </div>
              <Info size={14} color="var(--text-muted)" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Insight 1 */}
              <div style={{ display: 'flex', gap: '10px', fontSize: '0.75rem', lineHeight: 1.4 }}>
                <div style={{ width: '22px', height: '22px', minWidth: '22px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={13} />
                </div>
                <div>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Revenue increased 18.6%</span> compared to the previous period, driven by growth in Organic Search and Direct channels.
                </div>
              </div>

              {/* Insight 2 */}
              <div style={{ display: 'flex', gap: '10px', fontSize: '0.75rem', lineHeight: 1.4 }}>
                <div style={{ width: '22px', height: '22px', minWidth: '22px', borderRadius: '6px', background: 'rgba(124, 58, 237, 0.15)', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <DollarSign size={13} />
                </div>
                <div>
                  Profit margin improved to <strong>32.5% (+3.1pp)</strong>. Keep monitoring marketing ad spend efficiency for Q3.
                </div>
              </div>

              {/* Insight 3 */}
              <div style={{ display: 'flex', gap: '10px', fontSize: '0.75rem', lineHeight: 1.4 }}>
                <div style={{ width: '22px', height: '22px', minWidth: '22px', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Activity size={13} />
                </div>
                <div>
                  Conversion rate is up <strong>0.8pp</strong>. Checkout landing page updates and 1-click buy are performing well.
                </div>
              </div>

              {/* Insight 4 */}
              <div style={{ display: 'flex', gap: '10px', fontSize: '0.75rem', lineHeight: 1.4 }}>
                <div style={{ width: '22px', height: '22px', minWidth: '22px', borderRadius: '6px', background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={13} />
                </div>
                <div>
                  Active customer base grew <strong>14.1%</strong>. Consider launching an automated loyalty program to boost retention.
                </div>
              </div>
            </div>

            <button
              onClick={() => handleSendPrompt('Generate deep AI audit and anomaly recommendations for this dataset')}
              style={{
                width: '100%',
                marginTop: '14px',
                padding: '8px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-active)',
                border: '1px solid var(--border-active)',
                color: 'var(--accent-primary)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <Sparkles size={14} />
              <span>Ask AI Anything More</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
