import React, { useState } from 'react';
import { Sliders, Sparkles, ArrowLeft, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { generateOutput } from '../../api/client';

const TONES = [
  'Professional',
  'Authoritative',
  'Casual',
  'Inspiring',
  'Technical',
  'Conversational',
];

const AUDIENCES = [
  'C-Suite / Executives',
  'Technical Practitioners',
  'General Public',
  'Investors',
  'Internal Team',
];

const LANGUAGES = [
  'English (US)',
  'English (UK)',
  'Spanish',
  'French',
  'German',
  'Japanese',
  'Mandarin',
];

const DETAIL_LEVELS = [
  'High-Level / Concise',
  'Balanced / Standard',
  'Comprehensive / Deep-Dive',
];

export function Step4Parameters() {
  const prompt = useAppStore((state) => state.prompt);
  const sourceContentId = useAppStore((state) => state.sourceContentId);
  const sourceFileName = useAppStore((state) => state.sourceFileName);
  const outputFormats = useAppStore((state) => state.outputFormats);
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
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        prompt: prompt,
        source_content_id: sourceContentId || null,
        output_formats: outputFormats,
        generation_params: generationParams,
      };

      const response = await generateOutput(payload);
      setJobId(response.id);
      setJobStatus(response.status);
      // Advance to Step 5: View Output
      setCurrentStep(5);
    } catch (err) {
      console.error('Generation request failed:', err);
      setSubmitError(
        err.response?.data?.detail || 'Failed to dispatch generation job to Celery worker.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="workflow-card">
      <div className="stage-header">
        <h2 className="stage-title">
          <Sliders size={24} color="var(--accent-orange)" />
          Step 4: Generation Parameters
        </h2>
        <p className="stage-description">
          Fine-tune the voice, audience resonance, localization, and depth of the generated outputs.
        </p>
      </div>

      <div className="params-grid">
        <div className="param-group">
          <label className="param-label" htmlFor="param-tone">Tone of Voice</label>
          <select
            id="param-tone"
            className="param-select"
            value={generationParams.tone || 'Professional'}
            onChange={(e) => handleParamChange('tone', e.target.value)}
          >
            {TONES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="param-group">
          <label className="param-label" htmlFor="param-audience">Target Audience</label>
          <select
            id="param-audience"
            className="param-select"
            value={generationParams.audience || 'C-Suite / Executives'}
            onChange={(e) => handleParamChange('audience', e.target.value)}
          >
            {AUDIENCES.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        <div className="param-group">
          <label className="param-label" htmlFor="param-language">Language & Locale</label>
          <select
            id="param-language"
            className="param-select"
            value={generationParams.language || 'English (US)'}
            onChange={(e) => handleParamChange('language', e.target.value)}
          >
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>

        <div className="param-group">
          <label className="param-label" htmlFor="param-detail">Detail Level</label>
          <select
            id="param-detail"
            className="param-select"
            value={generationParams.detail || 'Balanced / Standard'}
            onChange={(e) => handleParamChange('detail', e.target.value)}
          >
            {DETAIL_LEVELS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Review summary box */}
      <div className="pre-generation-summary">
        <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px' }}>
          Transformation Job Configuration Summary
        </h4>
        <div className="summary-row">
          <span className="summary-label">Prompt Preview</span>
          <span className="summary-value" title={prompt}>
            {prompt.length > 70 ? `${prompt.slice(0, 70)}...` : prompt}
          </span>
        </div>
        <div className="summary-row">
          <span className="summary-label">Source Document</span>
          <span className="summary-value">
            {sourceFileName || 'Direct synthesis (No source file attached)'}
          </span>
        </div>
        <div className="summary-row">
          <span className="summary-label">Target Formats ({outputFormats.length})</span>
          <span className="summary-value">
            {outputFormats.join(', ')}
          </span>
        </div>
      </div>

      {submitError && (
        <div
          style={{
            marginBottom: '18px',
            padding: '12px 16px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-sm)',
            color: '#f87171',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.85rem',
          }}
        >
          <AlertCircle size={18} />
          <span>{submitError}</span>
        </div>
      )}

      <div className="stage-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setCurrentStep(3)}
          disabled={isSubmitting}
        >
          <ArrowLeft size={16} />
          <span>Back to Format Selection</span>
        </button>

        <button
          type="button"
          className="btn btn-primary"
          onClick={handleGenerate}
          disabled={isSubmitting}
          style={{ padding: '14px 28px', fontSize: '0.95rem' }}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={18} className="spin-animation" />
              <span>Dispatching Job...</span>
            </>
          ) : (
            <>
              <Sparkles size={18} />
              <span>Generate Output</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default Step4Parameters;
