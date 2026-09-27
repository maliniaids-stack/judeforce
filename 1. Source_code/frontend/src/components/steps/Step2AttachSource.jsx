import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { uploadSourceFile } from '../../api/client';

export function Step2AttachSource() {
  const setCurrentStep = useAppStore((state) => state.setCurrentStep);
  const sourceContentId = useAppStore((state) => state.sourceContentId);
  const sourceFileName = useAppStore((state) => state.sourceFileName);
  const sourceFileSize = useAppStore((state) => state.sourceFileSize);
  const setSourceFile = useAppStore((state) => state.setSourceFile);
  const clearSourceFile = useAppStore((state) => state.clearSourceFile);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const onDrop = async (acceptedFiles) => {
    if (!acceptedFiles || acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    setIsUploading(true);
    setUploadError(null);

    try {
      const response = await uploadSourceFile(file);
      setSourceFile({
        id: response.source_content_id,
        filename: response.original_filename,
        size: file.size,
        contentType: response.content_type,
      });
    } catch (err) {
      console.error('File upload failed:', err);
      setUploadError(
        err.response?.data?.detail || 'Failed to upload source file to MinIO object storage.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    disabled: isUploading,
  });

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="workflow-card">
      <div className="stage-header">
        <h2 className="stage-title">
          <UploadCloud size={24} color="var(--accent-orange)" />
          Step 2: Attach Source Material
        </h2>
        <p className="stage-description">
          Upload documents, presentation decks, transcripts, audio, or video files to ground the multimodal transformation. Source files are securely vaulted in local MinIO S3 storage.
        </p>
      </div>

      {!sourceContentId ? (
        <div
          {...getRootProps()}
          className={`dropzone-container ${isDragActive ? 'active' : ''}`}
        >
          <input {...getInputProps()} />
          <div className="dropzone-icon">
            {isUploading ? (
              <Loader2 size={28} className="spin-animation" />
            ) : (
              <UploadCloud size={28} />
            )}
          </div>
          <div className="dropzone-text">
            <h3>
              {isUploading
                ? 'Vaulting file into MinIO S3...'
                : isDragActive
                ? 'Drop the source file here'
                : 'Drag & drop source material, or click to browse'}
            </h3>
            <p>
              Supports PDF, DOCX, PPTX, TXT, Markdown, CSV, MP4, MP3 (Up to 500 MB)
            </p>
          </div>
          <span className="dropzone-hint">Offline Vault & Content Analysis Ready</span>
        </div>
      ) : (
        <div className="uploaded-file-card">
          <div className="file-info">
            <div className="file-icon">
              <FileText size={22} />
            </div>
            <div>
              <div className="file-name">{sourceFileName}</div>
              <div className="file-meta">
                {formatFileSize(sourceFileSize)} • Uploaded & Indexed in MinIO • ID: {sourceContentId.slice(0, 8)}...
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                color: '#34d399',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}
            >
              <CheckCircle2 size={16} /> Ready
            </span>
            <button
              type="button"
              className="btn btn-danger"
              onClick={clearSourceFile}
              title="Remove attached file"
              style={{ padding: '6px 12px', fontSize: '0.78rem' }}
            >
              <Trash2 size={14} />
              <span>Remove</span>
            </button>
          </div>
        </div>
      )}

      {uploadError && (
        <div
          style={{
            marginTop: '16px',
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
          <span>{uploadError}</span>
        </div>
      )}

      <div className="stage-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setCurrentStep(1)}
        >
          <ArrowLeft size={16} />
          <span>Back to Prompt</span>
        </button>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setCurrentStep(3)}
          disabled={isUploading}
        >
          <span>
            {sourceContentId ? 'Continue to Format Selection' : 'Skip & Continue Without File'}
          </span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

export default Step2AttachSource;
