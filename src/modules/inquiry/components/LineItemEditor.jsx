import Field from '../../../shared/components/Field';
import { UNITS, blankRawMaterial } from '../inquiry.constants';

/**
 * Editor for a single product line and its raw materials. Fully controlled —
 * it holds no state of its own; it calls `onChange` with the next item so the
 * parent form remains the single source of truth.
 *
 * @param {object} props
 * @param {import('../inquiry.types').InquiryItem} props.item
 * @param {number} props.index
 * @param {Record<string, string>} [props.errors]
 * @param {(item: import('../inquiry.types').InquiryItem) => void} props.onChange
 * @param {() => void} props.onRemove
 * @param {boolean} props.canRemove
 */
export default function LineItemEditor({ item, index, errors = {}, onChange, onRemove, canRemove }) {
  const update = (patch) => onChange({ ...item, ...patch });

  const updateMaterial = (materialId, patch) =>
    update({
      rawMaterials: item.rawMaterials.map((material) =>
        material.id === materialId ? { ...material, ...patch } : material,
      ),
    });

  const addMaterial = () => update({ rawMaterials: [...item.rawMaterials, blankRawMaterial()] });

  const removeMaterial = (materialId) =>
    update({ rawMaterials: item.rawMaterials.filter((material) => material.id !== materialId) });

  return (
    <div className="lineitem">
      <div className="lineitem__head">
        <div className="row">
          <span className="lineitem__index">{index + 1}</span>
          <span className="lineitem__title">{item.productName?.trim() || 'New product'}</span>
        </div>
        {canRemove && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={onRemove}>
            ✕ Remove line
          </button>
        )}
      </div>

      <div className="lineitem__body">
        <div className="form-grid form-grid--3">
          <Field label="Product" required error={errors.productName} className="col-span-2">
            <input
              className={`input ${errors.productName ? 'has-error' : ''}`}
              placeholder="e.g. Cast Iron Pump Housing"
              value={item.productName}
              onChange={(event) => update({ productName: event.target.value })}
            />
          </Field>

          <Field label="Product code" hint="Optional">
            <input
              className="input"
              placeholder="e.g. PH-450"
              value={item.productCode}
              onChange={(event) => update({ productCode: event.target.value })}
            />
          </Field>

          <Field label="Quantity" required error={errors.quantity}>
            <div className="input-affix">
              <input
                className={`input ${errors.quantity ? 'has-error' : ''}`}
                type="number"
                min="0"
                step="any"
                value={item.quantity}
                onChange={(event) => update({ quantity: event.target.value })}
              />
            </div>
          </Field>

          <Field label="Unit">
            <select
              className="select"
              value={item.unit}
              onChange={(event) => update({ unit: event.target.value })}
            >
              {UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Target delivery date" required error={errors.targetDeliveryDate}>
            <input
              className={`input ${errors.targetDeliveryDate ? 'has-error' : ''}`}
              type="date"
              value={item.targetDeliveryDate}
              onChange={(event) => update({ targetDeliveryDate: event.target.value })}
            />
          </Field>

          <Field label="Remarks" hint="Finish, tolerances, etc." className="col-span-3">
            <input
              className="input"
              placeholder="Optional notes for this product"
              value={item.remarks}
              onChange={(event) => update({ remarks: event.target.value })}
            />
          </Field>
        </div>

        <div className="materials">
          <div className="materials__label">🧱 Raw materials needed</div>

          {item.rawMaterials.map((material) => (
            <div className="material-row" key={material.id}>
              <input
                className="input"
                placeholder="Material name (e.g. Grey Cast Iron FG260)"
                value={material.materialName}
                onChange={(event) => updateMaterial(material.id, { materialName: event.target.value })}
              />
              <input
                className="input"
                type="number"
                min="0"
                step="any"
                placeholder="Qty"
                value={material.quantity}
                onChange={(event) => updateMaterial(material.id, { quantity: event.target.value })}
              />
              <select
                className="select"
                value={material.unit}
                onChange={(event) => updateMaterial(material.id, { unit: event.target.value })}
              >
                {UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-ghost btn-icon"
                title="Remove material"
                onClick={() => removeMaterial(material.id)}
                disabled={item.rawMaterials.length === 1}
              >
                ✕
              </button>
            </div>
          ))}

          <button type="button" className="btn btn-secondary btn-sm" onClick={addMaterial}>
            + Add material
          </button>
        </div>
      </div>
    </div>
  );
}
