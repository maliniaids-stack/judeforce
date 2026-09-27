import React, { useState } from 'react';
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  AlertCircle,
  Video,
  Share2,
  MessageCircle,
  ShieldAlert,
  Check,
  ArrowRight,
  Layers,
  Sliders,
  Layout,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { generateOutput } from '../../api/client';

const PROMPT_PRESETS = [
  {
    id: 'text-video',
    title: '1. TEXT → VIDEO SCRIPT',
    category: 'Motion & Visual',
    icon: Video,
    targetFormats: ['Video'],
    shortDesc: '2-min Educational Video Script on Cybersecurity',
    prompt: `Transform the following text into a 2-minute educational video script.

Topic: Cybersecurity's Need in Today's World

Text:
The digital revolution has transformed the way we live and work. But with every technological advancement comes a new wave of lurking threats in the vast online landscape. Cybersecurity, once a niche concern, has become the cornerstone of protecting your business’s most valuable assets: data, reputation, and financial well-being. Cyber security encompasses the practices and technologies designed to protect systems, networks, and data from cyber attacks. Attacks can range from data breaches to ransomware and phishing scams to advanced persistent threats. The consequences of a successful cyber attack can be devastating, leading to financial loss, operational disruption, legal liabilities, and damage to your brand’s reputation. It is no longer just the credit card but these attacks can affect your business assets, reputation and data. Don’t let your business become the next statistic. Let’s explore why a robust cybersecurity strategy is no longer a luxury, but a digital lifeline.

Create:
- A clear introduction
- 3–4 important points
- Real-world examples
- A short conclusion
- Voiceover narration
- Suggested visuals for each section

Keep the language simple and suitable for college students.`,
  },
  {
    id: 'pdf-linkedin',
    title: '2. PDF/DOCX → LINKEDIN POST',
    category: 'Professional Social',
    icon: Share2,
    targetFormats: ['LinkedIn Post'],
    shortDesc: 'Analyze Course Completion Certificate for LinkedIn',
    prompt: `I am uploading my course completion certificate.

Analyze the certificate and extract the relevant information such as:
- Course name
- Issuing organization/institution
- Completion date
- Skills or subject covered, if mentioned
- Certificate title

Create a professional LinkedIn post announcing my course completion.

The post should:
- Start with an engaging opening
- Mention the course and issuing organization
- Briefly explain what I learned
- Mention 2–4 key skills or concepts gained
- Express appreciation to the organization/instructors
- End with a positive learning/career-oriented takeaway
- Include 4–6 relevant hashtags
- Do not invent any information that is not present on the certificate

Keep the tone professional, natural, and suitable for a college student.`,
  },
  {
    id: 'pdf-twitter',
    title: '3. PDF/DOCX → TWITTER/X THREAD',
    category: 'Micro-Social',
    icon: MessageCircle,
    targetFormats: ['Twitter/X Post'],
    shortDesc: 'Python Functions Chapter into 5–7 Post Thread',
    prompt: `I am attaching my subject course book as the PDF file named "Python".

Using the section about "Functions", create a Twitter/X thread.

Requirements:
- 5–7 short posts
- Each post should be concise
- Explain the concept progressively
- Include important technical terms
- Include one practical example
- End with a summary
- Avoid unnecessary information.`,
  },
  {
    id: 'pdf-advisory',
    title: '4. PDF/DOCX → SECURITY ADVISORY',
    category: 'Strategic Brief',
    icon: ShieldAlert,
    targetFormats: ['Advisory', 'Executive Summary'],
    shortDesc: 'Cybersecurity Threats PDF into 8-Section Advisory',
    prompt: `I am attaching my cybersecurity course material as the PDF file named "Cybersecurity_Threats".

Using the information from the document, create a cybersecurity advisory about:

"[CYBERSECURITY THREAT]"

Structure the advisory as:
1. Advisory Title
2. Threat Overview
3. Who Can Be Affected
4. How the Attack Works
5. Warning Signs
6. Recommended Actions
7. Prevention Measures
8. Conclusion

Keep the advisory factual, clear, and suitable for students and general users.`,
  },
];

const FORMAT_OPTIONS = [
  { id: 'Video', label: 'Video (Script, Storyboard, Subtitles & Visuals)', icon: '🎬' },
  { id: 'LinkedIn Post', label: 'LinkedIn Post (With #Hashtags & Image)', icon: '💼' },
  { id: 'Presentation', label: 'Presentation (6-Slide Deck & Notes)', icon: '📊' },
  { id: 'Advisory', label: 'Cybersecurity Advisory (8 Sections)', icon: '🛡️' },
  { id: 'Infographic', label: 'Infographic (Visual Flow, Dials & Graphs)', icon: '📈' },
  { id: 'Concept Notes', label: 'Structured Concept Sheet & Flowchart (Image 3 Style)', icon: '📝' },
  { id: 'Twitter/X Post', label: 'Twitter / X Thread (1/ to 7/)', icon: '🐦' },
  { id: 'Executive Summary', label: 'Executive Summary Briefing', icon: '📑' },
];

