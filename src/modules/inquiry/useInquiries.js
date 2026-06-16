import { useCallback, useEffect, useState } from 'react';
import { inquiryService } from './inquiry.service';

/**
 * Loads the inquiry list with loading/error state and a manual `refresh`.
 * Components depend on this hook, not on the service directly, so swapping the
 * data source later is invisible to them.
 */
export function useInquiries() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [savingId, setSavingId] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setInquiries(await inquiryService.list());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inquiries');
    } finally {
      setLoading(false);
    }
  }, []);

  /** Optimistically reassign one inquiry's status, persisting via the service. */
  const updateStatus = useCallback(async (id, status) => {
    setSavingId(id);
    setInquiries((prev) => prev.map((it) => (it.id === id ? { ...it, status } : it)));
    try {
      await inquiryService.setStatus(id, status);
    } catch {
      await refresh(); // revert to the source of truth on failure
    } finally {
      setSavingId(null);
    }
  }, [refresh]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { inquiries, loading, error, refresh, updateStatus, savingId };
}

/** Loads a single inquiry by id. */
export function useInquiry(id) {
  const [inquiry, setInquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const found = await inquiryService.get(id);
      setInquiry(found);
      if (!found) setError('Inquiry not found');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inquiry');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { inquiry, loading, error, refresh };
}
