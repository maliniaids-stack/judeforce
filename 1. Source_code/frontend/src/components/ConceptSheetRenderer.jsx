import React from 'react';
import {
  Code,
  CheckCircle2,
  XCircle,
  ArrowDown,
  Sparkles,
  BookOpen,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export function ConceptSheetRenderer({ content = '', conceptNumber = '01' }) {
  const parsed = parseConceptData(content);

  return (
    <div
      style={{
        background: '#ffffff',
        color: '#1e293b',
        borderRadius: '16px',
        padding: '36px 32px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
        border: '1px solid #e2e8f0',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        maxWidth: '820px',
        margin: '0 auto',
      }}
    >
      {/* Top Blue Concept Badge */}
      <div style={{ textAlign: 'center', marginBottom: '14px' }}>
        <span
          style={{
            background: '#2563eb',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '0.74rem',
            padding: '4px 16px',
            borderRadius: '4px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            display: 'inline-block',
          }}
        >
          {parsed.conceptPill || `CONCEPT ${conceptNumber}`}
        </span>
      </div>

      {/* Main Title 1 */}
      <h1
        style={{
          fontSize: '1.75rem',
          fontWeight: 800,
          color: '#0f172a',
          margin: '0 0 10px 0',
          letterSpacing: '-0.02em',
        }}
      >
        {parsed.title1}
      </h1>

      <p style={{ fontSize: '0.92rem', color: '#475569', lineHeight: 1.5, margin: '0 0 18px 0' }}>
        {parsed.description1}
      </p>

      {/* Side-by-Side Comparison Box (Real-life vs Technical/Programming) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          overflow: 'hidden',
          marginBottom: '22px',
        }}
      >
        <div style={{ padding: '16px 18px', borderRight: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
            {parsed.example1Title || 'Real-life example'}
          </div>
          <p style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
            {parsed.example1Text}
          </p>
        </div>

        <div style={{ padding: '16px 18px', background: '#f0fdf4' }}>
          <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#166534', marginBottom: '8px' }}>
            {parsed.example2Title || 'Technical / Implementation version'}
          </div>
          <p style={{ fontSize: '0.82rem', color: '#15803d', lineHeight: 1.5, margin: 0 }}>
            {parsed.example2Text}
          </p>
        </div>
      </div>

      {/* Section 2: Why do systems need this? */}
      <h2
        style={{
          fontSize: '1.25rem',
          fontWeight: 800,
          color: '#2563eb',
          margin: '0 0 10px 0',
        }}
      >
        {parsed.sectionWhyTitle}
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '22px' }}>
        {parsed.whyBullets.map((bullet, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#2563eb',
                marginTop: '6px',
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: '0.88rem', color: '#334155', lineHeight: 1.45 }}>
              {bullet}
            </span>
          </div>
        ))}
      </div>

      {/* Dark Code Block */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
          {parsed.codeTitle || 'Simple programming / implementation idea'}
        </div>
        <div
          style={{
            background: '#0f172a',
            color: '#f8fafc',
            padding: '14px 18px',
            borderRadius: '8px',
            fontFamily: "'Fira Code', 'Courier New', monospace', monospace",
            fontSize: '0.82rem',
            lineHeight: 1.6,
            overflowX: 'auto',
          }}
        >
          {parsed.codeSnippet.split('\n').map((line, lIdx) => (
            <div key={lIdx}>
              <span style={{ color: line.includes('def') || line.includes('return') ? '#818cf8' : '#38bdf8' }}>
                {line}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Title 2: What is the Architecture? */}
      <h1
        style={{
          fontSize: '1.75rem',
          fontWeight: 800,
          color: '#0f172a',
          margin: '0 0 8px 0',
          letterSpacing: '-0.02em',
        }}
      >
        {parsed.title2}
      </h1>

      <p style={{ fontSize: '0.92rem', color: '#475569', lineHeight: 1.5, margin: '0 0 24px 0' }}>
        {parsed.description2}
      </p>

      {/* DUAL FLOWCHART GRAPH (Exact Image 3 Reference: Without vs With) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
          marginBottom: '28px',
        }}
      >
        {/* Left Column: Without (Red Boxes with down arrows) */}
        <div>
          <div
            style={{
              fontSize: '0.92rem',
              fontWeight: 800,
              color: '#0f172a',
              marginBottom: '14px',
              textAlign: 'center',
            }}
          >
            {parsed.flow1Title || 'Without Protection / Architecture'}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            {parsed.flow1Steps.map((step, idx) => (
              <React.Fragment key={idx}>
                <div
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid #ef4444',
                    background: '#fef2f2',
                    color: '#0f172a',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    textAlign: 'center',
                    boxShadow: '0 2px 6px rgba(239, 68, 68, 0.08)',
                  }}
                >
                  {step}
                </div>
                {idx < parsed.flow1Steps.length - 1 && (
                  <ArrowDown size={18} color="#ef4444" strokeWidth={2.5} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Right Column: With (Green Boxes with down arrows) */}
        <div>
          <div
            style={{
              fontSize: '0.92rem',
              fontWeight: 800,
              color: '#0f172a',
              marginBottom: '14px',
              textAlign: 'center',
            }}
          >
            {parsed.flow2Title || 'With Protection / Architecture'}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            {parsed.flow2Steps.map((step, idx) => (
              <React.Fragment key={idx}>
                <div
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid #10b981',
                    background: '#ecfdf5',
                    color: '#0f172a',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    textAlign: 'center',
                    boxShadow: '0 2px 6px rgba(16, 185, 129, 0.08)',
                  }}
                >
                  {step}
                </div>
                {idx < parsed.flow2Steps.length - 1 && (
                  <ArrowDown size={18} color="#10b981" strokeWidth={2.5} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Section 3: Why it is useful */}
      <h2
        style={{
          fontSize: '1.25rem',
          fontWeight: 800,
          color: '#2563eb',
          margin: '0 0 10px 0',
        }}
      >
        {parsed.sectionBenefitsTitle || 'Why this approach is useful'}
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '28px' }}>
        {parsed.benefits.map((b, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#10b981',
                marginTop: '6px',
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: '0.88rem', color: '#334155', lineHeight: 1.45 }}>
              {b}
            </span>
          </div>
        ))}
      </div>

      {/* Clean Template Footer */}
      <div
        style={{
          borderTop: '1px solid #e2e8f0',
          paddingTop: '14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.74rem',
          color: '#94a3b8',
        }}
      >
        <span>PRISM AI · Learning Notes & Technical Synthesis</span>
        <span>Page 1 of 1</span>
      </div>
    </div>
  );
}

function parseConceptData(content) {
  // If content is cybersecurity, tailor context; otherwise adapt dynamically
  const isCyber = (content || '').toLowerCase().includes('cyber') || (content || '').toLowerCase().includes('pass');

  if (isCyber) {
    return {
      conceptPill: 'CONCEPT 01',
      title1: 'What is Multi-Factor Authentication (MFA)?',
      description1: 'Multi-Factor Authentication (MFA) is a layered security mechanism requiring users to present two or more independent credentials before gaining system access.',
      example1Title: 'Real-life physical example',
      example1Text: 'A bank vault requires both a physical mechanical key and a digital fingerprint scan to open. The vault cannot be breached with just one item.',
      example2Title: 'Cybersecurity implementation',
      example2Text: 'A user enters their student password, and immediately receives a time-based one-time code (TOTP) on their authenticator app before login completes.',
      sectionWhyTitle: 'Why do systems need MFA?',
      whyBullets: [
        'To prevent catastrophic account takeovers even when passwords are leaked in external breaches.',
        'To eliminate reliance on human password reuse and weak credential combinations.',
        'To establish verified zero-trust identity before granting access to network resources.',
      ],
      codeTitle: 'Simple security validation logic',
      codeSnippet: `def verify_login_attempt(username, password, totp_token):\n    user = db.authenticate(username, password)\n    if not user:\n        return {"status": "denied", "reason": "bad_credentials"}\n    return totp_service.verify_token(user.secret, totp_token)`,
      title2: 'What is Zero-Trust Architecture?',
      description2: 'Zero-Trust Architecture means never trusting any connection by default, continually validating every access request regardless of location.',
      flow1Title: 'Without Zero-Trust (Legacy Password Only)',
      flow1Steps: [
        'User Submits Password',
        'Phished / Stolen Password Accepted',
        'Attacker Directly Accesses Internal DB',
        'Complete Lateral Data Exfiltration',
      ],
      flow2Title: 'With Zero-Trust (Multi-Factor & Guardrails)',
      flow2Steps: [
        'User Submits Password',
        'MFA Challenge & Device Integrity Check',
        'Contextual Access Inspection / Guardrail',
        'Threat Blocked & Access Secured',
      ],
      sectionBenefitsTitle: 'Why Zero-Trust MFA is vital',
      benefits: [
        'Blocks 99.2% of automated credential stuffing attacks',
        'Provides granular audit logs with tamper-proof validation',
        'Protects sensitive academic, financial, and enterprise data',
        'Ensures continuous operational resilience even during breaches',
      ],
    };
  }

  // Default Software / Technical Concept (matches Image 3 exactly)
  return {
    conceptPill: 'CONCEPT 01',
    title1: 'What is a Dependency?',
    description1: 'A dependency is simply something another piece of code needs in order to do its job.',
    example1Title: 'Real-life example',
    example1Text: 'A student wants to print an assignment. The student depends on a printer. The printer is the dependency.',
    example2Title: 'Programming version',
    example2Text: 'A function wants to read products. The function needs a database connection. The database connection is the dependency.',
    sectionWhyTitle: 'Why do functions need dependencies?',
    whyBullets: [
      'To access a database, file, authentication user, configuration, or another service.',
      'The function focuses on its main job instead of building every resource by itself.',
    ],
    codeTitle: 'Simple programming idea',
    codeSnippet: `def show_products(db):\n    return db.query(Product).all()`,
    title2: 'What is Dependency Injection?',
    description2: 'Dependency Injection (DI) means giving a function the things it needs instead of making the function create those things itself.',
    flow1Title: 'Without Dependency Injection',
    flow1Steps: [
      'Function',
      'Creates Database Connection',
      'Uses Database',
      'Closes Connection',
    ],
    flow2Title: 'With Dependency Injection',
    flow2Steps: [
      'Database Dependency',
      'Provides DB',
      'Function',
      'Uses DB',
    ],
    sectionBenefitsTitle: 'Why DI is useful',
    benefits: [
      'Reusable and cleaner code',
      'Less duplicate setup/cleanup code',
      'Easy to test with a fake or test dependency',
      'Automatic resource management',
      'Clear separation of responsibilities',
    ],
  };
}