const TONES = [
  'Educational & Student-Friendly',
  'Professional & Warning-Focused',
  'Authoritative & Directive',
  'Technical & Analytical',
  'Conversational & Engaging',
];

const AUDIENCES = [
  'Students & Academic Community',
  'Organizations & Enterprise Teams',
  'C-Suite & Executive Leadership',
  'Technical Practitioners & SecOps',
  'General Public & Consumers',
];

const LANGUAGES = [
  'English (US)',
  'English (UK)',
  'Hindi (हिंदी)',
  'Spanish',
  'French',
  'German',
  'Japanese',
  'Mandarin',
];

const DETAIL_LEVELS = [
  'High-Level / Directive',
  'Balanced / Standard',
  'Comprehensive / Deep-Dive',
];

export function ScreenBFormatParams() {
  const prompt = useAppStore((state) => state.prompt);
  const sourceContentId = useAppStore((state) => state.sourceContentId);
  const sourceFileName = useAppStore((state) => state.sourceFileName);
  const outputFormats = useAppStore((state) => state.outputFormats);
  const toggleOutputFormat = useAppStore((state) => state.toggleOutputFormat);
  const generationParams = useAppStore((state) => state.generationParams);
  const setGenerationParams = useAppStore((state) => state.setGenerationParams);
  const setCurrentStep = useAppStore((state) => state.setCurrentStep);
  const setJobId = useAppStore((state) => state.setJobId);
  const setJobStatus = useAppStore((state) => state.setJobStatus);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const handleParamChange = (field, value) => {
    setGenerationParams({ [field]: value });
  };

  const handleGenerate = async () => {
    if (outputFormats.length === 0) {
      setSubmitError('Please select at least one output deliverable.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        prompt: prompt || 'Synthesize multimodal content from attached material.',
        source_content_id: sourceContentId || null,
        output_formats: outputFormats,
        generation_params: generationParams,
      };

      const response = await generateOutput(payload);
      setJobId(response.id);
      setJobStatus(response.status);
      setCurrentStep(3);
    } catch (err) {
      console.error('Generation request failed:', err);
      setSubmitError(
        err.response?.data?.detail || 'Failed to dispatch generation job to backend worker.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="screen-b-container">
      <div className="screen-b-wrapper">
        {/* Back link above panel */}
        <button
          type="button"
          className="back-link-btn"
          onClick={() => setCurrentStep(1)}
        >
          <ArrowLeft size={16} />
          <span>Back to prompt & source</span>
        </button>

        {/* 3 Side-by-Side Cards */}
        <div className="screen-b-cards-row">
          {/* Card 1: Select Output Deliverables */}
          <div className="screen-b-card">
            <div className="screen-b-card-top-icon">
              <Layers size={28} color="#E8622C" />
            </div>
            <h3 className="screen-b-card-main-title">Select output deliverables</h3>

            <div className="screen-b-tag-badge">DELIVERABLES REQUIRED</div>

            <div className="screen-b-checkboxes-list">
              {FORMAT_OPTIONS.map((item) => {
                const isChecked = outputFormats.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className={`screen-b-checkbox-item ${isChecked ? 'checked' : ''}`}
                    onClick={() => toggleOutputFormat(item.id)}
                    style={{ padding: '9px 12px' }}
                  >
                    <div className="custom-checkbox">
                      {isChecked && <Check size={13} strokeWidth={3} />}
                    </div>
                    <span style={{ fontSize: '0.84rem' }}>{item.label}</span>
                  </div>
                );
              })}
            </div>

            <div className="card-arrow-footer">
              <span className="card-footer-info">{outputFormats.length} deliverable(s) selected</span>
              <button type="button" className="card-mini-arrow-btn" title="Formats Ready">
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* Card 2: Select Generation Parameters */}
          <div className="screen-b-card">
            <div className="screen-b-card-top-icon">
              <Sliders size={28} color="#2563EB" />
            </div>
            <h3 className="screen-b-card-main-title">Generation parameters</h3>

            <div className="screen-b-tag-badge">TONE & AUDIENCE TARGETING</div>

            <div className="screen-b-2x2-grid">
              <div className="screen-b-dropdown-group">
                <label htmlFor="b-tone">Tone of Voice</label>
                <select
                  id="b-tone"
                  value={generationParams.tone || TONES[0]}
                  onChange={(e) => handleParamChange('tone', e.target.value)}
                >
                  {TONES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="screen-b-dropdown-group">
                <label htmlFor="b-audience">Target Audience</label>
                <select
                  id="b-audience"
                  value={generationParams.audience || AUDIENCES[0]}
                  onChange={(e) => handleParamChange('audience', e.target.value)}
                >
                  {AUDIENCES.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              <div className="screen-b-dropdown-group">
                <label htmlFor="b-language">Language & Locale</label>
                <select
                  id="b-language"
                  value={generationParams.language || 'English (US)'}
                  onChange={(e) => handleParamChange('language', e.target.value)}
                >
                  {LANGUAGES.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>

              <div className="screen-b-dropdown-group">
                <label htmlFor="b-detail">Level of Detail</label>
                <select
                  id="b-detail"
                  value={generationParams.detail || 'High-Level / Directive'}
                  onChange={(e) => handleParamChange('detail', e.target.value)}
                >
                  {DETAIL_LEVELS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Infographic Visual Template Selector (Optional) */}
            <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label htmlFor="b-infographic-template" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>
                  Infographic Template (Optional)
                </label>
                <span style={{ fontSize: '0.68rem', color: '#0284c7', fontWeight: 600 }}>Visual Style</span>
              </div>
              <select
                id="b-infographic-template"
                value={generationParams.infographicTemplate || 'chevrons'}
                onChange={(e) => {
                  handleParamChange('infographicTemplate', e.target.value);
                  if (!outputFormats.includes('Infographic')) {
                    toggleOutputFormat('Infographic');
                  }
                }}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  fontSize: '0.82rem',
                  color: '#1e293b',
                }}
              >
                <option value="chevrons">⏩ 1. Flow Chevrons (Steps 01-04)</option>
                <option value="circular">🌸 2. Circular Petal Wheel (Radial Hub)</option>
                <option value="metrics">📊 3. Metric Stat Rings (Percentage Dials)</option>
                <option value="graph">📈 4. Bar & Line Trend Graph</option>
                <option value="roadmap">🗺️ 5. Milestone Timeline (Sequential Pins)</option>
                <option value="cards">📑 6. Data Feature Cards (Categorized Grid)</option>
              </select>
            </div>

            {/* UI Reference Template (Optional - Image 3 Style) */}
            <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label htmlFor="b-ui-template" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>
                  UI Reference Template (Optional)
                </label>
                <span style={{ fontSize: '0.68rem', color: '#7c3aed', fontWeight: 600 }}>Design Match</span>
              </div>
              <select
                id="b-ui-template"
                value={generationParams.uiTemplate || 'none'}
                onChange={(e) => {
                  const val = e.target.value;
                  handleParamChange('uiTemplate', val);
                  if (val === 'concept_notes' && !outputFormats.includes('Concept Notes')) {
                    toggleOutputFormat('Concept Notes');
                  }
                }}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  fontSize: '0.82rem',
                  color: '#1e293b',
                }}
              >
                <option value="none">Auto / Default Platform Layout</option>
                <option value="concept_notes">📑 Concept Sheet & Flowchart (Image 3 Reference)</option>
                <option value="cute_card">🌸 Cute Educational Card (Image 1 Reference)</option>
              </select>
            </div>

            <div className="card-arrow-footer">
              <span className="card-footer-info">Parameters configured</span>
              <button type="button" className="card-mini-arrow-btn" title="Parameters Ready">
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* Card 3: Review & Synthesis Action */}
          <div className="screen-b-card">
            <div className="screen-b-card-top-icon">
              <Layout size={28} color="#7C3AED" />
            </div>
            <h3 className="screen-b-card-main-title">Review & synthesis</h3>

            <div className="screen-b-tag-badge">ENFORCED PIPELINE</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '14px 0', flex: 1 }}>
              {/* Source summary */}
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.04)',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                }}
              >
                <div style={{ fontWeight: 600, color: '#334155', marginBottom: '2px' }}>
                  Source Attachment:
                </div>
                <div style={{ color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {sourceFileName ? `📄 ${sourceFileName}` : '✍️ Direct Prompt Directive'}
                </div>
              </div>

              {/* Output Guardrails Assurance Box */}
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                }}
              >
                <div style={{ fontWeight: 600, color: '#059669', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🛡️ Output Guardrails Enforced:</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: '16px', color: '#047857', lineHeight: 1.4, fontSize: '0.76rem' }}>
                  <li>Grounding check against source facts</li>
                  <li>Toxicity & safety scan (Detoxify)</li>
                  <li>Plagiarism & fidelity verification</li>
                  <li>Structural compliance & format check</li>
                </ul>
              </div>

              {/* Selected Formats Pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: 'auto' }}>
                {outputFormats.map((f) => (
                  <span
                    key={f}
                    style={{
                      background: 'rgba(37, 99, 235, 0.1)',
                      color: '#2563eb',
                      fontSize: '0.72rem',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontWeight: 600,
                    }}
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>

            {submitError && (
              <div className="screen-b-error-box" style={{ marginBottom: '10px' }}>
                <AlertCircle size={16} />
                <span>{submitError}</span>
              </div>
            )}

            <button
              type="button"
              className="generate-btn-blue"
              onClick={handleGenerate}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="spin-animation" />
                  <span>Synthesizing deliverables...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Generate output ({outputFormats.length})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ScreenBFormatParams;

