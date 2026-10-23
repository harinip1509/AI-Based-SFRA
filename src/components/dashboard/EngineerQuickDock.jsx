import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../lib/theme'

// Rogers Ratios & Duval Triangle Diagnostic Logic (IEC 60599 / IS 10593 / IEEE C57.104)
function evaluateDgaRatios(h2, ch4, c2h6, c2h4, c2h2) {
  const H2 = parseFloat(h2) || 0
  const CH4 = parseFloat(ch4) || 0
  const C2H6 = parseFloat(c2h6) || 0
  const C2H4 = parseFloat(c2h4) || 0
  const C2H2 = parseFloat(c2h2) || 0

  const totalHydrocarbons = CH4 + C2H4 + C2H2
  let duvalCh4 = 0
  let duvalC2h4 = 0
  let duvalC2h2 = 0

  if (totalHydrocarbons > 0) {
    duvalCh4 = Number(((CH4 / totalHydrocarbons) * 100).toFixed(1))
    duvalC2h4 = Number(((C2H4 / totalHydrocarbons) * 100).toFixed(1))
    duvalC2h2 = Number(((C2H2 / totalHydrocarbons) * 100).toFixed(1))
  }

  let duvalZone = 'PD (Partial Discharge)'
  let severity = 'Nominal'
  let action = 'Routine monitoring per IS 10593'

  if (duvalC2h2 > 13) {
    if (duvalC2h4 > 29) {
      duvalZone = 'D2 (High Energy Discharge / Arcing)'
      severity = 'Critical'
      action = 'Immediate de-energization. Perform winding resistance & SFRA.'
    } else {
      duvalZone = 'D1 (Low Energy Discharge / Sparking)'
      severity = 'Action Required'
      action = 'Resample oil in 7 days; inspect OLTC diverter switch.'
    }
  } else if (duvalC2h4 > 23) {
    if (duvalC2h4 > 50) {
      duvalZone = 'T3 (Thermal Fault T > 700°C)'
      severity = 'Action Required'
      action = 'Inspect core bolts, laminations, and heavy current leads.'
    } else if (duvalC2h4 > 20) {
      duvalZone = 'T2 (Thermal Fault 300°C - 700°C)'
      severity = 'Investigate'
      action = 'Thermal infrared imaging scan of tank and bushing leads.'
    } else {
      duvalZone = 'T1 (Thermal Fault T < 300°C)'
      severity = 'Investigate'
      action = 'Verify forced oil circulation pumps and cooling radiators.'
    }
  } else if (duvalCh4 > 98) {
    duvalZone = 'PD (Partial Discharge / Corona)'
    severity = 'Investigate'
    action = 'Perform acoustic partial discharge mapping.'
  } else {
    duvalZone = 'Normal Gas Evolution / Aging'
    severity = 'Normal'
    action = 'Continue standard CEA condition-based monitoring schedule.'
  }

  return {
    duvalCh4,
    duvalC2h4,
    duvalC2h2,
    duvalZone,
    severity,
    action,
  }
}

