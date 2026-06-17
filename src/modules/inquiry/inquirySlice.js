import { createResourceSlice } from '../../store/createResourceSlice';
import { inquiryService } from './inquiry.service';

/**
 * Inquiry Redux slice — list + current record + CRUD thunks, built from the
 * shared resource-slice factory. Registered under the `inquiry` key in the store.
 */
const slice = createResourceSlice({ name: 'inquiry', service: inquiryService });

export const {
  fetchAll: fetchInquiries,
  fetchOne: fetchInquiry,
  createOne: createInquiry,
  updateOne: updateInquiry,
  removeOne: removeInquiry,
} = slice.thunks;

export const {
  selectAll: selectInquiries,
  selectListLoading: selectInquiriesLoading,
  selectListError: selectInquiriesError,
  selectCurrent: selectInquiry,
  selectCurrentLoading: selectInquiryLoading,
  selectCurrentError: selectInquiryError,
} = slice.selectors;

export default slice.reducer;
