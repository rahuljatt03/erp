import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../modules/auth/authSlice';
import inquiryReducer from '../modules/inquiry/inquirySlice';
import inventoryReducer from '../modules/inventory/inventorySlice';
import procurementReducer from '../modules/procurement/procurementSlice';
import productionReducer from '../modules/production/productionSlice';
import quotationReducer from '../modules/quotation/quotationSlice';
import salesReducer from '../modules/sales/salesSlice';

/**
 * Application Redux store. Each module contributes a slice reducer under its
 * own key — the selectors in each slice read state[key], so the key here must
 * match the slice's `name`.
 */
export const store = configureStore({
  reducer: {
    auth: authReducer,
    inquiry: inquiryReducer,
    inventory: inventoryReducer,
    procurement: procurementReducer,
    production: productionReducer,
    quotation: quotationReducer,
    sales: salesReducer,
  },
});
