import React, { useState, useEffect } from 'react';
import { Layers, RotateCcw, Activity } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { checkHealth } from '../api/client';

export function Header() {
  const resetWorkflow = useAppStore((state) => state.resetWorkflow);
  const currentStep = useAppStore((state) => state.currentStep);
  const [backendStatus, setBackendStatus] = useState('checking');

  useEffect(() => {
    let mounted = true;
    checkHealth()
      .then((data) => {
        if (mounted && data.status === 'healthy') {
          setBackendStatus('connected');
        }
      })
      .catch(() => {
        if (mounted) setBackendStatus('offline-local');
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="brand-icon-wrapper">
          <Layers size={22} />
        </div>
        <div className="brand-titles">
          <h1>
            Prism AI
            <span className="brand-badge">Phase 1</span>
          </h1>
          <p className="brand-subtitle">
            Offline-Capable Multimodal Content Transformation Platform
          </p>
        </div>
      </div>

      <div className="header-actions">
        <div className="status-pill">
          <span className="pulse-dot" />
          <span>{backendStatus === 'connected' ? 'Core Engine Online' : 'Local Offline Mode'}</span>
        </div>

        {currentStep > 1 && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={resetWorkflow}
            title="Reset to Step 1"
            style={{ padding: '8px 14px', fontSize: '0.8rem' }}
          >
            <RotateCcw size={14} />
            <span>New Transformation</span>
          </button>
        )}
      </div>
    </header>
  );
}

export default Header;
