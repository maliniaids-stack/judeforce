import React from 'react';
import { Check } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const STEPS = [
  { id: 1, label: 'Prompt & Attach' },
  { id: 2, label: 'Format & Parameters' },
  { id: 3, label: 'View Output' },
  { id: 4, label: 'Export' },
];

export function StepIndicator() {
  const currentStep = useAppStore((state) => state.currentStep);
  const setCurrentStep = useAppStore((state) => state.setCurrentStep);
  const jobStatus = useAppStore((state) => state.jobStatus);
  const prompt = useAppStore((state) => state.prompt);
  const sourceContentId = useAppStore((state) => state.sourceContentId);

  const canNavigateTo = (stepId) => {
    if (stepId < currentStep) return true;
    if (stepId === 2 && (prompt.trim() || sourceContentId)) return true;
    if (stepId === 4 && jobStatus === 'completed') return true;
    return false;
  };

  return (
    <nav className="step-indicator-card" aria-label="Workflow progress">
      <ol className="steps-list">
        {STEPS.map((step, index) => {
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id || (step.id === 3 && jobStatus === 'completed');
          const isClickable = canNavigateTo(step.id);

          return (
            <React.Fragment key={step.id}>
              <li>
                <button
                  type="button"
                  className={`step-item ${isActive ? 'active' : ''} ${
                    isCompleted ? 'completed' : ''
                  }`}
                  disabled={!isClickable}
                  onClick={() => isClickable && setCurrentStep(step.id)}
                  title={`Stage ${step.id}: ${step.label}`}
                >
                  <div className="step-bubble">
                    {isCompleted ? <Check size={16} strokeWidth={3} /> : step.id}
                  </div>
                  <span className="step-label">{step.label}</span>
                </button>
              </li>
              {index < STEPS.length - 1 && (
                <div
                  className={`step-connector ${
                    currentStep > index + 1 ? 'filled' : ''
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}

export default StepIndicator;
