import { useCallback, useEffect, useState } from 'react';
import { quotationService } from './quotation.service';

export function useQuotations() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [savingId, setSavingId] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setQuotes(await quotationService.list());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quotations');
    } finally {
      setLoading(false);
    }
  }, []);

  /** Optimistically reassign one quotation's status, persisting via the service. */
  const updateStatus = useCallback(async (id, status) => {
    setSavingId(id);
    setQuotes((prev) => prev.map((it) => (it.id === id ? { ...it, status } : it)));
    try {
      await quotationService.setStatus(id, status);
    } catch {
      await refresh(); // revert to the source of truth on failure
    } finally {
      setSavingId(null);
    }
  }, [refresh]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { quotes, loading, error, refresh, updateStatus, savingId };
}

export function useQuotation(id) {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const found = await quotationService.get(id);
      setQuote(found);
      if (!found) setError('Quotation not found');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quotation');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { quote, loading, error, refresh };
}
