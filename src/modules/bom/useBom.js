import { useCallback, useEffect, useState } from 'react';
import { bomService } from './bom.service';

export function useBoms() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await bomService.list());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bills of materials');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { items, loading, error, refresh };
}

export function useBom(id) {
  const [bom, setBom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const found = await bomService.get(id);
      setBom(found);
      if (!found) setError('Bill of materials not found');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bill of materials');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { bom, loading, error, refresh };
}
