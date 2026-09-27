import React, { useState } from 'react';
import {
  Layers,
  ArrowRight,
  Shield,
  Lock,
  Database,
  Cloud,
  AlertTriangle,
  CheckCircle2,
  PieChart,
  Activity,
  FileText,
  Sparkles,
  BarChart3,
  Calendar,
  Zap,
  TrendingUp,
  GitBranch,
} from 'lucide-react';

const TEMPLATES = [
  { id: 'chevrons', label: 'Flow Chevrons (01-04)', icon: ArrowRight },
  { id: 'graph', label: 'Comparative Bar Graph', icon: BarChart3 },
  { id: 'flowchart', label: 'Sequential Flowchart Graph', icon: GitBranch },
  { id: 'circular', label: 'Circular Petal Wheel', icon: PieChart },
  { id: 'metrics', label: 'Metric Stat Dials', icon: Activity },
  { id: 'roadmap', label: 'Milestone Timeline', icon: Calendar },
  { id: 'cards', label: 'Data Feature Cards', icon: Layers },
];

export function InfographicRenderer({ content = '', defaultTemplate = 'chevrons' }) {
  const [activeTemplate, setActiveTemplate] = useState(defaultTemplate || 'chevrons');
  const [viewMode, setViewMode] = useState('visual'); // 'visual' | 'markdown'

  // Extract structured steps / items from content or use high-impact defaults
  const parsedData = parseInfographicData(content);

  return (
    <div
      style={{
        background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.35)',
        color: '#f8fafc',
      }}
    >
      {/* Top Header Bar & Template Switcher */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: '16px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}
          >
            <Sparkles size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
              Infographic Visual Synthesizer
            </h3>
            <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
              Multi-Template Visual Renderer • Freepik Inspired Design
            </span>
          </div>
        </div>

        {/* View mode toggle (Visual vs Markdown) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              display: 'flex',
              background: 'rgba(0, 0, 0, 0.35)',
              padding: '3px',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode('visual')}
              style={{
                background: viewMode === 'visual' ? '#0284c7' : 'transparent',
                border: 'none',
                color: viewMode === 'visual' ? '#ffffff' : '#94a3b8',
                borderRadius: '16px',
                padding: '4px 12px',
                fontSize: '0.76rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              🎨 Visual Layout
            </button>
            <button
              type="button"
              onClick={() => setViewMode('markdown')}
              style={{
                background: viewMode === 'markdown' ? '#0284c7' : 'transparent',
                border: 'none',
                color: viewMode === 'markdown' ? '#ffffff' : '#94a3b8',
                borderRadius: '16px',
                padding: '4px 12px',
                fontSize: '0.76rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              📝 Raw Text
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'markdown' ? (
        <pre
          style={{
            whiteSpace: 'pre-wrap',
            fontFamily: 'monospace',
            fontSize: '0.84rem',
            lineHeight: 1.5,
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '16px',
            borderRadius: '10px',
            margin: 0,
            maxHeight: '450px',
            overflowY: 'auto',
          }}
        >
          {content}
        </pre>
      ) : (
        <>
          {/* Template Selection Pills */}
          <div style={{ marginBottom: '22px' }}>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '8px', fontWeight: 600 }}>
              Select Infographic Visual Template:
            </div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              {TEMPLATES.map((tmpl) => {
                const Icon = tmpl.icon;
                const isSelected = activeTemplate === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => setActiveTemplate(tmpl.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 14px',
                      borderRadius: '10px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: isSelected
                        ? '1px solid #38bdf8'
                        : '1px solid rgba(255, 255, 255, 0.08)',
                      background: isSelected
                        ? 'rgba(56, 189, 248, 0.15)'
                        : 'rgba(255, 255, 255, 0.04)',
                      color: isSelected ? '#38bdf8' : '#cbd5e1',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Icon size={14} />
                    <span>{tmpl.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Template Render Canvas */}
          <div
            style={{
              background: '#0b1120',
              borderRadius: '14px',
              padding: '24px',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              minHeight: '380px',
            }}
          >
            {/* Header info inside graphic */}
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <span
                style={{
                  textTransform: 'uppercase',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  letterSpacing: '0.1em',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  background: 'rgba(232, 98, 44, 0.18)',
                  color: '#fb923c',
                  border: '1px solid rgba(232, 98, 44, 0.35)',
                }}
              >
                {parsedData.badge || 'CYBERSECURITY DEFENSE BLUEPRINT'}
              </span>
              <h2
                style={{
                  fontSize: '1.35rem',
                  fontWeight: 800,
                  color: '#ffffff',
                  margin: '8px 0 4px 0',
                  letterSpacing: '-0.01em',
                }}
              >
                {parsedData.title}
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: 0, maxWidth: '640px', marginInline: 'auto' }}>
                {parsedData.subtitle}
              </p>
            </div>

            {/* Template 1: Flow Chevrons */}
            {activeTemplate === 'chevrons' && (
              <RenderChevrons steps={parsedData.steps} />
            )}

            {/* Template 2: Comparative Bar & Stat Graph */}
            {activeTemplate === 'graph' && (
              <RenderBarGraph />
            )}

            {/* Template 3: Sequential Flowchart Graph (Image 3 Style) */}
            {activeTemplate === 'flowchart' && (
              <RenderFlowchartGraph />
            )}

            {/* Template 4: Circular Petal Wheel */}
            {activeTemplate === 'circular' && (
              <RenderCircularPetals steps={parsedData.steps} centerTitle={parsedData.centerTitle} />
            )}

            {/* Template 5: Metric Stat Dials */}
            {activeTemplate === 'metrics' && (
              <RenderMetricDials metrics={parsedData.metrics} />
            )}

            {/* Template 6: Milestone Timeline */}
            {activeTemplate === 'roadmap' && (
              <RenderTimeline steps={parsedData.steps} />
            )}

            {/* Template 7: Data Feature Cards */}
            {activeTemplate === 'cards' && (
              <RenderDataCards steps={parsedData.steps} />
            )}
          </div>
        </>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// TEMPLATE 1: FLOW CHEVRONS (Horizontal Arrows 01 - 04)
// -------------------------------------------------------------
function RenderChevrons({ steps }) {
  const colors = [
    { bg: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', badge: '#38bdf8', text: '#ffffff' },
    { bg: 'linear-gradient(135deg, #059669 0%, #047857 100%)', badge: '#34d399', text: '#ffffff' },
    { bg: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)', badge: '#fbbf24', text: '#ffffff' },
    { bg: 'linear-gradient(135deg, #db2777 0%, #be185d 100%)', badge: '#f472b6', text: '#ffffff' },
    { bg: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)', badge: '#a78bfa', text: '#ffffff' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '800px', margin: '0 auto' }}>
      {steps.slice(0, 4).map((step, idx) => {
        const theme = colors[idx % colors.length];
        return (
          <div
            key={idx}
            style={{
              position: 'relative',
              background: theme.bg,
              borderRadius: '12px',
              padding: '16px 24px 16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 6px 18px rgba(0,0,0,0.25)',
              clipPath: 'polygon(0% 0%, 94% 0%, 100% 50%, 94% 100%, 0% 100%)',
              transition: 'transform 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.22)',
                  backdropFilter: 'blur(4px)',
                  borderRadius: '10px',
                  width: '44px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  color: '#ffffff',
                }}
              >
                {step.stepNum || `0${idx + 1}`}
              </div>

              <div>
                <div style={{ fontSize: '0.96rem', fontWeight: 700, color: '#ffffff', marginBottom: '3px' }}>
                  {step.title}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.35, maxWidth: '580px' }}>
                  {step.desc}
                </div>
              </div>
            </div>

            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                marginRight: '28px',
              }}
            >
              <ArrowRight size={16} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// -------------------------------------------------------------
// TEMPLATE 2: CIRCULAR PETAL WHEEL (Flower Style Step 01-05)
// -------------------------------------------------------------
function RenderCircularPetals({ steps, centerTitle }) {
  const petals = [
    { color: '#06b6d4', label: '01' },
    { color: '#8b5cf6', label: '02' },
    { color: '#ec4899', label: '03' },
    { color: '#eab308', label: '04' },
    { color: '#10b981', label: '05' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '14px',
          width: '100%',
          maxWidth: '750px',
        }}
      >
        {steps.slice(0, 5).map((step, idx) => {
          const petal = petals[idx % petals.length];
          return (
            <div
              key={idx}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: `2px solid ${petal.color}`,
                borderRadius: '16px',
                padding: '16px 12px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                boxShadow: `0 8px 20px ${petal.color}22`,
                position: 'relative',
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: petal.color,
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.86rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '10px',
                  boxShadow: `0 0 14px ${petal.color}88`,
                }}
              >
                {step.stepNum || petal.label}
              </div>

              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#f8fafc', marginBottom: '6px' }}>
                {step.title}
              </div>

              <div style={{ fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.35 }}>
                {step.desc}
              </div>
            </div>
          );
        })}
      </div>

      {/* Central Hub Summary Banner */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '30px',
          padding: '8px 24px',
          fontSize: '0.82rem',
          color: '#38bdf8',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <Sparkles size={16} />
        <span>Core Focus: {centerTitle || 'Integrated Multimodal Security Architecture'}</span>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// TEMPLATE 3: METRIC STAT DIALS (Circular Percentage Gauges)
// -------------------------------------------------------------
function RenderMetricDials({ metrics }) {
  const defaultMetrics = [
    { value: '82%', label: 'Phishing Vectors', desc: 'Breaches exploiting credentials & urgent links', color: '#ef4444', pct: 82 },
    { value: '99%', label: 'MFA Defense', desc: 'Account takeovers prevented by authenticator apps', color: '#10b981', pct: 99 },
    { value: '21d', label: 'Average Downtime', desc: 'Days needed to recover from unbacked attacks', color: '#f59e0b', pct: 70 },
    { value: '100%', label: 'Hash Tamper-Proof', desc: 'SHA-256 verifiable artefact certification', color: '#06b6d4', pct: 100 },
  ];

  const items = metrics && metrics.length > 0 ? metrics : defaultMetrics;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '20px',
        maxWidth: '780px',
        margin: '0 auto',
      }}
    >
      {items.map((m, idx) => {
        const radius = 42;
        const circ = 2 * Math.PI * radius;
        const strokeDashoffset = circ - ((m.pct || 75) / 100) * circ;

        return (
          <div
            key={idx}
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '20px 14px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {/* SVG Circular Dial */}
            <div style={{ position: 'relative', width: '100px', height: '100px', marginBottom: '12px' }}>
              <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke="rgba(255, 255, 255, 0.1)"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke={m.color}
                  strokeWidth="8"
                  strokeDasharray={circ}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: m.color,
                }}
              >
                {m.value}
              </div>
            </div>

            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc', marginBottom: '4px' }}>
              {m.label}
            </div>

            <div style={{ fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.35 }}>
              {m.desc}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// -------------------------------------------------------------
// TEMPLATE 4: MILESTONE TIMELINE / ROADMAP
// -------------------------------------------------------------
function RenderTimeline({ steps }) {
  const colors = ['#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', position: 'relative', padding: '10px 0' }}>
      {/* Connecting Horizontal Line */}
      <div
        style={{
          position: 'absolute',
          top: '32px',
          left: '40px',
          right: '40px',
          height: '4px',
          background: 'linear-gradient(90deg, #06b6d4 0%, #10b981 33%, #f59e0b 66%, #ec4899 100%)',
          zIndex: 0,
        }}
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.min(steps.length, 4)}, 1fr)`,
          gap: '12px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {steps.slice(0, 4).map((step, idx) => {
          const col = colors[idx % colors.length];
          return (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Pin */}
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: '#0b1120',
                  border: `3px solid ${col}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: col,
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  marginBottom: '16px',
                  boxShadow: `0 0 16px ${col}66`,
                }}
              >
                {step.stepNum || `P${idx + 1}`}
              </div>

              {/* Card */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '14px 10px',
                  textAlign: 'center',
                  width: '100%',
                }}
              >
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: col, marginBottom: '6px' }}>
                  {step.title}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.35 }}>
                  {step.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// TEMPLATE 5: DATA FEATURE CARDS GRID
// -------------------------------------------------------------
function RenderDataCards({ steps }) {
  const tabs = [
    { tag: 'DATA 01', col: '#06b6d4', icon: Lock },
    { tag: 'DATA 02', col: '#10b981', icon: Shield },
    { tag: 'DATA 03', col: '#f59e0b', icon: Database },
    { tag: 'DATA 04', col: '#ec4899', icon: Cloud },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
        gap: '14px',
        maxWidth: '780px',
        margin: '0 auto',
      }}
    >
      {steps.slice(0, 4).map((step, idx) => {
        const t = tabs[idx % tabs.length];
        const Icon = t.icon;
        return (
          <div
            key={idx}
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Top Color Header Tag */}
            <div
              style={{
                background: t.col,
                padding: '6px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.74rem',
              }}
            >
              <span>{t.tag}</span>
              <Icon size={14} />
            </div>

            {/* Body */}
            <div style={{ padding: '14px 12px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#f8fafc', marginBottom: '6px' }}>
                {step.title}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8', lineHeight: 1.4 }}>
                {step.desc}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// -------------------------------------------------------------
// TEMPLATE: COMPARATIVE BAR & STAT GRAPH
// -------------------------------------------------------------
function RenderBarGraph() {
  const barData = [
    {
      category: 'Phishing Vulnerability Rate',
      withoutVal: '34% Compromised',
      withoutPct: 34,
      withVal: '3.8% Blocked',
      withPct: 96,
      metricName: 'MFA & Email Verification Filter',
    },
    {
      category: 'Account Takeover Risk',
      withoutVal: '82% High Exposure',
      withoutPct: 82,
      withVal: '0.8% Hardened',
      withPct: 99,
      metricName: 'Passphrase Vault & Biometrics',
    },
    {
      category: 'Incident Recovery Time',
      withoutVal: '21 Days Offline',
      withoutPct: 75,
      withVal: '4 Hours Online',
      withPct: 95,
      metricName: 'Immutable Air-Gapped 3-2-1 Backups',
    },
    {
      category: 'Zero-Trust Verification Score',
      withoutVal: '28% Blind Spots',
      withoutPct: 28,
      withVal: '98% Guarded',
      withPct: 98,
      metricName: 'Continuous Contextual Guardrails',
    },
  ];

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#f8fafc' }}>
          📊 Security Impact & Reduction Metrics (Interactive Graph)
        </span>
        <div style={{ display: 'flex', gap: '14px', fontSize: '0.75rem', fontWeight: 600 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f87171' }}>
            <span style={{ width: '10px', height: '10px', background: '#ef4444', borderRadius: '2px' }} />
            Without Protection
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399' }}>
            <span style={{ width: '10px', height: '10px', background: '#10b981', borderRadius: '2px' }} />
            With PRISM AI Safeguards
          </span>
        </div>
      </div>

      {barData.map((item, idx) => (
        <div
          key={idx}
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '14px 18px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#e2e8f0' }}>{item.category}</span>
            <span style={{ fontSize: '0.74rem', color: '#38bdf8', fontWeight: 600 }}>{item.metricName}</span>
          </div>

          {/* Bar 1: Without */}
          <div style={{ marginBottom: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '3px' }}>
              <span>Legacy Baseline</span>
              <span style={{ color: '#f87171', fontWeight: 700 }}>{item.withoutVal}</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${item.withoutPct}%`, height: '100%', background: 'linear-gradient(90deg, #f87171, #ef4444)', borderRadius: '4px' }} />
            </div>
          </div>

          {/* Bar 2: With */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '3px' }}>
              <span>PRISM AI Zero-Trust</span>
              <span style={{ color: '#34d399', fontWeight: 700 }}>{item.withVal}</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${item.withPct}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #059669)', borderRadius: '4px' }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// -------------------------------------------------------------
// TEMPLATE: SEQUENTIAL FLOWCHART GRAPH (IMAGE 3 DUAL ARCHITECTURE)
// -------------------------------------------------------------
function RenderFlowchartGraph() {
  const badFlow = [
    'Untrusted Phishing Vector Arrives',
    'User Enters Reused Plaintext Password',
    'Direct Root & Database Breach Occurs',
    'Ransomware Deploys Cryptographic Extortion',
  ];

  const goodFlow = [
    'Untrusted Input Intercepted by Guardrails',
    'Contextual MFA & Virus Scanner Analyzes Payload',
    'Zero-Trust Least Privilege Blocks Unauthorized Access',
    'Tamper-Evident SHA-256 Logs Ingested to Qdrant',
  ];

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Left Column: Without */}
        <div>
          <div
            style={{
              padding: '8px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontWeight: 800,
              fontSize: '0.86rem',
              textAlign: 'center',
              marginBottom: '14px',
            }}
          >
            ❌ Without Protection (Legacy Flow)
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            {badFlow.map((step, idx) => (
              <React.Fragment key={idx}>
                <div
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1.5px solid rgba(239, 68, 68, 0.4)',
                    color: '#fca5a5',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    textAlign: 'center',
                  }}
                >
                  {step}
                </div>
                {idx < badFlow.length - 1 && (
                  <span style={{ color: '#ef4444', fontSize: '1rem', fontWeight: 800 }}>↓</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Right Column: With */}
        <div>
          <div
            style={{
              padding: '8px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
              fontWeight: 800,
              fontSize: '0.86rem',
              textAlign: 'center',
              marginBottom: '14px',
            }}
          >
            ✅ With PRISM AI (Zero-Trust Flow)
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            {goodFlow.map((step, idx) => (
              <React.Fragment key={idx}>
                <div
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1.5px solid rgba(16, 185, 129, 0.4)',
                    color: '#86efac',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    textAlign: 'center',
                  }}
                >
                  {step}
                </div>
                {idx < goodFlow.length - 1 && (
                  <span style={{ color: '#10b981', fontSize: '1rem', fontWeight: 800 }}>↓</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// HELPER: PARSE DYNAMIC CONTENT INTO STRUCTURED INFOGRAPHIC OBJECT
// -------------------------------------------------------------
function parseInfographicData(content) {
  if (!content) {
    return getDefaultData();
  }

  // Look for title
  const titleMatch = content.match(/^(?:#|\*\*Title\*\*:?)\s*(.+)$/m);
  const title = titleMatch ? titleMatch[1].replace(/[#*]/g, '').trim() : 'Cybersecurity Defense Blueprint';

  // Look for steps/phases
  const stepMatches = [
    ...content.matchAll(/(?:(?:Phase|Step|Pillar)\s*(\d+)|\d+\.)[:\s*-]+([^\n]+)(?:\n+([^\n#]+))?/gi),
  ];

  let steps = [];
  if (stepMatches.length >= 3) {
    steps = stepMatches.map((m, idx) => ({
      stepNum: m[1] ? `0${m[1]}` : `0${idx + 1}`,
      title: m[2]?.replace(/[#*]/g, '').trim() || `Step ${idx + 1}`,
      desc: m[3]?.replace(/[#*]/g, '').trim() || 'Execute proactive safeguards and verified controls.',
    }));
  } else {
    steps = getDefaultData().steps;
  }

  return {
    badge: 'PRISM AI · MULTIMODAL INFOGRAPHIC',
    title,
    subtitle: 'Automated intelligence breakdown and structured mitigation flow',
    centerTitle: 'Zero-Trust Defense',
    steps,
    metrics: [
      { value: '82%', label: 'Phishing Vectors', desc: 'Breaches exploiting credentials & urgent links', color: '#ef4444', pct: 82 },
      { value: '99%', label: 'MFA Defense', desc: 'Account takeovers prevented by authenticator apps', color: '#10b981', pct: 99 },
      { value: '21d', label: 'Average Downtime', desc: 'Days needed to recover from unbacked attacks', color: '#f59e0b', pct: 70 },
      { value: '100%', label: 'Hash Verified', desc: 'SHA-256 tamper-evident integrity certification', color: '#06b6d4', pct: 100 },
    ],
  };
}

function getDefaultData() {
  return {
    badge: 'PRISM AI · INFOGRAPHIC SYNTHESIS',
    title: 'Anatomy of Attack & Multi-Pillar Defense',
    subtitle: 'From threat inception to zero-trust remediation and recovery protocols',
    centerTitle: 'Comprehensive Security',
    steps: [
      {
        stepNum: '01',
        title: 'Infection Vector',
        desc: 'Spear-phishing emails and malicious attachments exploit human urgency and weak passphrases.',
      },
      {
        stepNum: '02',
        title: 'Exploitation & Spread',
        desc: 'Malware disables endpoint antivirus, deletes shadow copies, and expands through lateral ports.',
      },
      {
        stepNum: '03',
        title: 'Cryptographic Lock',
        desc: 'Military-grade AES/RSA locks local files and network shares, leaving extortion notes.',
      },
      {
        stepNum: '04',
        title: 'Zero-Trust Defense',
        desc: 'Immutable 3-2-1 backups, mandatory MFA, and rapid device quarantine nullify threat impact.',
      },
    ],
  };
}
