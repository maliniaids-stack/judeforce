import { create } from 'zustand';

const initialGenerationParams = {
  tone: 'Professional',
  audience: 'C-Suite / Executives',
  language: 'English (US)',
  detail: 'Balanced / Standard',
};

export const useAppStore = create((set) => ({
  // Workflow Step State (1 through 6)
  currentStep: 1,
  setCurrentStep: (step) => set({ currentStep: step }),

  // Step 1: Prompt
  prompt: '',
  setPrompt: (prompt) => set({ prompt }),

  // Step 2: Attach Source & Input Guardrails
  sourceContentId: null,
  sourceFileName: null,
  sourceFileSize: null,
  sourceContentType: null,
  inputGuardrailEnabled: true,
  setInputGuardrailEnabled: (enabled) => set({ inputGuardrailEnabled: enabled }),
  backendTelemetry: null,
  setBackendTelemetry: (backendTelemetry) => set({ backendTelemetry }),
  guardrailAlert: null,
  setGuardrailAlert: (guardrailAlert) => set({ guardrailAlert }),
  setSourceFile: ({ id, filename, size, contentType }) =>
    set({
      sourceContentId: id,
      sourceFileName: filename,
      sourceFileSize: size,
      sourceContentType: contentType,
      guardrailAlert: null,
    }),
  clearSourceFile: () =>
    set({
      sourceContentId: null,
      sourceFileName: null,
      sourceFileSize: null,
      sourceContentType: null,
      backendTelemetry: null,
      guardrailAlert: null,
    }),

  // Step 3: Select Format (Multi-select)
  outputFormats: ['LinkedIn Post', 'Presentation'],
  setOutputFormats: (formats) => set({ outputFormats: formats }),
  toggleOutputFormat: (format) =>
    set((state) => {
      const exists = state.outputFormats.includes(format);
      if (exists) {
        return { outputFormats: state.outputFormats.filter((f) => f !== format) };
      } else {
        return { outputFormats: [...state.outputFormats, format] };
      }
    }),

  // Step 4: Generation Parameters
  generationParams: initialGenerationParams,
  setGenerationParams: (params) =>
    set((state) => ({
      generationParams: { ...state.generationParams, ...params },
    })),

  // Step 5 & 6: Job & Artefacts
  jobId: null,
  jobStatus: null, // 'created' | 'queued' | 'processing' | 'completed' | 'failed'
  jobData: null,
  setJobId: (jobId) => set({ jobId }),
  setJobStatus: (jobStatus) => set({ jobStatus }),
  setJobData: (jobData) =>
    set({
      jobData,
      jobStatus: jobData?.status || null,
    }),

  // Reset complete workflow
  resetWorkflow: () =>
    set({
      currentStep: 1,
      prompt: '',
      sourceContentId: null,
      sourceFileName: null,
      sourceFileSize: null,
      sourceContentType: null,
      inputGuardrailEnabled: true,
      backendTelemetry: null,
      guardrailAlert: null,
      outputFormats: ['LinkedIn Post', 'Presentation'],
      generationParams: initialGenerationParams,
      jobId: null,
      jobStatus: null,
      jobData: null,
    }),
}));


export default useAppStore;
