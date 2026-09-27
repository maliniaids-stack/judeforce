import React from 'react';
import {
  Layers,
  Video,
  Share2,
  FileCheck,
  MessageCircle,
  Presentation,
  PieChart,
  FileText,
  Check,
  ArrowRight,
  ArrowLeft,
  CheckSquare,
  Square,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

const FORMAT_OPTIONS = [
  {
    id: 'Video',
    label: 'Video',
    icon: Video,
    description: 'Dynamic storyboard script, timed scene narration, visual cue breakdowns, and video rendering guidelines.',
    category: 'Motion & Visual',
  },
  {
    id: 'LinkedIn Post',
    label: 'LinkedIn Post',
    icon: Share2,
    description: 'High-engagement thought leadership post with attention hooks, insight formatting, and relevant hashtags.',
    category: 'Executive Social',
  },
  {
    id: 'Advisory',
    label: 'Advisory',
    icon: FileCheck,
    description: 'Formal policy, technical, or strategic advisory memo detailing contextual evaluation and recommendations.',
    category: 'Strategic Brief',
  },
  {
    id: 'Twitter/X Post',
    label: 'Twitter/X Post',
    icon: MessageCircle,
    description: 'Bite-sized viral thread with compelling opening hook, numbered key insights, and strong closing CTA.',
    category: 'Micro-Social',
  },
  {
    id: 'PPT/Presentation',
    label: 'PPT/Presentation',
    icon: Presentation,
    description: 'Structured slide outlines with title headers, talking points, metrics callouts, and presentation layouts.',
    category: 'Decks & Keynotes',
  },
  {
    id: 'Infographic',
    label: 'Infographic',
    icon: PieChart,
    description: 'Visual content hierarchy, quantitative statistics, comparative tables, and diagrammatic descriptions.',
    category: 'Data Visual',
  },
  {
    id: 'Executive Summary',
    label: 'Executive Summary',
    icon: FileText,
    description: 'Concise, high-level briefing outlining strategic objectives, key findings, and decision-making imperatives.',
    category: 'Leadership',
  },
];

export function Step3SelectFormat() {
  const outputFormats = useAppStore((state) => state.outputFormats);
  const toggleOutputFormat = useAppStore((state) => state.toggleOutputFormat);
  const setOutputFormats = useAppStore((state) => state.setOutputFormats);
  const setCurrentStep = useAppStore((state) => state.setCurrentStep);

  const selectAll = () => {
    setOutputFormats(FORMAT_OPTIONS.map((f) => f.id));
  };

  const clearAll = () => {
    setOutputFormats([]);
  };

  return (
    <div className="workflow-card">
      <div className="stage-header">
        <h2 className="stage-title">
          <Layers size={24} color="var(--accent-orange)" />
          Step 3: Select Multimodal Formats
        </h2>
        <p className="stage-description">
          Choose one or multiple artefact formats for simultaneous synthesis. Prism AI will generate synchronized content assets tailored to each channel.
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Selected formats: <strong style={{ color: 'var(--accent-orange)' }}>{outputFormats.length}</strong> of {FORMAT_OPTIONS.length}
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={selectAll}
            style={{ padding: '6px 12px', fontSize: '0.78rem' }}
          >
            <CheckSquare size={13} />
            <span>Select All</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={clearAll}
            style={{ padding: '6px 12px', fontSize: '0.78rem' }}
          >
            <Square size={13} />
            <span>Clear</span>
          </button>
        </div>
      </div>

      <div className="formats-grid">
        {FORMAT_OPTIONS.map((format) => {
          const isSelected = outputFormats.includes(format.id);
          const IconComponent = format.icon;

          return (
            <div
              key={format.id}
              className={`format-card ${isSelected ? 'selected' : ''}`}
              onClick={() => toggleOutputFormat(format.id)}
            >
              <div className="format-icon-box">
                <IconComponent size={20} />
              </div>
              <div className="format-content">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h4>{format.label}</h4>
                  <span
                    style={{
                      fontSize: '0.65rem',
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {format.category}
                  </span>
                </div>
                <p>{format.description}</p>
              </div>

              <div className="format-checkbox">
                {isSelected && <Check size={13} strokeWidth={3} />}
              </div>
            </div>
          );
        })}
      </div>

      <div className="stage-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setCurrentStep(2)}
        >
          <ArrowLeft size={16} />
          <span>Back to Attach Source</span>
        </button>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setCurrentStep(4)}
          disabled={outputFormats.length === 0}
        >
          <span>Continue to Parameters ({outputFormats.length})</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

export default Step3SelectFormat;
