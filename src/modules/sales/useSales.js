import { useCallback, useEffect, useState } from 'react';
import { salesService } from './sales.service';

export function useSalesOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [savingId, setSavingId] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setOrders(await salesService.list());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sales orders');
    } finally {
      setLoading(false);
    }
  }, []);

  /** Optimistically reassign one sales order's status, persisting via the service. */
  const updateStatus = useCallback(async (id, status) => {
    setSavingId(id);
    setOrders((prev) => prev.map((it) => (it.id === id ? { ...it, status } : it)));
    try {
      await salesService.setStatus(id, status);
    } catch {
      await refresh(); // revert to the source of truth on failure
    } finally {
      setSavingId(null);
    }
  }, [refresh]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { orders, loading, error, refresh, updateStatus, savingId };
}

export function useSalesOrder(id) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const found = await salesService.get(id);
      setOrder(found);
      if (!found) setError('Sales order not found');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sales order');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { order, loading, error, refresh };
}
