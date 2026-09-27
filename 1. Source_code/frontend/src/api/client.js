import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 30000,
});

/**
 * Uploads a source document or media file, runs input guardrails, and receives backend telemetry
 * @param {File} file
 * @param {boolean} guardrailsEnabled
 * @returns {Promise<{source_content_id: string, original_filename: string, content_type: string, storage_path: string, backend_telemetry: object}>}
 */
export async function uploadSourceFile(file, guardrailsEnabled = true) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('guardrails_enabled', guardrailsEnabled ? 'true' : 'false');

  const response = await api.post('/upload', formData);
  return response.data;
}


/**
 * Creates a content generation job and queues it in Celery
 * @param {{prompt: string, source_content_id?: string, output_formats: string[], generation_params?: object}} params
 * @returns {Promise<object>} JobOut
 */
export async function generateOutput(params) {
  const response = await api.post('/generate', params);
  return response.data;
}

/**
 * Retrieves the current status and details of a job
 * @param {string} jobId
 * @returns {Promise<object>} JobOut
 */
export async function getJobStatus(jobId) {
  const response = await api.get(`/jobs/${jobId}`);
  return response.data;
}

/**
 * Retrieves export data and generated artefacts for a completed job
 * @param {string} jobId
 * @returns {Promise<object>}
 */
export async function getExportData(jobId) {
  const response = await api.get(`/export/${jobId}`);
  return response.data;
}

/**
 * Checks system health
 * @returns {Promise<{status: string, service: string}>}
 */
export async function checkHealth() {
  const response = await api.get('/');
  return response.data;
}

export default api;
