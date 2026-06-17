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
  const [creatingWOs, setCreatingWOs] = useState(false);
  const { inquiry, analysis, loading, error } = useRequirementAnalysis(id);

  if (loading) {
    return <LoadingState label="Analysing requirements…" />;
  }

  if (error || !inquiry || !analysis) {
    return (
      <>
        <PageHeader
          title="Requirement analysis"
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
      navigate('/production');
    } finally {
      setCreatingWOs(false);
    }
  };

  const handleCreatePO = () => {
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
        title={
          <span className="row">
            Requirement analysis
            <span className="cell-mono" style={{ fontSize: 16 }}>
              {inquiry.inquiryNo}
            </span>
            <Badge tone={status.tone}>{status.label}</Badge>
          </span>
        }
        subtitle={`${inquiry.customerName} — what to build, and what to purchase to build it.`}
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

      <div className="stack">
        <div className="stat-grid">
          <div className="stat">
            <div className="stat__label">Product lines</div>
            <div className="stat__value">{summary.productLines}</div>
            <div className="stat__meta">{summary.linesToBuild} need building</div>
          </div>
          <div className="stat">
            <div className="stat__label">Units to build</div>
            <div className="stat__value">{formatNumber(summary.unitsToBuild)}</div>
            <div className="stat__meta">After using finished stock</div>
          </div>
          <div className="stat">
            <div className="stat__label">Materials required</div>
            <div className="stat__value">{summary.materials}</div>
            <div className="stat__meta">Distinct raw materials</div>
          </div>
          <div className="stat">
            <div className="stat__label">Materials short</div>
            <div className="stat__value" style={{ color: summary.materialsShort ? 'var(--danger)' : 'var(--success)' }}>
              {summary.materialsShort}
            </div>
            <div className="stat__meta">Need purchasing</div>
          </div>
        </div>

        {/* ---- Finished goods: build plan ---- */}
        <Card
          title={<><FinishedGoodsIcon size={16} /> Finished goods — build plan</>}
          bodyFlush
          actions={<span className="muted text-sm">Ordered − in stock = to build</span>}
        >
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th className="num">Ordered</th>
                  <th className="num">In stock</th>
                  <th className="num">To build</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {finishedGoods.map((row) => {
                  const meta = FINISHED_STATUS[row.status] ?? FINISHED_STATUS.to_build;
                  return (
                    <tr key={row.key}>
                      <td className="cell-strong">
                        {row.productName}
                        {row.productCode ? <span className="muted"> · {row.productCode}</span> : null}
                        {!row.tracked ? (
                          <div className="muted text-sm">Not in finished-goods inventory (treated as 0)</div>
                        ) : null}
                        {row.toBuild > 0 ? (
                          <div className="muted text-sm">≈ materials estimated from inquiry</div>
                        ) : null}
                      </td>
                      <td className="num">
                        {formatNumber(row.ordered)} {row.unit}
                      </td>
                      <td className="num">{formatNumber(row.inStock)}</td>
                      <td className="num fw-700" style={{ color: row.toBuild ? 'var(--brand-700)' : 'var(--text-muted)' }}>
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
          actions={<span className="muted text-sm">Required for build − in stock = to purchase</span>}
        >
          {rawMaterials.length === 0 ? (
            <EmptyState
              icon={SuccessIcon}
              title="Nothing to purchase"
              text="Every product on this inquiry is already in finished-goods stock, so no raw materials are needed."
            />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Raw material</th>
                    <th className="num">Required</th>
                    <th className="num">In stock</th>
                    <th className="num">To purchase</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rawMaterials.map((row) => {
                    const meta = RAW_STATUS[row.status] ?? RAW_STATUS.shortage;
                    return (
                      <tr key={row.key}>
                        <td className="cell-strong">
                          {row.materialName}
                          {!row.tracked ? (
                            <div className="muted text-sm">Not in raw-material inventory (treated as 0)</div>
                          ) : null}
                        </td>
                        <td className="num">
                          {formatNumber(row.required)} {row.unit}
                        </td>
                        <td className="num">{formatNumber(row.inStock)}</td>
                        <td
                          className="num fw-700"
                          style={{ color: row.toPurchase ? 'var(--danger)' : 'var(--success)' }}
                        >
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

        <div className="row" style={{ justifyContent: 'flex-end', paddingBottom: 8 }}>
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
