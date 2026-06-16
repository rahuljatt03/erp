import { useCallback, useEffect, useState } from 'react';
import { productionService } from './production.service';

export function useProductionOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [savingId, setSavingId] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setOrders(await productionService.list());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load work orders');
    } finally {
      setLoading(false);
    }
  }, []);

  /** Optimistically reassign one work order's status, persisting via the service. */
  const updateStatus = useCallback(async (id, status) => {
    setSavingId(id);
    setOrders((prev) => prev.map((it) => (it.id === id ? { ...it, status } : it)));
    try {
      await productionService.setStatus(id, status);
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

export function useProductionOrder(id) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const found = await productionService.get(id);
      setOrder(found);
      if (!found) setError('Work order not found');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load work order');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { order, loading, error, refresh };
}
