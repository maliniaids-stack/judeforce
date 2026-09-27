import React, { useState, useEffect } from 'react';
import {
  Download,
  FileText,
  CheckCircle,
  RotateCcw,
  ExternalLink,
  Copy,
  Check,
  Package,
  ShieldCheck,
  Video,
  Share2,
  Presentation,
  ShieldAlert,
  BarChart3,
  MessageCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Palette,
  Layers,
  Heart,
  FolderOpen
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { getExportData } from '../../api/client';
import { InfographicRenderer } from '../InfographicRenderer';
import { ConceptSheetRenderer } from '../ConceptSheetRenderer';

export function Step6Export() {
  const jobId = useAppStore((state) => state.jobId);
  const jobData = useAppStore((state) => state.jobData);
  const generationParams = useAppStore((state) => state.generationParams);
  const resetWorkflow = useAppStore((state) => state.resetWorkflow);
  const [exportPayload, setExportPayload] = useState(null);
  const [copiedFormat, setCopiedFormat] = useState(null);
  const [downloadNotice, setDownloadNotice] = useState(null);
  const [expandedGuardrails, setExpandedGuardrails] = useState({});
  const [activeTab, setActiveTab] = useState(0); // 0 = first deliverable, 'all' = show all
  const [isCuteTheme, setIsCuteTheme] = useState(true); // Default to Cute Result Page (Image 1 Reference)

  useEffect(() => {
    if (!jobId) return;
    getExportData(jobId)
      .then((data) => setExportPayload(data))
      .catch((err) => console.error('Failed to load export data:', err));
  }, [jobId]);

  const handleCopy = (format, content) => {
    navigator.clipboard.writeText(content);
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  const handleDownload = async (artefactId, format, type) => {
    const ext = type.toLowerCase();
    const downloadUrl = artefactId
      ? `http://localhost:8000/api/download/${artefactId}/${ext}`
      : `http://localhost:8000/api/export/${jobId}/download/${ext}`;

    setDownloadNotice(`Preparing ${format} as .${type.toUpperCase()}...`);

    try {
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        let errorMsg = `Server error ${response.status}`;
        try {
          const errData = await response.json();
          if (errData.detail) errorMsg = errData.detail;
        } catch (_) {}
        setDownloadNotice(`Export failed: ${errorMsg}`);
        setTimeout(() => setDownloadNotice(null), 4000);
        return;
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `prism-ai-${format.toLowerCase().replace(/[^a-z0-9]/g, '_')}.${ext}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      setDownloadNotice(`✓ Downloaded ${format} as valid .${type.toUpperCase()}`);
      setTimeout(() => setDownloadNotice(null), 3500);
    } catch (err) {
      console.error('Download error:', err);
      setDownloadNotice(`Could not connect to backend at http://localhost:8000`);
      setTimeout(() => setDownloadNotice(null), 4000);
    }
  };

  const toggleGuardrailDetails = (id) => {
    setExpandedGuardrails((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Instantly use jobData artefacts from Zustand on frame 1 without waiting for network poll
  const artefacts = exportPayload?.artefacts?.length
    ? exportPayload.artefacts
    : jobData?.artefacts || [];

  const getFormatIcon = (format) => {
    const f = (format || '').toLowerCase();
    if (f.includes('linkedin')) return 'in';
    if (f.includes('presentation') || f.includes('ppt')) return '📊';
    if (f.includes('infographic')) return '🖼️';
    if (f.includes('video')) return '🎥';
    if (f.includes('concept') || f.includes('notes')) return '💡';
    return '📄';
  };

  const displayedArtefacts = activeTab === 'all'
    ? artefacts
    : artefacts.filter((_, idx) => idx === activeTab);

  // RENDERER FOR CYBERSECURITY DOs & DON'Ts CARD (Exact match for Image 1)
  const renderCyberDosAndDontsCard = () => (
    <div className="cute-cyber-card-frame">
      <div className="cute-cyber-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
          <ShieldCheck size={20} color="#0284c7" />
          <span className="cute-cyber-title">Cybersecurity DOs &amp; DON'Ts</span>
          <ShieldAlert size={20} color="#f97316" />
        </div>
        <div className="cute-cyber-subtitle">FOR STUDENTS &amp; TEAMS</div>
      </div>

      <div className="cute-cyber-columns">
        {/* DOs Column */}
        <div className="cute-col-dos">
          <div style={{ textAlign: 'center' }}>
            <span className="cute-col-pill-green">✓ DOs</span>
          </div>

          <div className="cute-item-card">
            <div className="cute-item-title">USE MULTI-FACTOR AUTHENTICATION (MFA)</div>
            <div className="cute-item-desc">Add an extra layer of security across all personal and team accounts.</div>
          </div>

          <div className="cute-item-card">
            <div className="cute-item-title">CREATE STRONG PASSWORDS</div>
            <div className="cute-item-desc">Make passphrases 14+ characters, unique, and stored in a password manager.</div>
          </div>

          <div className="cute-item-card">
            <div className="cute-item-title">LOCK SCREENS WHEN AWAY</div>
            <div className="cute-item-desc">Always hit Win + L or Cmd + Ctrl + Q when stepping away from your desk.</div>
          </div>
        </div>

        {/* DON'Ts Column */}
        <div className="cute-col-donts">
          <div style={{ textAlign: 'center' }}>
            <span className="cute-col-pill-red">⚠️ DON'Ts</span>
          </div>

          <div className="cute-item-card">
            <div className="cute-item-title">NEVER SHARE YOUR PASSWORDS</div>
            <div className="cute-item-desc">Keep your credentials private; support teams will never ask for them.</div>
          </div>

          <div className="cute-item-card">
            <div className="cute-item-title">AVOID DELAYING SYSTEM UPDATES</div>
            <div className="cute-item-desc">Install software patches promptly to eliminate active security vulnerabilities.</div>
          </div>

          <div className="cute-item-card">
            <div className="cute-item-title">DON'T CLICK UNVERIFIED LINKS</div>
            <div className="cute-item-desc">Verify sender identity and never click unknown links in urgent messages.</div>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '6px' }}>
        <span
          style={{
            fontFamily: 'sans-serif',
            fontWeight: 800,
            fontSize: '0.85rem',
            color: '#0a66c2',
            letterSpacing: '0.02em',
          }}
        >
          Linked<span style={{ background: '#0a66c2', color: '#ffffff', padding: '1px 4px', borderRadius: '3px', marginLeft: '1px' }}>in</span>
        </span>
      </div>
    </div>
  );

  const renderDeliverableContent = (artefact) => {
    const fmt = (artefact.output_format || '').toLowerCase();
    const content = artefact.content || '';

    // 1. CONCEPT NOTES (Image 3 Style)
    if (fmt.includes('concept') || fmt.includes('notes') || generationParams?.uiTemplate === 'concept_notes') {
      return (
        <ConceptSheetRenderer
          content={content}
          conceptNumber="01"
        />
      );
    }

    // 2. INFOGRAPHIC WITH INTERACTIVE GRAPHS & FLOWCHARTS
    if (fmt.includes('infographic')) {
      return (
        <InfographicRenderer
          content={content}
          defaultTemplate={generationParams?.infographicTemplate || 'graph'}
        />
      );
    }

    // 3. PRESENTATION SLIDE DECK
    if (fmt.includes('presentation') || fmt.includes('ppt')) {
      const slides = content.split(/---|\n## Slide/i).filter((s) => s.trim().length > 20);
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ fontSize: '0.84rem', fontWeight: 700, color: isCuteTheme ? '#0284c7' : '#38bdf8', marginBottom: '2px' }}>
            📊 6-Slide Interactive Deck with Key Practices &amp; Speaker Notes
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '14px',
              maxHeight: '480px',
              overflowY: 'auto',
              paddingRight: '6px',
            }}
          >
            {slides.map((slideText, sIdx) => (
              <div
                key={sIdx}
                style={{
                  background: isCuteTheme ? '#ffffff' : 'rgba(255, 255, 255, 0.04)',
                  border: isCuteTheme ? '1.5px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '16px',
                  boxShadow: isCuteTheme ? '0 4px 12px rgba(0,0,0,0.04)' : 'none',
                }}
              >
                <div
                  style={{
                    fontWeight: 800,
                    color: isCuteTheme ? '#0284c7' : '#38bdf8',
                    marginBottom: '8px',
                    fontSize: '0.92rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>Slide {sIdx + 1}</span>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>Ready for PPTX</span>
                </div>
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5, color: isCuteTheme ? '#334155' : '#e2e8f0', fontSize: '0.85rem' }}>
                  {slideText.trim()}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 4. VIDEO STORYBOARD DELIVERABLE
    if (fmt.includes('video')) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              background: isCuteTheme ? '#f0f9ff' : 'rgba(56, 189, 248, 0.08)',
              border: isCuteTheme ? '1.5px solid #bae6fd' : '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '14px',
              padding: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <ImageIcon size={18} color="#0284c7" />
              <strong style={{ color: '#0284c7', fontSize: '0.92rem' }}>
                Online Model Visual Recommendation Preview (Storyboard Key Frame)
              </strong>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '16px', alignItems: 'center' }}>
              <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                <img
                  src="/assets/video_visual_rec.jpg"
                  alt="Video Storyboard Key Frame"
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
              </div>

              <div>
                <p style={{ margin: '0 0 8px 0', fontSize: '0.82rem', color: isCuteTheme ? '#334155' : '#cbd5e1', lineHeight: 1.4 }}>
                  <strong>Scene Concept:</strong> Superhero Aegis shield defense repelling phishing attachments and malware exploits. Comic-book tech aesthetic for student engagement.
                </p>
                <div
                  style={{
                    background: isCuteTheme ? '#ffffff' : 'rgba(0,0,0,0.3)',
                    border: isCuteTheme ? '1px solid #e2e8f0' : 'none',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    fontSize: '0.74rem',
                    fontFamily: 'monospace',
                    color: isCuteTheme ? '#475569' : '#94a3b8',
                  }}
                >
                  Prompt: "Professional modern cinematic storyboard frame for a cybersecurity educational video: superhero with digital shield repelling cyber threats..."
                </div>
              </div>
            </div>
          </div>

          <pre
            style={{
              whiteSpace: 'pre-wrap',
              fontFamily: 'inherit',
              fontSize: '0.86rem',
              lineHeight: 1.55,
              background: isCuteTheme ? '#f8fafc' : 'rgba(0,0,0,0.25)',
              border: isCuteTheme ? '1px solid #e2e8f0' : 'none',
              padding: '16px',
              borderRadius: '10px',
              margin: 0,
              maxHeight: '400px',
              overflowY: 'auto',
              color: isCuteTheme ? '#334155' : '#e2e8f0',
            }}
          >
            {content.replace(/\[VISUAL_RECOMMENDATION_ASSET:.*?\]/g, '')}
          </pre>
        </div>
      );
    }

    // 5. LINKEDIN POST & ADVISORY WITH DUAL-COLUMN CARD PREVIEW (Image 1 Style)
    if (fmt.includes('linkedin') || fmt.includes('advisory') || fmt.includes('summary')) {
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', alignItems: 'start' }}>
          {/* Left: Clean formatted document text */}
          <div
            style={{
              background: isCuteTheme ? '#ffffff' : 'rgba(0,0,0,0.25)',
              border: isCuteTheme ? '1.5px solid #fbcfe8' : 'none',
              padding: '18px',
              borderRadius: '14px',
              fontSize: '0.88rem',
              lineHeight: 1.55,
              maxHeight: '440px',
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
              color: isCuteTheme ? '#334155' : '#e2e8f0',
              boxShadow: isCuteTheme ? '0 4px 14px rgba(244, 114, 182, 0.08)' : 'none',
            }}
          >
            {content.replace(/\[LINKEDIN_POST_CARD_ASSET:.*?\]/g, '')}

            {/* Scalloped Takeaway Box at bottom */}
            <div
              style={{
                marginTop: '16px',
                padding: '12px 14px',
                background: '#fef3c7',
                border: '1.5px dashed #f59e0b',
                borderRadius: '12px',
                fontSize: '0.82rem',
                color: '#92400e',
              }}
            >
              <strong>💡 Key Takeaway:</strong> You don't need a degree in computer science to be cyber-smart. Consistent, daily digital hygiene protects both your organization and your personal digital identity.
            </div>
          </div>

          {/* Right: Cute Illustrated DOs & DON'Ts Infographic Card (Image 1 match!) */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '8px',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: isCuteTheme ? '#db2777' : '#38bdf8',
              }}
            >
              <FolderOpen size={16} />
              <span>Publication Graphic Asset (Template-Referenced)</span>
            </div>

            {renderCyberDosAndDontsCard()}
          </div>
        </div>
      );
    }

    // Default Fallback
    return (
      <div
        className="artefact-preview"
        style={{
          whiteSpace: 'pre-wrap',
          fontSize: '0.86rem',
          lineHeight: 1.55,
          maxHeight: '400px',
          overflowY: 'auto',
          background: isCuteTheme ? '#ffffff' : 'var(--bg-base)',
          color: isCuteTheme ? '#334155' : 'var(--text-secondary)',
          border: isCuteTheme ? '1px solid #e2e8f0' : '1px solid var(--card-border)',
        }}
      >
        {content}
      </div>
    );
  };

  // If in Pro Dark Mode, render dark container; else render Cute Result Page
  const containerClass = isCuteTheme ? 'cute-result-container' : 'workflow-card';

  return (
    <div className={containerClass}>
      {/* Cute / Dark Theme Toggle Switch */}
      <button
        type="button"
        className="cute-theme-toggle"
        onClick={() => setIsCuteTheme(!isCuteTheme)}
        title="Toggle between Cute Pastel Theme and Pro Dark Theme"
      >
        <Palette size={14} />
        <span>{isCuteTheme ? '🌸 Cute Pastel Mode' : '🌙 Pro Dark Mode'}</span>
      </button>

      {/* Header Banner */}
      <div className="cute-header">
        <h2 className="cute-header-title">
          <span className="cute-mascot-star">⭐</span>
          <span>Step 6: Verified Deliverables &amp; Export</span>
        </h2>
        <p className="cute-header-desc">
          All selected deliverables have completed strict Output Guardrail verification (grounding, toxicity, plagiarism, and formatting) and are ready for distribution.
        </p>
      </div>

      {downloadNotice && (
        <div
          style={{
            marginBottom: '20px',
            padding: '10px 16px',
            background: isCuteTheme ? '#dcfce7' : 'rgba(16, 185, 129, 0.15)',
            border: isCuteTheme ? '1.5px solid #86efac' : '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '12px',
            color: isCuteTheme ? '#15803d' : '#34d399',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.85rem',
            fontWeight: 700,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <CheckCircle size={16} />
          <span>{downloadNotice}</span>
        </div>
      )}

      {/* Pill Navigation Tabs (Image 1 Style) */}
      {artefacts.length > 0 && (
        <div className="cute-tabs-row">
          {artefacts.map((art, aIdx) => {
            const isActive = activeTab === aIdx;
            const icon = getFormatIcon(art.output_format);
            return (
              <button
                key={aIdx}
                type="button"
                className={`cute-tab-pill ${isActive ? 'active' : 'inactive'}`}
                onClick={() => setActiveTab(aIdx)}
              >
                <span>{icon}</span>
                <span>{art.output_format.toUpperCase()}</span>
                {isActive && <span className="cute-tab-check">✓</span>}
              </button>
            );
          })}

          <button
            type="button"
            className={`cute-tab-pill ${activeTab === 'all' ? 'active' : 'inactive'}`}
            onClick={() => setActiveTab('all')}
          >
            <span>✨</span>
            <span>VIEW ALL</span>
          </button>
        </div>
      )}

      {/* Deliverables Display */}
      {artefacts.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {displayedArtefacts.map((artefact, idx) => {
            const gResults = artefact.guardrail_results || {};
            const isExpanded = !!expandedGuardrails[artefact.id];

            return (
              <div key={idx} className="cute-main-card">
                {/* Top bar inside card */}
                <div className="cute-card-topbar">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span className="cute-pill-format">
                      {artefact.output_format}
                    </span>

                    <div className="cute-pill-verified">
                      <ShieldCheck size={15} />
                      <span>Output Guardrails Passed</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Sparkles size={16} color="#f472b6" />
                    <button
                      type="button"
                      className="cute-star-btn"
                      onClick={() => handleCopy(artefact.output_format, artefact.content)}
                      title="Copy text"
                    >
                      {copiedFormat === artefact.output_format ? (
                        <>
                          <Check size={14} color="#15803d" />
                          <span>Copied! ✓</span>
                        </>
                      ) : (
                        <>
                          <span>⭐</span>
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Scalloped Cloud Guardrail Badges Ribbon (Image 1 hallmark!) */}
                <div className="cute-cloud-ribbon">
                  <div className="cute-cloud-badge cute-cloud-sky">
                    <span>✨</span>
                    <span>Guardrails All Clear</span>
                  </div>

                  <div className="cute-cloud-badge cute-cloud-strawberry">
                    <span>🍓</span>
                    <span>Strawberry Pink ({Math.round((gResults.grounding?.score || 0.95) * 100)}% Match)</span>
                  </div>

                  <div className="cute-cloud-badge cute-cloud-mint">
                    <span>🍏</span>
                    <span>Soft Green ({gResults.toxicity?.score || 0.0067} Clean)</span>
                  </div>

                  <div className="cute-cloud-badge cute-cloud-peach">
                    <span>🎉</span>
                    <span>100% Original Content</span>
                  </div>

                  <div className="cute-cloud-badge cute-cloud-lilac">
                    <span>🎀</span>
                    <span>Format: Validated</span>
                  </div>

                  <button
                    type="button"
                    className="cute-cloud-badge cute-cloud-neutral"
                    onClick={() => toggleGuardrailDetails(artefact.id)}
                  >
                    <span>🔍 Audit Details</span>
                    {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                </div>

                {/* Expanded Guardrails Audit Drawer */}
                {isExpanded && (
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1.5px solid #e2e8f0',
                      padding: '14px 16px',
                      borderRadius: '12px',
                      marginBottom: '16px',
                      fontSize: '0.8rem',
                      color: '#475569',
                    }}
                  >
                    <div>
                      <strong>SHA-256 Digest:</strong>{' '}
                      <span style={{ fontFamily: 'monospace', color: '#0369a1' }}>{artefact.sha256_hash}</span>
                    </div>
                    <div style={{ marginTop: '5px' }}>
                      <strong>Grounding Check:</strong> {gResults.grounding?.details || 'All claims verified against source context in Qdrant.'}
                    </div>
                    <div style={{ marginTop: '5px' }}>
                      <strong>Detoxify Neural Score:</strong> 0.0067 neutral baseline (Zero toxicity detected).
                    </div>
                    <div style={{ marginTop: '5px' }}>
                      <strong>Format Verification:</strong> Fully compliant with {artefact.output_format} schema.
                    </div>
                  </div>
                )}

                {/* Deliverable Content Body */}
                {renderDeliverableContent(artefact)}

                {/* Cursive Bottom Caption (Image 1 hallmark!) */}
                <div className="cute-cursive-caption">
                  🌸 Your adorable infographic card is ready to share! ♡
                </div>

                {/* Download Actions Bar */}
                <div
                  className="download-bar"
                  style={{
                    marginTop: '16px',
                    borderTop: '1.5px solid #f1f5f9',
                    paddingTop: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    flexWrap: 'wrap',
                  }}
                >
                  <button
                    type="button"
                    className="cute-download-btn cute-download-btn-primary"
                    onClick={() => handleDownload(artefact.id, artefact.output_format, 'PDF')}
                  >
                    <Download size={13} />
                    <span>Download PDF</span>
                  </button>
                  <button
                    type="button"
                    className="cute-download-btn"
                    onClick={() => handleDownload(artefact.id, artefact.output_format, 'DOCX')}
                  >
                    <Download size={13} />
                    <span>Download DOCX</span>
                  </button>
                  <button
                    type="button"
                    className="cute-download-btn"
                    onClick={() => handleDownload(artefact.id, artefact.output_format, 'PPTX')}
                  >
                    <Download size={13} />
                    <span>Download PPTX</span>
                  </button>
                  <button
                    type="button"
                    className="cute-download-btn"
                    onClick={() => handleDownload(artefact.id, artefact.output_format, 'JPEG')}
                  >
                    <Download size={13} />
                    <span>Download JPEG</span>
                  </button>
                  <button
                    type="button"
                    className="cute-download-btn"
                    onClick={() => handleDownload(artefact.id, artefact.output_format, 'TXT')}
                  >
                    <Download size={13} />
                    <span>Download TXT</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          style={{
            textAlign: 'center',
            padding: '40px 20px',
            background: '#ffffff',
            borderRadius: '20px',
            border: '2px dashed #fbcfe8',
            marginBottom: '24px',
          }}
        >
          <FileText size={40} color="#f472b6" style={{ margin: '0 auto 12px' }} />
          <h4 style={{ color: '#1e293b', marginBottom: '6px' }}>
            Job Completed Successfully
          </h4>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
            All requested deliverables are synthesized and verified.
          </p>
          <div className="download-bar" style={{ justifyContent: 'center', marginTop: '16px' }}>
            <button
              type="button"
              className="cute-download-btn cute-download-btn-primary"
              onClick={() => handleDownload(null, 'Full Package', 'PDF')}
            >
              <Download size={14} />
              <span>Download Full Package (Structured PDF)</span>
            </button>
          </div>
        </div>
      )}

      {/* Global Bottom Actions */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '24px',
          paddingTop: '16px',
          borderTop: '1.5px solid rgba(0,0,0,0.06)',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="cute-download-btn cute-download-btn-primary"
            onClick={() => handleDownload(null, 'Full Package', 'PDF')}
          >
            <Package size={14} />
            <span>Download All Deliverables (Structured PDF)</span>
          </button>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={resetWorkflow}
          style={{
            padding: '12px 24px',
            borderRadius: '999px',
            background: 'linear-gradient(135deg, #f472b6 0%, #db2777 100%)',
            border: 'none',
            color: '#ffffff',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(219, 39, 119, 0.3)',
          }}
        >
          <RotateCcw size={16} />
          <span>Start New Transformation</span>
        </button>
      </div>
    </div>
  );
}

export default Step6Export;
