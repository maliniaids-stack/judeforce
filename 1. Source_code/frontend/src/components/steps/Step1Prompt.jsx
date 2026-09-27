import React, { useState } from 'react';
import { ArrowRight, Sparkles, Plus, FileText, Video, Share2, MessageCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

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

export function Step1Prompt() {
  const prompt = useAppStore((state) => state.prompt);
  const setPrompt = useAppStore((state) => state.setPrompt);
  const setOutputFormats = useAppStore((state) => state.setOutputFormats);
  const setCurrentStep = useAppStore((state) => state.setCurrentStep);
  const [selectedPresetId, setSelectedPresetId] = useState(null);

  const applyPreset = (preset) => {
    setPrompt(preset.prompt);
    setOutputFormats(preset.targetFormats);
    setSelectedPresetId(preset.id);
  };

  const handleContinue = (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setCurrentStep(2);
  };

  return (
    <div className="workflow-card grid-canvas-bg">
      <div className="stage-header">
        <h2 className="stage-title">
          <Sparkles size={24} color="var(--accent-orange)" />
          Step 1: Input Transformation Directive
        </h2>
        <p className="stage-description">
          Provide custom directives or select a specialized template workflow. Prism AI automatically parses requirements, routes tasks to local fine-tuned LLMs, and enforces strict factual guardrails.
        </p>
      </div>

      <form onSubmit={handleContinue}>
        {/* Central Search/Prompt Input Box styled like Image 1 */}
        <div className="hero-prompt-box">
          <div className="hero-prompt-bar">
            <button
              type="button"
              className="attach-quick-btn"
              title="Quick Attach File"
              onClick={() => setCurrentStep(2)}
            >
              <Plus size={20} />
            </button>
            <textarea
              className="hero-prompt-input"
              placeholder="What would you like to do today? Enter your prompt or pick a preset workflow below..."
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                setSelectedPresetId(null);
              }}
              rows={6}
              required
              autoFocus
            />
            <button
              type="submit"
              className="hero-submit-btn"
              disabled={!prompt.trim()}
              title="Submit & Continue"
            >
              <ArrowRight size={20} />
            </button>
          </div>
          <div className="prompt-bar-footer">
            <span className="char-counter">{prompt.length} characters</span>
            {selectedPresetId && (
              <span className="preset-active-badge">
                <CheckCircle2 size={13} /> Workflow Preset Loaded
              </span>
            )}
          </div>
        </div>

        {/* Specialized Feature Workflow Cards styled like Image 3 */}
        <div className="presets-section">
          <div className="presets-label">
            <Sparkles size={14} color="var(--accent-orange)" style={{ marginRight: '6px' }} />
            Select Sample Use-Case Template (Click to Auto-Fill Prompt & Formats)
          </div>

          <div className="preset-cards-grid">
            {PROMPT_PRESETS.map((preset) => {
              const IconComp = preset.icon;
              const isSelected = selectedPresetId === preset.id;
              return (
                <div
                  key={preset.id}
                  className={`preset-card ${isSelected ? 'active-preset' : ''}`}
                  onClick={() => applyPreset(preset)}
                >
                  <div className="preset-card-header">
                    <div className="preset-card-icon">
                      <IconComp size={18} />
                    </div>
                    <span className="preset-category-tag">{preset.category}</span>
                  </div>
                  <h4 className="preset-card-title">{preset.title}</h4>
                  <p className="preset-card-desc">{preset.shortDesc}</p>
                  <div className="preset-card-footer">
                    <span className="preset-format-pill">
                      {preset.targetFormats.join(', ')}
                    </span>
                    <span className="preset-card-arrow">→</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="stage-actions" style={{ justifyContent: 'flex-end' }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!prompt.trim()}
          >
            <span>Continue to Attach Source</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}

export default Step1Prompt;

