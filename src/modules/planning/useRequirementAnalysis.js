import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchInquiry,
  selectInquiry,
  selectInquiryError,
  selectInquiryLoading,
} from '../inquiry/inquirySlice';
import {
  fetchFinishedGoods,
  fetchRawMaterials,
  selectFinishedGoods,
  selectFinishedGoodsLoading,
  selectRawMaterials,
  selectRawMaterialsLoading,
} from '../inventory/inventorySlice';
import { analyzeInquiry } from './requirements.engine';

/**
 * Loads an inquiry + current stock from the Redux store and runs the requirement
 * analysis. This stays a hook (rather than inlined into the page) because it owns
 * real derivation logic — combining three slices and running analyzeInquiry —
 * not just a data fetch.
 */
export function useRequirementAnalysis(inquiryId) {
  const dispatch = useDispatch();
  const inquiry = useSelector(selectInquiry);
  const inquiryLoading = useSelector(selectInquiryLoading);
  const inquiryError = useSelector(selectInquiryError);
  const finishedGoods = useSelector(selectFinishedGoods);
  const rawStock = useSelector(selectRawMaterials);
  const fgLoading = useSelector(selectFinishedGoodsLoading);
  const rawLoading = useSelector(selectRawMaterialsLoading);

  useEffect(() => {
    if (inquiryId) dispatch(fetchInquiry(inquiryId));
    dispatch(fetchFinishedGoods());
    dispatch(fetchRawMaterials());
  }, [dispatch, inquiryId]);

  const analysis = useMemo(
    () => (inquiry ? analyzeInquiry(inquiry, finishedGoods, rawStock) : null),
    [inquiry, finishedGoods, rawStock],
  );

  return {
    inquiry,
    analysis,
    loading: inquiryLoading || fgLoading || rawLoading,
    error: inquiryError,
  };
}
