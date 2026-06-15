/**
 * Requirement analysis engine (the mini-MRP core).
 *
 * Pure functions only — no React, no storage — so the netting logic is easy to
 * reason about and test. Given an inquiry plus current stock, it answers:
 *   • finished goods: ordered vs in-stock  → how many to BUILD
 *   • raw materials:  required vs in-stock  → how much to PURCHASE
 *
 * Assumption: a line's raw-material quantities are the total for the full
 * ordered quantity, so material demand scales by (toBuild / ordered).
 */

function norm(value) {
  return (value ?? '').toString().trim().toLowerCase();
}

/** Round to 3 decimals to avoid floating-point noise from ratio scaling. */
function round(value) {
  return Math.round((Number(value) || 0) * 1000) / 1000;
}

/** Match an inquiry line to a finished good by SKU first, then by name. */
function matchFinishedGood(line, finishedGoods) {
  const code = norm(line.productCode);
  const name = norm(line.productName);
  return (
    (code && finishedGoods.find((good) => norm(good.sku) === code)) ||
    finishedGoods.find((good) => norm(good.name) === name) ||
    null
  );
}

/** Match a required material to a raw-material stock record by name. */
function matchRawStock(materialName, rawStock) {
  const name = norm(materialName);
  return rawStock.find((stock) => norm(stock.name) === name) || null;
}

/** Match an inquiry line to a BOM by product code first, then by name. */
function matchBom(line, boms) {
  const code = norm(line.productCode);
  const name = norm(line.productName);
  return (
    (code && boms.find((bom) => norm(bom.productCode) === code)) ||
    boms.find((bom) => norm(bom.productName) === name) ||
    null
  );
}

/**
 * @param {import('../inquiry/inquiry.types').Inquiry} inquiry
 * @param {import('../inventory/inventory.types').FinishedGood[]} finishedGoods
 * @param {import('../inventory/inventory.types').RawMaterialStock[]} rawStock
 * @param {import('../bom/bom.types').Bom[]} boms
 */
export function analyzeInquiry(inquiry, finishedGoods = [], rawStock = [], boms = []) {
  const finishedRows = [];
  /** key `name|unit` -> aggregated demand */
  const demand = new Map();

  for (const line of inquiry.items ?? []) {
    const ordered = Number(line.quantity) || 0;
    const match = matchFinishedGood(line, finishedGoods);
    const inStock = match ? Number(match.onHand) || 0 : 0;
    const toBuild = Math.max(0, ordered - inStock);
    const ratio = ordered > 0 ? toBuild / ordered : 0;
    const bom = matchBom(line, boms);

    // Prefer the product's BOM (exact per-unit × toBuild). Fall back to the
    // inquiry's own line totals, scaled to the build quantity, when there's no BOM.
    const sources = bom
      ? (bom.components ?? []).map((component) => ({
          materialName: component.materialName,
          materialCode: component.materialCode || '',
          rawMaterialId: component.rawMaterialId ?? null,
          unit: component.unit,
          required: (Number(component.quantityPerUnit) || 0) * toBuild,
        }))
      : (line.rawMaterials ?? []).map((material) => ({
          materialName: material.materialName,
          materialCode: '',
          rawMaterialId: null,
          unit: material.unit,
          required: (Number(material.quantity) || 0) * ratio,
        }));

    // Per-line materials (used to seed production work orders).
    const lineMaterials = [];
    for (const source of sources) {
      if (source.required <= 0) continue;
      const rawMatch = matchRawStock(source.materialName, rawStock);
      lineMaterials.push({
        materialName: source.materialName,
        materialCode: rawMatch ? rawMatch.code : source.materialCode,
        rawMaterialId: rawMatch ? rawMatch.id : source.rawMaterialId,
        unit: source.unit,
        required: round(source.required),
      });

      const key = `${norm(source.materialName)}|${norm(source.unit)}`;
      const entry = demand.get(key);
      if (entry) {
        entry.required += source.required;
      } else {
        demand.set(key, { materialName: source.materialName, unit: source.unit, required: source.required });
      }
    }

    finishedRows.push({
      key: line.id,
      productName: line.productName,
      productCode: line.productCode,
      unit: line.unit,
      ordered,
      inStock,
      toBuild,
      tracked: Boolean(match),
      finishedGoodId: match ? match.id : null,
      sku: match ? match.sku : '',
      materials: lineMaterials,
      materialSource: bom ? 'bom' : 'inquiry',
      bomId: bom ? bom.id : null,
      status: toBuild === 0 ? 'in_stock' : inStock > 0 ? 'partial' : 'to_build',
    });
  }

  const rawRows = [];
  for (const entry of demand.values()) {
    const match = matchRawStock(entry.materialName, rawStock);
    const inStock = match ? Number(match.onHand) || 0 : 0;
    const required = round(entry.required);
    const toPurchase = round(Math.max(0, required - inStock));
    rawRows.push({
      key: `${norm(entry.materialName)}|${norm(entry.unit)}`,
      materialName: entry.materialName,
      unit: entry.unit,
      required,
      inStock,
      toPurchase,
      tracked: Boolean(match),
      stockId: match ? match.id : null,
      stockCode: match ? match.code : '',
      status: toPurchase === 0 ? 'sufficient' : 'shortage',
    });
  }

  rawRows.sort((a, b) => b.toPurchase - a.toPurchase);

  const summary = {
    productLines: finishedRows.length,
    linesToBuild: finishedRows.filter((row) => row.toBuild > 0).length,
    unitsToBuild: round(finishedRows.reduce((sum, row) => sum + row.toBuild, 0)),
    materials: rawRows.length,
    materialsShort: rawRows.filter((row) => row.toPurchase > 0).length,
  };

  return { finishedGoods: finishedRows, rawMaterials: rawRows, summary };
}
