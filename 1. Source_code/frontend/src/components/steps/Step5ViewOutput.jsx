import React from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  RotateCcw,
  Sparkles,
  FileCheck,
  Zap,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useJobStatus } from '../../hooks/useJobStatus';

export function Step5ViewOutput() {
  const jobId = useAppStore((state) => state.jobId);
  const setCurrentStep = useAppStore((state) => state.setCurrentStep);
  const resetWorkflow = useAppStore((state) => state.resetWorkflow);

  // Poll job status via React Query
  const { data: job, isLoading, isError, error } = useJobStatus(jobId);

  const status = job?.status || 'queued';

  // Automatically smoothly advance to Step 6 (Export) as soon as transformation is complete
  React.useEffect(() => {
    if (status === 'completed') {
      const timer = setTimeout(() => {
        setCurrentStep(4);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [status, setCurrentStep]);

  return (
    <div className="workflow-card">
      <div className="stage-header">
        <h2 className="stage-title">
          <Activity size={24} color="var(--accent-orange)" />
          Step 5: View Output & Real-Time Monitoring
        </h2>
        <p className="stage-description">
          Monitor your job as it transitions through the Prism AI background pipeline (Redis queue → Celery worker → Multimodal synthesis).
        </p>
      </div>

      <div className="monitoring-card">
        <div className="status-animation-container">
          {status === 'completed' ? (
            <div
              style={{
                width: 90,
                height: 90,
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '3px solid var(--status-completed)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#34d399',
                boxShadow: '0 0 30px rgba(16, 185, 129, 0.4)',
              }}
            >
              <CheckCircle2 size={44} />
            </div>
          ) : status === 'failed' ? (
            <div
              style={{
                width: 90,
                height: 90,
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '3px solid var(--status-failed)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f87171',
              }}
            >
              <AlertTriangle size={44} />
            </div>
          ) : (
            <>
              <div className="status-spinner" />
              <div className="status-center-icon">
                {status === 'queued' ? <Clock size={32} /> : <Zap size={32} />}
              </div>
            </>
          )}
        </div>

        <h3 className={`status-title ${status}`}>
          {status === 'queued' && 'Queued in Background Worker'}
          {status === 'processing' && 'Processing Multimodal Artefacts...'}
          {status === 'completed' && 'Transformation Completed!'}
          {status === 'failed' && 'Transformation Failed'}
        </h3>

        <p className="status-desc">
          {status === 'queued' &&
            'The task has been registered and is waiting for the Celery worker pool to pick up the payload.'}
          {status === 'processing' &&
            'Worker active: Synthesizing requested formats and calculating SHA-256 integrity hashes.'}
          {status === 'completed' &&
            'All multimodal formats have been synthesized and are ready for download and export.'}
          {status === 'failed' &&
            (job?.error_message || 'An unexpected error occurred during execution.')}
        </p>

        {/* Pipeline Stage Indicators */}
        <div className="pipeline-steps">
          <div
            className={`pipeline-item ${
              status === 'queued'
                ? 'active'
                : status === 'processing' || status === 'completed'
                ? 'done'
                : ''
            }`}
          >
            {status === 'processing' || status === 'completed' ? (
              <CheckCircle2 size={18} />
            ) : (
              <Clock size={18} />
            )}
            <span>1. Source Parsed & Input Guardrails Verified (Virus scan clean, PII checked)</span>
          </div>

          <div
            className={`pipeline-item ${
              status === 'processing'
                ? 'active'
                : status === 'completed'
                ? 'done'
                : ''
            }`}
          >
            {status === 'completed' ? (
              <CheckCircle2 size={18} />
            ) : status === 'processing' ? (
              <Activity size={18} className="spin-animation" />
            ) : (
              <Clock size={18} style={{ opacity: 0.4 }} />
            )}
            <span>2. Text Chunking & Qdrant Vectorization (Port 6333 / BAAI-bge-small)</span>
          </div>

          <div
            className={`pipeline-item ${
              status === 'processing'
                ? 'active'
                : status === 'completed'
                ? 'done'
                : ''
            }`}
          >
            {status === 'completed' ? (
              <CheckCircle2 size={18} />
            ) : status === 'processing' ? (
              <Zap size={18} className="spin-animation" />
            ) : (
              <Clock size={18} style={{ opacity: 0.4 }} />
            )}
            <span>3. Multimodal Synthesis (Video, Social, Slides & Advisory Deliverables)</span>
          </div>

          <div
            className={`pipeline-item ${
              status === 'completed' ? 'done' : ''
            }`}
          >
            {status === 'completed' ? (
              <CheckCircle2 size={18} />
            ) : (
              <FileCheck size={18} style={{ opacity: 0.4 }} />
            )}
            <span>4. Output Guardrails Enforced (Grounding, Detoxify, Plagiarism & Format)</span>
          </div>
        </div>


        {/* Job metadata snippet */}
        <div
          style={{
            maxWidth: 550,
            margin: '0 auto 24px',
            padding: '12px 16px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.78rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span>JOB ID: {jobId ? `${jobId.slice(0, 18)}...` : 'N/A'}</span>
          <span>POLLING INTERVAL: 2.0s</span>
        </div>
      </div>

      <div className="stage-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setCurrentStep(2)}
          disabled={status === 'processing'}
        >
          <span>Back to Parameters</span>
        </button>

        {status === 'completed' ? (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setCurrentStep(4)}
            style={{ padding: '14px 28px' }}
          >
            <span>Proceed to Export Artefacts</span>
            <ArrowRight size={16} />
          </button>
        ) : status === 'failed' ? (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={resetWorkflow}
          >
            <RotateCcw size={16} />
            <span>Restart Workflow</span>
          </button>
        ) : (
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Please wait while processing completes...
          </div>
        )}
      </div>
    </div>
  );
}

export default Step5ViewOutput;
