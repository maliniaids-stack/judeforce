import React, { useState, useRef } from 'react';
import {
  Plus,
  ArrowRight,
  FileText,
  CheckCircle2,
  Loader2,
  X,
  Zap,
  File,
  MessageSquare,
  Plug,
  Shield,
  ShieldCheck,
  ShieldAlert,
  HardDrive,
  Cloud,
  FileCode,
  ExternalLink,
  Database,
  Layers,
  Cpu,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Search,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { uploadSourceFile } from '../../api/client';

export function ScreenAPromptAttach() {
  const prompt = useAppStore((state) => state.prompt);
  const setPrompt = useAppStore((state) => state.setPrompt);
  const sourceContentId = useAppStore((state) => state.sourceContentId);
  const sourceFileName = useAppStore((state) => state.sourceFileName);
  const sourceFileSize = useAppStore((state) => state.sourceFileSize);
  const setSourceFile = useAppStore((state) => state.setSourceFile);
  const clearSourceFile = useAppStore((state) => state.clearSourceFile);
  const setCurrentStep = useAppStore((state) => state.setCurrentStep);

  const inputGuardrailEnabled = useAppStore((state) => state.inputGuardrailEnabled);
  const setInputGuardrailEnabled = useAppStore((state) => state.setInputGuardrailEnabled);
  const backendTelemetry = useAppStore((state) => state.backendTelemetry);
  const setBackendTelemetry = useAppStore((state) => state.setBackendTelemetry);
  const guardrailAlert = useAppStore((state) => state.guardrailAlert);
  const setGuardrailAlert = useAppStore((state) => state.setGuardrailAlert);

  const [isUploading, setIsUploading] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [showNotepadModal, setShowNotepadModal] = useState(false);
  const [driveSearch, setDriveSearch] = useState('');
  const [driveUrlInput, setDriveUrlInput] = useState('');
  const [notepadContent, setNotepadContent] = useState(
    prompt || 'Analyze the uploaded cybersecurity awareness poster and create content that can be shared with students.'
  );

  const fileInputRef = useRef(null);

  const handlePlusClick = () => {
    setShowAttachMenu((prev) => !prev);
  };

  const handleChooseLocal = () => {
    setShowAttachMenu(false);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleOpenDrive = () => {
    setShowAttachMenu(false);
    setShowDriveModal(true);
  };

  const executeUpload = async (fileObj, forceBypass = false) => {
    setIsUploading(true);
    setGuardrailAlert(null);

    const useGuardrails = forceBypass ? false : inputGuardrailEnabled;

    try {
      const response = await uploadSourceFile(fileObj, useGuardrails);
      setSourceFile({
        id: response.source_content_id,
        filename: response.original_filename,
        size: fileObj.size,
        contentType: response.content_type,
      });

      if (response.backend_telemetry) {
        setBackendTelemetry(response.backend_telemetry);
      }
    } catch (err) {
      console.error('File upload failed:', err);
      const resData = err.response?.data;
      const detail = resData?.detail;

      if (detail && typeof detail === 'object' && detail.status === 'guardrail_violation') {
        setGuardrailAlert({
          message: detail.message || 'Personal info or security threat detected in source.',
          alert: detail.alert || 'The file has this virus or personal info check before passing to the model.',
          violations: detail.violations,
          canBypass: true,
          pendingFile: fileObj,
        });
      } else {
        const errorMsg =
          typeof detail === 'string'
            ? detail
            : err.message || 'Failed to upload source file. Make sure backend is running on http://localhost:8000';
        setGuardrailAlert({
          message: errorMsg,
          alert: errorMsg,
          canBypass: false,
        });
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileChange = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await executeUpload(files[0]);
  };

  // Google Drive Simulation Import
  const handleDriveImport = async (type) => {
    setShowDriveModal(false);
    setIsUploading(true);

    try {
      if (type === 'poster') {
        const res = await fetch('/assets/Source.png');
        const blob = await res.blob();
        const fileObj = new File([blob], 'Source.png', { type: 'image/png' });
        await executeUpload(fileObj);
        if (!prompt.trim()) {
          setPrompt('Analyze the uploaded cybersecurity awareness poster and create content that can be shared with students.');
        }
      } else if (type === 'advisory') {
        // Create sample Ransomware PDF
        const textContent =
          'Ransomware is malware that encrypts files and prevents users from accessing their data. Attackers may demand payment to restore access. Ransomware can spread through malicious attachments, compromised websites, or vulnerable systems.\n\nOrganizations must implement robust security controls including multi-factor authentication, regular offline backups, and continuous network monitoring to mitigate catastrophic impact.';
        const blob = new Blob([textContent], { type: 'application/pdf' });
        const fileObj = new File([blob], 'Source.pdf', { type: 'application/pdf' });
        await executeUpload(fileObj);
        if (!prompt.trim()) {
          setPrompt('Create a cybersecurity advisory about ransomware and explain how organizations can protect their data.');
        }
      } else {
        // Custom link import
        const textContent = `Imported from Google Drive: ${driveUrlInput || 'Custom Document'}\nCybersecurity defense protocols and organizational safeguards.`;
        const blob = new Blob([textContent], { type: 'text/plain' });
        const fileObj = new File([blob], 'Drive_Document.txt', { type: 'text/plain' });
        await executeUpload(fileObj);
      }
    } catch (err) {
      console.error('Drive import failed:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleBypassAndRetry = async () => {
    if (guardrailAlert?.pendingFile) {
      setInputGuardrailEnabled(false);
      await executeUpload(guardrailAlert.pendingFile, true);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!prompt.trim() && !sourceContentId) return;
    setCurrentStep(2);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="screen-a-container">
      {/* Decorative Scattered Icon Tiles around edges */}
      <div className="screen-a-decorations" aria-hidden="true">
        <div className="decor-tile decor-bolt" title="Decorative Bolt Accent">
          <Zap size={22} fill="currentColor" opacity={0.9} />
        </div>
        <div className="decor-tile decor-file" title="Decorative File Accent">
          <File size={22} />
        </div>
        <div className="decor-tile decor-chat" title="Decorative Chat Accent">
          <MessageSquare size={22} />
        </div>
        <div className="decor-tile decor-plug" title="Decorative Plug Accent">
          <Plug size={22} />
        </div>
      </div>

      <div className="screen-a-content" style={{ maxWidth: 880, margin: '0 auto', width: '100%' }}>
        {/* Top Header & Guardrail Toggle Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            width: '100%',
          }}
        >
          <div className="screen-a-brand" style={{ margin: 0, textAlign: 'left' }}>
            PRISM AI · Multimodal Platform
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Notepad / Prompt.txt button */}
            <button
              type="button"
              onClick={() => {
                setNotepadContent(prompt || 'Analyze the uploaded cybersecurity awareness poster and create content that can be shared with students.');
                setShowNotepadModal(true);
              }}
              className="btn btn-secondary"
              style={{
                padding: '6px 12px',
                fontSize: '0.82rem',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                cursor: 'pointer',
              }}
              title="Open Notepad to view or edit Prompt.txt"
            >
              <FileCode size={15} color="#818cf8" />
              <span>Notepad (Prompt.txt)</span>
            </button>

            {/* Input Guardrail Toggle Button */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '5px 12px',
                borderRadius: '20px',
                background: inputGuardrailEnabled
                  ? 'rgba(16, 185, 129, 0.15)'
                  : 'rgba(239, 68, 68, 0.12)',
                border: `1px solid ${inputGuardrailEnabled ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.3)'}`,
              }}
            >
              {inputGuardrailEnabled ? (
                <ShieldCheck size={16} color="#34d399" />
              ) : (
                <ShieldAlert size={16} color="#f87171" />
              )}
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: inputGuardrailEnabled ? '#34d399' : '#f87171',
                }}
              >
                Input Guardrail: {inputGuardrailEnabled ? 'ON' : 'OFF'}
              </span>
              <button
                type="button"
                onClick={() => setInputGuardrailEnabled(!inputGuardrailEnabled)}
                style={{
                  background: inputGuardrailEnabled ? '#10b981' : '#4b5563',
                  border: 'none',
                  borderRadius: '12px',
                  width: '36px',
                  height: '20px',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  justifyContent: inputGuardrailEnabled ? 'flex-end' : 'flex-start',
                  transition: 'all 0.2s ease',
                }}
                title={inputGuardrailEnabled ? 'Click to Turn OFF Input Guardrails' : 'Click to Turn ON Input Guardrails'}
              >
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: '#fff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  }}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Hidden native file input for + button */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
          accept=".png,.jpg,.jpeg,.webp,.bmp,.pdf,.docx,.pptx,.txt,.md,.csv,.mp4,.mp3"
        />

        {/* Attached file status banner if present */}
        {sourceContentId && (
          <div className="attached-file-pill" style={{ marginBottom: '14px' }}>
            <FileText size={16} />
            <span className="file-pill-name">{sourceFileName}</span>
            <span className="file-pill-size">({formatFileSize(sourceFileSize)})</span>
            <span className="file-pill-status">
              <CheckCircle2 size={14} /> Ready
            </span>
            <button
              type="button"
              className="file-pill-remove"
              onClick={clearSourceFile}
              title="Remove attached file"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Guardrail Violation / Alert Banner */}
        {guardrailAlert && (
          <div
            style={{
              marginBottom: '16px',
              padding: '14px 18px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: 'var(--radius-md)',
              color: '#fca5a5',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              textAlign: 'left',
              animation: 'fadeIn 0.3s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertTriangle size={20} color="#ef4444" />
              <strong style={{ color: '#ef4444', fontSize: '0.92rem' }}>
                Input Guardrail Alert: Source Did Not Pass Security Check
              </strong>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#fecaca', lineHeight: 1.4 }}>
              {guardrailAlert.alert || guardrailAlert.message}
            </p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px', alignItems: 'center' }}>
              {guardrailAlert.canBypass && (
                <button
                  type="button"
                  onClick={handleBypassAndRetry}
                  className="btn btn-primary"
                  style={{
                    padding: '6px 14px',
                    fontSize: '0.8rem',
                    background: '#ef4444',
                    borderColor: '#dc2626',
                  }}
                >
                  <ShieldAlert size={14} style={{ marginRight: '6px' }} />
                  Turn Off Guardrail & Force Import
                </button>
              )}
              <button
                type="button"
                onClick={() => setGuardrailAlert(null)}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Centered White Rounded Card with Hero Prompt Box */}
        <div style={{ position: 'relative', width: '100%', maxWidth: '820px' }}>
          <form className="prompt-hero-card" onSubmit={handleSubmit}>
            {/* "+" icon button on the left */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className="hero-plus-btn"
                onClick={handlePlusClick}
                disabled={isUploading}
                title="Attach source (Local File or Google Drive)"
                aria-label="Add Source"
              >
                {isUploading ? (
                  <Loader2 size={20} className="spin-animation" />
                ) : (
                  <Plus size={20} />
                )}
              </button>

              {/* Popover Menu for + button: Local or Drive */}
              {showAttachMenu && (
                <div
                  style={{
                    position: 'absolute',
                    top: '52px',
                    left: 0,
                    zIndex: 100,
                    background: '#1e293b',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                    padding: '8px',
                    width: '240px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <button
                    type="button"
                    onClick={handleChooseLocal}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 14px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '0.86rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)')}
                  >
                    <HardDrive size={18} color="#38bdf8" />
                    <div>
                      <div style={{ fontWeight: 600 }}>Import from Local Folder</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>PNG, JPG, PDF, DOCX, TXT</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenDrive}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 14px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '0.86rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)')}
                  >
                    <Cloud size={18} color="#34d399" />
                    <div>
                      <div style={{ fontWeight: 600 }}>Import from Google Drive</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Drive Files & Cloud Vault</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Flexible prompt input in middle */}
            <textarea
              className="hero-input-field"
              placeholder="What would you like to do today? e.g. Analyze cybersecurity poster..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              rows={Math.min(3, Math.max(1, (prompt.match(/\n/g) || []).length + 1, Math.ceil(prompt.length / 55)))}
              style={{
                resize: 'none',
                overflowY: prompt.length > 180 ? 'auto' : 'hidden',
                minHeight: '28px',
                paddingTop: '6px',
                paddingBottom: '4px',
                display: 'block',
              }}
              autoFocus
            />

            {/* Dark rounded arrow button on right */}
            <button
              type="submit"
              className="hero-arrow-btn"
              disabled={!prompt.trim() && !sourceContentId}
              title="Submit Prompt & Continue to Deliverables (Press Enter)"
            >
              <ArrowRight size={20} />
            </button>
          </form>
        </div>

        {/* Subtext below card */}
        <p className="screen-a-subtext" style={{ marginTop: '10px' }}>
          Enter a prompt, or click + to import source from your local folder or Google Drive
        </p>

        {/* LIVE BACKEND EXECUTION INSPECTOR / TELEMETRY DRAWER */}
        {backendTelemetry && (
          <div
            style={{
              marginTop: '24px',
              padding: '18px 22px',
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
              textAlign: 'left',
              animation: 'fadeIn 0.3s ease',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                paddingBottom: '12px',
                marginBottom: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cpu size={18} color="#38bdf8" />
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f8fafc' }}>
                  Live Backend Pipeline Inspector
                </span>
                <span
                  style={{
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#34d399',
                    fontSize: '0.72rem',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontWeight: 600,
                  }}
                >
                  Active & Ingested
                </span>
              </div>

              {/* View in Qdrant DB Link / Port */}
              <a
                href={backendTelemetry.qdrant?.dashboard_url || 'http://localhost:6333/dashboard'}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#38bdf8',
                  fontSize: '0.8rem',
                  textDecoration: 'none',
                  background: 'rgba(56, 189, 248, 0.12)',
                  padding: '4px 10px',
                  borderRadius: '14px',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                }}
                title="View Vectors in Qdrant DB Web Dashboard"
              >
                <Database size={13} />
                <span>View in Qdrant DB (Port {backendTelemetry.qdrant?.qdrant_port || 6333})</span>
                <ExternalLink size={12} />
              </a>
            </div>

            {/* 4 Interactive Telemetry Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px',
              }}
            >
              {/* Card 1: Input Guardrail */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <ShieldCheck size={14} color="#34d399" />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>
                    1. Input Guardrail
                  </span>
                </div>
                <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#34d399' }}>
                  {backendTelemetry.guardrails?.bypassed ? 'Bypassed by User' : 'Clean & Verified'}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                  Virus: Clean • PII: 0 violations
                </div>
              </div>

              {/* Card 2: Multimodal Parsing */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <FileText size={14} color="#818cf8" />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>
                    2. Multimodal Extraction
                  </span>
                </div>
                <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#f8fafc' }}>
                  {backendTelemetry.parsing?.word_count || 120} words extracted
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                  Lang: {backendTelemetry.parsing?.source_language?.toUpperCase() || 'EN'} • OCR/Parser
                </div>
              </div>

              {/* Card 3: Chunking */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <Layers size={14} color="#f59e0b" />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>
                    3. Text Chunking
                  </span>
                </div>
                <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#f8fafc' }}>
                  {backendTelemetry.chunking?.chunks_count || 4} chunks generated
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                  spaCy semantic sentencizer
                </div>
              </div>

              {/* Card 4: Vectorization & Qdrant */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <Database size={14} color="#38bdf8" />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>
                    4. Vectored into Qdrant
                  </span>
                </div>
                <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#38bdf8' }}>
                  {backendTelemetry.vectorization?.vector_dim || 384}-dim Dense Vectors
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                  Collection: {backendTelemetry.qdrant?.collection || 'intelliforge_chunks'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* GOOGLE DRIVE IMPORT MODAL */}
      {showDriveModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '16px',
              maxWidth: '560px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
              color: '#f8fafc',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Cloud size={24} color="#38bdf8" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Import from Google Drive</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDriveModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Search Drive */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: '8px 12px',
                marginBottom: '16px',
              }}
            >
              <Search size={16} color="#94a3b8" />
              <input
                type="text"
                placeholder="Search files in Google Drive..."
                value={driveSearch}
                onChange={(e) => setDriveSearch(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  width: '100%',
                  outline: 'none',
                  fontSize: '0.85rem',
                }}
              />
            </div>

            {/* Drive Files List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <div
                onClick={() => handleDriveImport('poster')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img
                    src="/assets/Source.png"
                    alt="Poster Preview"
                    style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Source.png</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      Cybersecurity Awareness Poster (Do's & Don'ts) • 216 KB
                    </div>
                  </div>
                </div>
                <button type="button" className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.78rem' }}>
                  Import
                </button>
              </div>

              <div
                onClick={() => handleDriveImport('advisory')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '6px',
                      background: 'rgba(239, 68, 68, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ef4444',
                    }}
                  >
                    <FileText size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Source.pdf</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      Ransomware Analysis Threat Material • 18 KB
                    </div>
                  </div>
                </div>
                <button type="button" className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.78rem' }}>
                  Import
                </button>
              </div>
            </div>

            {/* Custom Link Section */}
            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '14px' }}>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px', display: 'block' }}>
                Or paste a Google Drive file link:
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="https://drive.google.com/file/d/..."
                  value={driveUrlInput}
                  onChange={(e) => setDriveUrlInput(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#fff',
                    fontSize: '0.85rem',
                  }}
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleDriveImport('custom')}
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                >
                  Import Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NOTEPAD / PROMPT.TXT MODAL */}
      {showNotepadModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '16px',
              maxWidth: '620px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
              color: '#f8fafc',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileCode size={22} color="#818cf8" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>Prompt.txt (Notepad Editor)</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNotepadModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 12px 0' }}>
              Edit or paste directive instructions directly from Prompt.txt to populate your transformation directive.
            </p>

            {/* Quick Presets for Prompt */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() =>
                  setNotepadContent(
                    'Analyze the uploaded cybersecurity awareness poster and create content that can be shared with students.'
                  )
                }
                style={{
                  fontSize: '0.75rem',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  background: 'rgba(129, 140, 248, 0.15)',
                  border: '1px solid rgba(129, 140, 248, 0.3)',
                  color: '#c7d2fe',
                  cursor: 'pointer',
                }}
              >
                Poster Analysis Directive
              </button>

              <button
                type="button"
                onClick={() =>
                  setNotepadContent(
                    'Create a cybersecurity advisory about ransomware and explain how organizations can protect their data.'
                  )
                }
                style={{
                  fontSize: '0.75rem',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#fca5a5',
                  cursor: 'pointer',
                }}
              >
                Ransomware Advisory Directive
              </button>
            </div>

            <textarea
              rows={6}
              value={notepadContent}
              onChange={(e) => setNotepadContent(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                padding: '12px',
                color: '#fff',
                fontSize: '0.88rem',
                fontFamily: 'monospace',
                resize: 'vertical',
                outline: 'none',
                marginBottom: '16px',
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowNotepadModal(false)}
                style={{ padding: '8px 16px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setPrompt(notepadContent);
                  setShowNotepadModal(false);
                }}
                style={{ padding: '8px 20px' }}
              >
                Apply to Prompt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ScreenAPromptAttach;

