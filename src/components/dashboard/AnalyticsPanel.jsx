import { motion } from 'framer-motion'
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, Cell,
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'rgba(11,15,26,0.95)', border: '1px solid rgba(0,212,255,0.25)',
      borderRadius: '10px', padding: '12px 16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    }}>
      <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: '8px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.color, flexShrink: 0 }} />
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{p.name}:</span>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>{p.value}</span>
        </div>
      ))}
    </div>
  )
}

const StatPill = ({ label, value, color, sub }) => (
  <div style={{ padding: '16px 20px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(${color},0.15)` }}>
    <div style={{ fontSize: '22px', fontWeight: 900, color: `rgb(${color})`, lineHeight: 1, marginBottom: '4px' }}>{value}</div>
    <div style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
    {sub ? <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.28)', marginTop: '2px' }}>{sub}</div> : null}
  </div>
)

const monthKey = (timestamp) => {
  const d = new Date(typeof timestamp === 'number' ? timestamp : timestamp)
  if (Number.isNaN(d.getTime())) return null
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function AnalyticsPanel({ history = [] }) {
  const safeHistory = Array.isArray(history) ? history : []

  const monthlyMap = safeHistory.reduce((acc, item) => {
    const key = monthKey(item?.timestamp)
    if (!key) return acc
    if (!acc[key]) acc[key] = { month: key, uploads: 0, highRisk: 0 }
    acc[key].uploads += 1
    if (item?.classification === 'High Fault Risk') acc[key].highRisk += 1
    return acc
  }, {})

  const trendData = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month))
  const recentTrend = trendData.slice(-6)
  const displayTrend = recentTrend.length ? recentTrend : [{ month: 'No data', uploads: 0, highRisk: 0 }]

  const totalUploads = safeHistory.length
  const highRiskCount = safeHistory.filter((item) => item?.classification === 'High Fault Risk').length
  const normalCount = Math.max(0, totalUploads - highRiskCount)
  const highRiskPct = totalUploads ? Math.round((highRiskCount / totalUploads) * 100) : 0
  const avgUploadsPerMonth = trendData.length ? Math.round(totalUploads / trendData.length) : 0
  const faults = [
    { name: 'Normal', count: normalCount, color: '#00D4FF' },
    { name: 'High Risk', count: highRiskCount, color: '#FF5555' },
  ]
  const totalFaults = faults.reduce((s, f) => s + f.count, 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      style={{
        borderRadius: '20px',
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(20px)',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'rgba(108,99,255,0.12)', border: '1px solid rgba(108,99,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6C63FF' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M18 20V10M12 20V4M6 20v-6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', margin: 0 }}>Analytics Overview</h3>
        <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>Upload history</span>
      </div>
      <div style={{ padding: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: '12px', marginBottom: '28px' }}>
          <StatPill label="Total Uploads"  value={totalUploads}   color="0,212,255"   sub="all-time history" />
          <StatPill label="High Risk %"    value={`${highRiskPct}%`} color="255,85,85" sub="Above threshold" />
          <StatPill label="Normal Rate"    value={`${100-highRiskPct}%`} color="0,212,255" sub="Healthy units" />
          <StatPill label="Avg / Month"    value={avgUploadsPerMonth} color="108,99,255" sub="Upload cadence" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
              Upload Volume Trend
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={displayTrend} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="gradUploads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#00D4FF" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00D4FF" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="gradRisk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#FF5555" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#FF5555" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false}/>
                <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false}/>
                <Tooltip content={<CustomTooltip />}/>
                <Area type="monotone" dataKey="uploads"  name="Uploads"   stroke="#00D4FF" strokeWidth={2} fill="url(#gradUploads)" dot={false}/>
                <Area type="monotone" dataKey="highRisk" name="High Risk" stroke="#FF5555" strokeWidth={2} fill="url(#gradRisk)"    dot={false} strokeDasharray="4 2"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
              Fault Classification Breakdown
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={faults} margin={{ top: 4, right: 4, bottom: 0, left: -20 }} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false}/>
                <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false}/>
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }}/>
                <Bar dataKey="count" name="Count" radius={[4,4,0,0]}>
                  {faults.map((entry, i) => (
                    <Cell key={i} fill={entry.color} opacity={0.85}/>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '14px' }}>
              {faults.map((f) => (
                <div key={f.name} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: f.color, flexShrink: 0 }} />
                  <span style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.45)' }}>
                    {f.name} <span style={{ color: 'rgba(255,255,255,0.25)' }}>({totalFaults ? Math.round((f.count / totalFaults) * 100) : 0}%)</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

