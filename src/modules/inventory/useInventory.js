import { useCallback, useEffect, useState } from 'react';
import { finishedGoodsService, rawMaterialsService } from './inventory.service';

/** Generic loader for a stock service exposing `list()`. */
function useStock(service) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await service.list());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stock');
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { items, loading, error, refresh };
}

export function useFinishedGoods() {
  return useStock(finishedGoodsService);
}

export function useRawMaterials() {
  return useStock(rawMaterialsService);
}
