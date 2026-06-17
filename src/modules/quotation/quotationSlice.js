import { createResourceSlice } from '../../store/createResourceSlice';
import { quotationService } from './quotation.service';

/**
 * Quotation Redux slice. `setStatus` is the module-specific thunk — used e.g.
 * when a quotation is converted to a sales order.
 */
const slice = createResourceSlice({
  name: 'quotation',
  service: quotationService,
  extraThunks: {
    setStatus: (service, { id, status }) => service.setStatus(id, status),
  },
});

export const {
  fetchAll: fetchQuotations,
  fetchOne: fetchQuotation,
  createOne: createQuotation,
  updateOne: updateQuotation,
  removeOne: removeQuotation,
  setStatus: setQuotationStatus,
} = slice.thunks;

export const {
  selectAll: selectQuotations,
  selectListLoading: selectQuotationsLoading,
  selectListError: selectQuotationsError,
  selectCurrent: selectQuotation,
  selectCurrentLoading: selectQuotationLoading,
  selectCurrentError: selectQuotationError,
} = slice.selectors;

export default slice.reducer;
