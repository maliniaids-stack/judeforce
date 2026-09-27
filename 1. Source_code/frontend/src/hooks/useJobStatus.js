import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getJobStatus } from '../api/client';
import { useAppStore } from '../store/useAppStore';

/**
 * Polls GET /jobs/{jobId} every 2 seconds and automatically halts
 * once the job status reaches "completed" or "failed".
 * Synchronizes the returned job payload into the Zustand application store.
 * @param {string | null} jobId
 */
export function useJobStatus(jobId) {
  const setJobData = useAppStore((state) => state.setJobData);

  const query = useQuery({
    queryKey: ['jobStatus', jobId],
    queryFn: () => getJobStatus(jobId),
    enabled: Boolean(jobId),
    refetchInterval: (queryInstance) => {
      const data = queryInstance.state.data;
      if (!data) return 800;
      if (data.status === 'completed' || data.status === 'failed') {
        return false;
      }
      return 800;
    },
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    if (query.data) {
      setJobData(query.data);
    }
  }, [query.data, setJobData]);

  return query;
}

export default useJobStatus;
