import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import PageHeader from '../../../shared/components/PageHeader';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import Badge from '../../../shared/components/Badge';
import { LoadingState, ErrorState, EmptyState } from '../../../shared/components/states';
import { formatNumber } from '../../../shared/utils/format';
import { getStatusMeta } from '../../inquiry/inquiry.constants';
import { useRequirementAnalysis } from '../useRequirementAnalysis';
import { createProductionOrder } from '../../production/productionSlice';
import {
  BackIcon,
  FinishedGoodsIcon,
  ProcurementIcon,
  ProductionIcon,
  SuccessIcon,
} from '../../../shared/components/icons';
import { useToast } from '../../../shared/feedback/FeedbackProvider';
import { confirm } from '../../../shared/feedback/confirm';

const FINISHED_STATUS = {
  in_stock: { tone: 'success', label: 'In stock' },
  partial: { tone: 'warning', label: 'Partial' },
  to_build: { tone: 'info', label: 'Build' },
};

const RAW_STATUS = {
  sufficient: { tone: 'success', label: 'Sufficient' },
  shortage: { tone: 'danger', label: 'Purchase' },
};

export default function RequirementAnalysisPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const toast = useToast();
  const [creatingWOs, setCreatingWOs] = useState(false);
  const { inquiry, analysis, loading, error } = useRequirementAnalysis(id);

  if (loading) {
    return <LoadingState label="Analysing requirements…" />;
  }

  if (error || !inquiry || !analysis) {
    return (
      <>
        <PageHeader
          actions={
            <Button to="/inquiries" variant="secondary">
              <BackIcon /> Back to inquiries
            </Button>
          }
        />
        <Card>
          <ErrorState text={error ?? 'Inquiry not found'} />
        </Card>
      </>
    );
  }

  const status = getStatusMeta(inquiry.status);
  const { finishedGoods, rawMaterials, summary } = analysis;
  const purchaseLines = rawMaterials.filter((row) => row.toPurchase > 0);
  const buildLines = finishedGoods.filter((row) => row.toBuild > 0);

  const handleCreateWorkOrders = async () => {
    const ok = await confirm({
      message: `Create ${buildLines.length} production order${buildLines.length > 1 ? 's' : ''} from this build plan?`,
      header: 'Create production orders?',
      icon: 'pi pi-cog',
      acceptLabel: 'Create',
    });
    if (!ok) return;
    setCreatingWOs(true);
    try {
      await Promise.all(
        buildLines.map((row) =>
          dispatch(createProductionOrder({
            productName: row.productName,
            productCode: row.productCode || '',
            finishedGoodId: row.finishedGoodId || null,
            quantity: row.toBuild,
            unit: row.unit,
            status: 'planned',
            dueDate: '',
            sourceInquiryId: inquiry.id,
            sourceInquiryNo: inquiry.inquiryNo,
            notes: `Built from requirement analysis of ${inquiry.inquiryNo}.`,
            materials: row.materials.map((material) => ({
              materialName: material.materialName,
              materialCode: material.materialCode || '',
              rawMaterialId: material.rawMaterialId || null,
              quantity: material.required,
              unit: material.unit,
            })),
          })).unwrap(),
        ),
      );
      toast.success(
        'Production orders created',
        `${buildLines.length} work order${buildLines.length > 1 ? 's' : ''} created from ${inquiry.inquiryNo}.`,
      );
      navigate('/production');
    } catch (err) {
      toast.error('Could not create work orders', err instanceof Error ? err.message : 'Please try again.');
      setCreatingWOs(false);
    }
  };

  const handleCreatePO = () => {
    toast.info('Purchase order drafted', `Prefilled from ${inquiry.inquiryNo}. Set the supplier and save.`);
    navigate('/purchase-orders/new', {
      state: {
        prefill: {
          sourceInquiryId: inquiry.id,
          sourceInquiryNo: inquiry.inquiryNo,
          items: purchaseLines.map((row) => ({
            materialName: row.materialName,
            materialCode: row.stockCode || '',
            rawMaterialId: row.stockId || null,
            quantity: row.toPurchase,
            unit: row.unit,
            unitPrice: 0,
          })),
        },
      },
    });
  };

  return (
    <>
      <PageHeader
        actions={
          <>
            <Button to={`/inquiries/${inquiry.id}`} variant="ghost">
              <BackIcon /> Back to inquiry
            </Button>
            <Button to="/inventory" variant="secondary">
              View inventory
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
          <div className="rounded-card border border-slate-200 bg-white p-5 shadow-card">
            <div className="text-[13px] font-medium text-slate-500">Product lines</div>
            <div className="mt-1.5 text-[28px] font-bold text-slate-900 tabular-nums">{summary.productLines}</div>
            <div className="mt-1 text-xs text-slate-500">{summary.linesToBuild} need building</div>
          </div>
          <div className="rounded-card border border-slate-200 bg-white p-5 shadow-card">
            <div className="text-[13px] font-medium text-slate-500">Units to build</div>
            <div className="mt-1.5 text-[28px] font-bold text-slate-900 tabular-nums">{formatNumber(summary.unitsToBuild)}</div>
            <div className="mt-1 text-xs text-slate-500">After using finished stock</div>
          </div>
          <div className="rounded-card border border-slate-200 bg-white p-5 shadow-card">
            <div className="text-[13px] font-medium text-slate-500">Materials required</div>
            <div className="mt-1.5 text-[28px] font-bold text-slate-900 tabular-nums">{summary.materials}</div>
            <div className="mt-1 text-xs text-slate-500">Distinct raw materials</div>
          </div>
          <div className="rounded-card border border-slate-200 bg-white p-5 shadow-card">
            <div className="text-[13px] font-medium text-slate-500">Materials short</div>
            <div className={`mt-1.5 text-[28px] font-bold tabular-nums ${summary.materialsShort ? 'text-red-600' : 'text-green-600'}`}>
              {summary.materialsShort}
            </div>
            <div className="mt-1 text-xs text-slate-500">Need purchasing</div>
          </div>
        </div>

        {/* ---- Finished goods: build plan ---- */}
        <Card
          title={<><FinishedGoodsIcon size={16} /> Finished goods — build plan</>}
          bodyFlush
          actions={<span className="text-[13px] text-slate-500">Ordered − in stock = to build</span>}
        >
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm [&_td]:border-b [&_td]:border-slate-200 [&_td]:px-4 [&_td]:py-[13px] [&_td]:align-middle [&_td]:text-slate-700 [&_th]:whitespace-nowrap [&_th]:border-b [&_th]:border-slate-200 [&_th]:bg-slate-50 [&_th]:px-4 [&_th]:py-[11px] [&_th]:text-left [&_th]:text-[11.5px] [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-[0.5px] [&_th]:text-slate-500 [&_tbody_tr:last-child_td]:border-b-0">
              <thead>
                <tr>
                  <th>Product</th>
                  <th className="!text-right">Ordered</th>
                  <th className="!text-right">In stock</th>
                  <th className="!text-right">To build</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {finishedGoods.map((row) => {
                  const meta = FINISHED_STATUS[row.status] ?? FINISHED_STATUS.to_build;
                  return (
                    <tr key={row.key}>
                      <td className="!font-semibold !text-slate-900">
                        {row.productName}
                        {row.productCode ? <span className="text-slate-500"> · {row.productCode}</span> : null}
                        {!row.tracked ? (
                          <div className="text-[13px] text-slate-500">Not in finished-goods inventory (treated as 0)</div>
                        ) : null}
                        {row.toBuild > 0 ? (
                          <div className="text-[13px] text-slate-500">≈ materials estimated from inquiry</div>
                        ) : null}
                      </td>
                      <td className="!text-right tabular-nums">
                        {formatNumber(row.ordered)} {row.unit}
                      </td>
                      <td className="!text-right tabular-nums">{formatNumber(row.inStock)}</td>
                      <td className={`!text-right tabular-nums font-bold ${row.toBuild ? '!text-indigo-700' : '!text-slate-500'}`}>
                        {formatNumber(row.toBuild)}
                      </td>
                      <td>
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* ---- Raw materials: procurement plan ---- */}
        <Card
          title={<><ProcurementIcon size={16} /> Raw materials — procurement plan</>}
          bodyFlush
          actions={<span className="text-[13px] text-slate-500">Required for build − in stock = to purchase</span>}
        >
          {rawMaterials.length === 0 ? (
            <EmptyState
              icon={SuccessIcon}
              title="Nothing to purchase"
              text="Every product on this inquiry is already in finished-goods stock, so no raw materials are needed."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm [&_td]:border-b [&_td]:border-slate-200 [&_td]:px-4 [&_td]:py-[13px] [&_td]:align-middle [&_td]:text-slate-700 [&_th]:whitespace-nowrap [&_th]:border-b [&_th]:border-slate-200 [&_th]:bg-slate-50 [&_th]:px-4 [&_th]:py-[11px] [&_th]:text-left [&_th]:text-[11.5px] [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-[0.5px] [&_th]:text-slate-500 [&_tbody_tr:last-child_td]:border-b-0">
                <thead>
                  <tr>
                    <th>Raw material</th>
                    <th className="!text-right">Required</th>
                    <th className="!text-right">In stock</th>
                    <th className="!text-right">To purchase</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rawMaterials.map((row) => {
                    const meta = RAW_STATUS[row.status] ?? RAW_STATUS.shortage;
                    return (
                      <tr key={row.key}>
                        <td className="!font-semibold !text-slate-900">
                          {row.materialName}
                          {!row.tracked ? (
                            <div className="text-[13px] text-slate-500">Not in raw-material inventory (treated as 0)</div>
                          ) : null}
                        </td>
                        <td className="!text-right tabular-nums">
                          {formatNumber(row.required)} {row.unit}
                        </td>
                        <td className="!text-right tabular-nums">{formatNumber(row.inStock)}</td>
                        <td className={`!text-right tabular-nums font-bold ${row.toPurchase ? '!text-red-600' : '!text-green-600'}`}>
                          {formatNumber(row.toPurchase)}
                        </td>
                        <td>
                          <Badge tone={meta.tone}>{meta.label}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <div className="flex items-center justify-end gap-2.5 pb-2">
          <Button
            variant="primary"
            onClick={handleCreatePO}
            disabled={purchaseLines.length === 0}
            title={purchaseLines.length === 0 ? 'Nothing to purchase' : 'Create a purchase order for the shortage'}
          >
            <ProcurementIcon /> Create purchase order{purchaseLines.length ? ` (${purchaseLines.length})` : ''}
          </Button>
          <Button
            variant="secondary"
            onClick={handleCreateWorkOrders}
            disabled={buildLines.length === 0 || creatingWOs}
            title={buildLines.length === 0 ? 'Nothing to build' : 'Create work orders for the build plan'}
          >
            {creatingWOs ? (
              'Creating…'
            ) : (
              <>
                <ProductionIcon /> Create production order{buildLines.length > 1 ? 's' : ''}
                {buildLines.length ? ` (${buildLines.length})` : ''}
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  );
}
