import React from 'react';
import Header from './components/Header';
import StepIndicator from './components/StepIndicator';
import ScreenAPromptAttach from './components/steps/ScreenAPromptAttach';
import ScreenBFormatParams from './components/steps/ScreenBFormatParams';
import Step5ViewOutput from './components/steps/Step5ViewOutput';
import Step6Export from './components/steps/Step6Export';
import { useAppStore } from './store/useAppStore';

function App() {
  const currentStep = useAppStore((state) => state.currentStep);

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <ScreenAPromptAttach />;
      case 2:
        return <ScreenBFormatParams />;
      case 3:
        return <Step5ViewOutput />;
      case 4:
        return <Step6Export />;
      default:
        return <ScreenAPromptAttach />;
    }
  };

  return (
    <div className="app-shell-root">
      {currentStep > 2 ? (
        <div className="app-container">
          <Header />
          <StepIndicator />
          <main>{renderCurrentStep()}</main>
          <footer className="app-footer">
            <span>Prism AI Multimodal Content Transformation Platform</span>
            <span>•</span>
            <span>Enforced Input & Output Guardrails</span>
            <span>•</span>
            <span>Qdrant Vector DB Ingested</span>
          </footer>
        </div>
      ) : (
        renderCurrentStep()
      )}
    </div>
  );
}

export default App;
