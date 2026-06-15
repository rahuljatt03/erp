import { createCollection } from '../../shared/storage/mockDb';
import { createId } from '../../shared/utils/id';
import { currentUser } from '../../shared/session';
import { inquiryService } from '../inquiry/inquiry.service';
import { seedQuotations } from './quotation.mock';

/**
 * Quotation service — the boundary every quotation component talks to.
 *
 * On create from an inquiry it marks the source inquiry as "quoted" — the one
 * cross-module side effect, mirroring how the sales service marks an inquiry
 * "converted". Going live = replace each method body with a `fetch()`; the
 * async, Promise-returning signatures stay identical so hooks/components don't
 * change.
 */

const collection = createCollection('quotations', seedQuotations);

function delay(ms = 250) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function nowIso() {
  return new Date().toISOString();
}

function byNewestFirst(a, b) {
  return (b.createdAt ?? '').localeCompare(a.createdAt ?? '');
}

/** Generates the next sequential quotation number, e.g. QT-2026-0001. */
function nextQuoteNo(existing) {
  const year = new Date().getFullYear();
  const prefix = `QT-${year}-`;
  const maxSeq = existing
    .map((quote) => quote.quoteNo)
    .filter((no) => typeof no === 'string' && no.startsWith(prefix))
    .reduce((max, no) => {
      const seq = parseInt(no.slice(prefix.length), 10);
      return Number.isNaN(seq) ? max : Math.max(max, seq);
    }, 0);
  return `${prefix}${String(maxSeq + 1).padStart(4, '0')}`;
}

function normaliseItems(items = []) {
  return items
    .filter((item) => (item.productName ?? '').trim() !== '')
    .map((item) => ({
      id: item.id ?? createId('qti'),
      productName: (item.productName ?? '').trim(),
      productCode: (item.productCode ?? '').trim(),
      quantity: Number(item.quantity) || 0,
      unit: item.unit ?? 'pcs',
      deliveryDate: item.deliveryDate ?? '',
      unitPrice: Number(item.unitPrice) || 0,
    }));
}

export const quotationService = {
  async list() {
    await delay();
    return collection.getAll().sort(byNewestFirst);
  },

  async get(id) {
    await delay();
    return collection.getById(id) ?? null;
  },

  async create(draft) {
    await delay(350);
    const timestamp = nowIso();
    const record = {
      id: createId('qt'),
      quoteNo: nextQuoteNo(collection.getAll()),
      customerName: (draft.customerName ?? '').trim(),
      customerContact: (draft.customerContact ?? '').trim(),
      sourceInquiryId: draft.sourceInquiryId ?? null,
      sourceInquiryNo: draft.sourceInquiryNo ?? '',
      quoteDate: draft.quoteDate,
      validUntil: draft.validUntil ?? '',
      status: draft.status ?? 'draft',
      notes: (draft.notes ?? '').trim(),
      items: normaliseItems(draft.items),
      createdBy: currentUser.name,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const inserted = collection.insert(record);

    // Quoting an inquiry marks it as "quoted".
    if (inserted.sourceInquiryId) {
      try {
        await inquiryService.setStatus(inserted.sourceInquiryId, 'quoted');
      } catch {
        // Non-fatal: the quotation is still created even if the inquiry update fails.
      }
    }
    return inserted;
  },

  async update(id, draft) {
    await delay(350);
    return collection.update(id, {
      customerName: (draft.customerName ?? '').trim(),
      customerContact: (draft.customerContact ?? '').trim(),
      quoteDate: draft.quoteDate,
      validUntil: draft.validUntil ?? '',
      status: draft.status,
      notes: (draft.notes ?? '').trim(),
      items: normaliseItems(draft.items),
      updatedAt: nowIso(),
    });
  },

  async remove(id) {
    await delay();
    collection.remove(id);
  },

  /** Lightweight status update — used e.g. when a quotation is converted to a sales order. */
  async setStatus(id, status) {
    await delay(120);
    return collection.update(id, { status, updatedAt: nowIso() });
  },
};
