import Field from '../../../shared/components/Field';
import Button from '../../../shared/components/Button';
import Input from '../../../shared/components/Input';
import Select from '../../../shared/components/Select';
import { UNITS, blankRawMaterial } from '../inquiry.constants';
import { AddIcon, RemoveIcon, RawMaterialIcon } from '../../../shared/components/icons';

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
    <div className="mb-4 overflow-hidden rounded-card border border-slate-200 bg-slate-50">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-[11px]">
        <div className="flex items-center gap-2.5">
          <span className="inline-grid size-6 place-items-center rounded-[6px] bg-indigo-100 text-[13px] font-bold text-indigo-700">
            {index + 1}
          </span>
          <span className="text-sm font-semibold text-slate-900">
            {item.productName?.trim() || 'New product'}
          </span>
        </div>
        {canRemove && (
          <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
            <RemoveIcon /> Remove line
          </Button>
        )}
      </div>

      <div className="p-4">
        <div className="grid grid-cols-1 items-start gap-x-4 gap-y-5 sm:grid-cols-3">
          <Field label="Product" required error={errors.productName} className="sm:col-span-2">
            <Input
              invalid={Boolean(errors.productName)}
              placeholder="e.g. Cast Iron Pump Housing"
              value={item.productName}
              onChange={(event) => update({ productName: event.target.value })}
            />
          </Field>

          <Field label="Product code" hint="Optional">
            <Input
              placeholder="e.g. PH-450"
              value={item.productCode}
              onChange={(event) => update({ productCode: event.target.value })}
            />
          </Field>

          <Field label="Quantity" required error={errors.quantity}>
            <Input
              invalid={Boolean(errors.quantity)}
              type="number"
              min="0"
              step="any"
              value={item.quantity}
              onChange={(event) => update({ quantity: event.target.value })}
            />
          </Field>

          <Field label="Unit">
            <Select value={item.unit} onChange={(event) => update({ unit: event.target.value })}>
              {UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Target delivery date" required error={errors.targetDeliveryDate}>
            <Input
              invalid={Boolean(errors.targetDeliveryDate)}
              type="date"
              value={item.targetDeliveryDate}
              onChange={(event) => update({ targetDeliveryDate: event.target.value })}
            />
          </Field>
        </div>

        <div className="mt-3.5 border-t border-dashed border-slate-300 pt-3.5">
          <div className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.4px] text-slate-500">
            <RawMaterialIcon size={14} /> Raw materials needed
          </div>

          {item.rawMaterials.map((material) => (
            <div
              className="mb-2 grid grid-cols-[2fr_1fr_1fr_auto] items-start gap-2.5 max-nav:grid-cols-2"
              key={material.id}
            >
              <Input
                placeholder="Material name (e.g. Grey Cast Iron FG260)"
                value={material.materialName}
                onChange={(event) => updateMaterial(material.id, { materialName: event.target.value })}
              />
              <Input
                type="number"
                min="0"
                step="any"
                placeholder="Qty"
                value={material.quantity}
                onChange={(event) => updateMaterial(material.id, { quantity: event.target.value })}
              />
              <Select
                value={material.unit}
                onChange={(event) => updateMaterial(material.id, { unit: event.target.value })}
              >
                {UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </Select>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                title="Remove material"
                onClick={() => removeMaterial(material.id)}
                disabled={item.rawMaterials.length === 1}
              >
                <RemoveIcon />
              </Button>
            </div>
          ))}

          <Button type="button" variant="secondary" size="sm" onClick={addMaterial}>
            <AddIcon /> Add material
          </Button>
        </div>
      </div>
    </div>
  );
}
