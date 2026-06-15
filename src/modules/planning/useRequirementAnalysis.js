import { useMemo } from 'react';
import { useInquiry } from '../inquiry/useInquiries';
import { useFinishedGoods, useRawMaterials } from '../inventory/useInventory';
import { useBoms } from '../bom/useBom';
import { analyzeInquiry } from './requirements.engine';

/**
 * Loads an inquiry + current stock and runs the requirement analysis. Combines
 * three async sources behind one simple loading/error surface for the page.
 */
export function useRequirementAnalysis(inquiryId) {
  const { inquiry, loading: inquiryLoading, error: inquiryError } = useInquiry(inquiryId);
  const { items: finishedGoods, loading: fgLoading } = useFinishedGoods();
  const { items: rawStock, loading: rawLoading } = useRawMaterials();
  const { items: boms, loading: bomLoading } = useBoms();

  const analysis = useMemo(
    () => (inquiry ? analyzeInquiry(inquiry, finishedGoods, rawStock, boms) : null),
    [inquiry, finishedGoods, rawStock, boms],
  );

  return {
    inquiry,
    analysis,
    loading: inquiryLoading || fgLoading || rawLoading || bomLoading,
    error: inquiryError,
  };
}