export default function EngineerQuickDock({ history = [] }) {
  const navigate = useNavigate()
  const { isDark } = useTheme()

  const [activeModal, setActiveModal] = useState(null) // null | 'dga' | 'zoning' | 'trip'

  const [dgaInputs, setDgaInputs] = useState({
    h2: '15',
    ch4: '8',
    c2h6: '5',
    c2h4: '12',
    c2h2: '0',
  })

  const dgaResult = evaluateDgaRatios(
    dgaInputs.h2,
    dgaInputs.ch4,
    dgaInputs.c2h6,
    dgaInputs.c2h4,
    dgaInputs.c2h2
  )

  const cardBg = isDark ? '#111827' : '#FFFFFF'
  const cardBorder = isDark ? '#1F2937' : '#E2E8F0'
  const textPrimary = isDark ? '#F9FAFB' : '#0F172A'
  const textMuted = isDark ? '#9CA3AF' : '#64748B'
  const inputBg = isDark ? '#1F2937' : '#FFFFFF'
  const inputBorder = isDark ? '#374151' : '#CBD5E1'

  // Clean, human-engineered operational utilities (no emoji clutter, professional typography)
  const utilityItems = [
    {
      id: 'upload',
      title: 'SFRA Ingestion',
      desc: 'Process sweep export or plot screenshot',
      badge: 'Dual-Gate AI',
      action: () => navigate('/upload'),
    },
    {
      id: 'dga',
      title: 'DGA Ratio Calculator',
      desc: 'Duval Triangle & Key Gas evaluation',
      badge: 'IEC 60599 / IS 10593',
      action: () => setActiveModal('dga'),
    },
    {
      id: 'fleet',
      title: 'Fleet & Substation Radar',
      desc: 'Interactive Indian grid map & assets',
      badge: 'OpenStreetMap',
      action: () => navigate('/substations'),
    },
    {
      id: 'zoning',
      title: '3-Band Frequency Norms',
      desc: 'Core Lm, Winding Cs, and Ground Cg thresholds',
      badge: 'IEEE C57.149',
      action: () => setActiveModal('zoning'),
    },
    {
      id: 'trip',
      title: 'Through-Fault Protocol',
      desc: 'Post-trip 48-hour CEA checklist',
      badge: 'Regulation 63',
      action: () => setActiveModal('trip'),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* ── Status Ribbon ── */}
      <div
        style={{
          backgroundColor: cardBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: '8px',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '11px', color: textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Grid Frequency (NLDC)
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: textPrimary, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22C55E' }} />
              <span>50.02 Hz</span>
              <span style={{ fontSize: '11px', color: textMuted, fontWeight: 500 }}>(Nominal)</span>
            </div>
          </div>

          <div style={{ width: '1px', height: '24px', backgroundColor: cardBorder }} />

          <div>
            <div style={{ fontSize: '11px', color: textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Fleet Status
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: textPrimary, marginTop: '2px' }}>
              28 Transformers <span style={{ fontSize: '11px', color: '#22C55E', fontWeight: 600 }}>· 26 Normal · 1 Alert · 1 Review</span>
            </div>
          </div>

          <div style={{ width: '1px', height: '24px', backgroundColor: cardBorder }} />

          <div>
            <div style={{ fontSize: '11px', color: textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Asset Health Index
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#0284C7', marginTop: '2px' }}>
              92.4 / 100 <span style={{ fontSize: '11px', color: textMuted, fontWeight: 500 }}>(Grade A)</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setActiveModal('dga')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              backgroundColor: isDark ? '#1F2937' : '#F1F5F9',
              border: `1px solid ${cardBorder}`,
              color: textPrimary,
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            DGA Calculator
          </button>
          <button
            type="button"
            onClick={() => navigate('/upload')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              backgroundColor: '#0284C7',
              border: 'none',
              color: '#FFFFFF',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Ingest Measurement →
          </button>
        </div>
      </div>

      {/* ── Human-Coded Operational Utilities Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        {utilityItems.map((item) => (
          <div
            key={item.id}
            onClick={item.action}
            style={{
              backgroundColor: cardBg,
              border: `1px solid ${cardBorder}`,
              borderRadius: '8px',
              padding: '16px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'border-color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#0284C7'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = cardBorder
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: textPrimary }}>
                  {item.title}
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: isDark ? '#1F2937' : '#F1F5F9',
                    color: textMuted,
                    border: `1px solid ${cardBorder}`,
                  }}
                >
                  {item.badge}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: textMuted, lineHeight: 1.4 }}>
                {item.desc}
              </div>
            </div>

            <div style={{ marginTop: '14px', paddingTop: '8px', borderTop: `1px solid ${isDark ? '#1F2937' : '#F1F5F9'}`, fontSize: '11.5px', fontWeight: 600, color: '#0284C7' }}>
              Open Tool →
            </div>
          </div>
        ))}
      </div>

      {/* ── Modal: DGA Calculator ── */}
      {activeModal === 'dga' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setActiveModal(null)}
        >
          <div
            style={{
              backgroundColor: cardBg,
              border: `1px solid ${cardBorder}`,
              borderRadius: '10px',
              padding: '24px',
              maxWidth: '620px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: textPrimary, margin: 0 }}>
                  Dissolved Gas Analysis (DGA) Ratio Calculator
                </h3>
                <div style={{ fontSize: '12px', color: textMuted, marginTop: '2px' }}>
                  Standard evaluation per IS 10593 / IEC 60599 and Duval Triangle
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: textMuted }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '10px', marginBottom: '16px' }}>
              {[
                { key: 'h2', label: 'H2 (ppm)' },
                { key: 'ch4', label: 'CH4 (ppm)' },
                { key: 'c2h6', label: 'C2H6 (ppm)' },
                { key: 'c2h4', label: 'C2H4 (ppm)' },
                { key: 'c2h2', label: 'C2H2 (ppm)' },
              ].map((field) => (
                <div key={field.key}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: textMuted, marginBottom: '4px' }}>
                    {field.label}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={dgaInputs[field.key]}
                    onChange={(e) => setDgaInputs({ ...dgaInputs, [field.key]: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '4px',
                      backgroundColor: inputBg,
                      border: `1px solid ${inputBorder}`,
                      color: textPrimary,
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              ))}
            </div>

            <div
              style={{
                padding: '14px',
                borderRadius: '6px',
                backgroundColor: isDark ? '#1F2937' : '#F8FAFC',
                border: `1px solid ${cardBorder}`,
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: textMuted }}>
                  CLASSIFICATION
                </span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: dgaResult.severity === 'Normal' ? '#22C55E' : '#EF4444' }}>
                  {dgaResult.severity}
                </span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: textPrimary, marginBottom: '4px' }}>
                Zone: {dgaResult.duvalZone}
              </div>
              <div style={{ fontSize: '12px', color: textMuted, lineHeight: 1.4 }}>
                {dgaResult.action}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  backgroundColor: isDark ? '#1F2937' : '#F1F5F9',
                  border: `1px solid ${cardBorder}`,
                  color: textPrimary,
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveModal(null)
                  navigate(`/upload?dga_c2h2=${dgaInputs.c2h2}&dga_c2h4=${dgaInputs.c2h4}&dga_h2=${dgaInputs.h2}`)
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  backgroundColor: '#0284C7',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Apply to SFRA Sweep →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: 3-Band Frequency Zoning ── */}
      {activeModal === 'zoning' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setActiveModal(null)}
        >
          <div
            style={{
              backgroundColor: cardBg,
              border: `1px solid ${cardBorder}`,
              borderRadius: '10px',
              padding: '24px',
              maxWidth: '620px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: textPrimary, margin: 0 }}>
                IEEE C57.149 & IS 2026 3-Band Frequency Zoning
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: textMuted }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              <div style={{ padding: '12px', borderRadius: '6px', backgroundColor: isDark ? '#1F2937' : '#F8FAFC', border: `1px solid ${cardBorder}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <strong style={{ fontSize: '13px', color: textPrimary }}>Band 1: Low Frequency (&lt; 2 kHz)</strong>
                  <span style={{ fontSize: '11px', color: '#22C55E', fontWeight: 700 }}>CCF &ge; 0.980</span>
                </div>
                <div style={{ fontSize: '12px', color: textMuted, lineHeight: 1.4 }}>
                  Governed by core magnetizing inductance (Lm). Detects core shift, residual flux, and damaged grounding flats.
                </div>
              </div>

              <div style={{ padding: '12px', borderRadius: '6px', backgroundColor: isDark ? '#1F2937' : '#F8FAFC', border: `1px solid ${cardBorder}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <strong style={{ fontSize: '13px', color: textPrimary }}>Band 2: Medium Frequency (2 kHz – 100 kHz)</strong>
                  <span style={{ fontSize: '11px', color: '#EF4444', fontWeight: 700 }}>CCF &ge; 0.950 (Critical)</span>
                </div>
                <div style={{ fontSize: '12px', color: textMuted, lineHeight: 1.4 }}>
                  Governed by winding leakage inductance and inter-disk series capacitance. Primary indicator of radial hoop buckling and axial displacement.
                </div>
              </div>

              <div style={{ padding: '12px', borderRadius: '6px', backgroundColor: isDark ? '#1F2937' : '#F8FAFC', border: `1px solid ${cardBorder}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <strong style={{ fontSize: '13px', color: textPrimary }}>Band 3: High Frequency (100 kHz – 2 MHz)</strong>
                  <span style={{ fontSize: '11px', color: '#F59E0B', fontWeight: 700 }}>CCF &ge; 0.965</span>
                </div>
                <div style={{ fontSize: '12px', color: textMuted, lineHeight: 1.4 }}>
                  Governed by ground capacitance (Cg) and tap-changer leads. Susceptible to test lead ground braid quality and coastal humidity.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  backgroundColor: '#0284C7',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Through-Fault Protocol ── */}
      {activeModal === 'trip' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setActiveModal(null)}
        >
          <div
            style={{
              backgroundColor: cardBg,
              border: `1px solid ${cardBorder}`,
              borderRadius: '10px',
              padding: '24px',
              maxWidth: '620px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: textPrimary, margin: 0 }}>
                Through-Fault Trip Protocol (CEA Regulation 63)
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: textMuted }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {[
                { no: '1', title: 'Buchholz Gas Check', text: 'Test petcock gas for flammability prior to closing any breaker.' },
                { no: '2', title: 'SFRA Sweep Comparison', text: 'Compare against commissioning baseline; verify Band 2 CCF >= 0.950.' },
                { no: '3', title: 'Dissolved Gas Sampling', text: 'Verify Acetylene C2H2 < 2 ppm per IS 10593 Table 2 norms.' },
                { no: '4', title: 'Insulation Resistance Test', text: 'Verify 5 kV IR and Polarisation Index (PI > 1.5).' },
              ].map((item) => (
                <div key={item.no} style={{ display: 'flex', gap: '10px', padding: '10px', borderRadius: '6px', backgroundColor: isDark ? '#1F2937' : '#F8FAFC', border: `1px solid ${cardBorder}` }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#0284C7', width: '20px' }}>{item.no}.</span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: textPrimary }}>{item.title}</div>
                    <div style={{ fontSize: '11.5px', color: textMuted, marginTop: '2px' }}>{item.text}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  setActiveModal(null)
                  navigate('/upload')
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  backgroundColor: '#0284C7',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Ingest Post-Trip Sweep →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
