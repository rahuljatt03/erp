import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../../shared/components/PageHeader';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import Badge from '../../../shared/components/Badge';
import { LoadingState, ErrorState } from '../../../shared/components/states';
import { formatDateTime, formatNumber } from '../../../shared/utils/format';
import { useBom } from '../useBom';
import { bomService } from '../bom.service';
import { getBomStatusMeta } from '../bom.constants';

function Detail({ label, children }) {
  return (
    <div className="detail-item">
      <div className="detail-item__label">{label}</div>
      <div className="detail-item__value">{children}</div>
    </div>
  );
}

export default function BomDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { bom, loading, error, refresh } = useBom(id);
  const [multiplier, setMultiplier] = useState('100');
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm(`Delete the BOM for ${bom.productName}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await bomService.remove(bom.id);
      navigate('/bom');
    } catch {
      setDeleting(false);
      window.alert('Failed to delete BOM.');
    }
  }

  if (loading) return <LoadingState label="Loading bill of materials…" />;
  if (error || !bom)
    return (
      <>
        <PageHeader
          title="Bill of materials"
          actions={
            <Button to="/bom" variant="secondary">
              ← Back to list
            </Button>
          }
        />
        <Card>
          <ErrorState text={error ?? 'BOM not found'} onRetry={refresh} />
        </Card>
      </>
    );

  const status = getBomStatusMeta(bom.status);
  const qty = Number(multiplier) || 0;

  return (
    <>
      <PageHeader
        title={
          <span className="row">
            {bom.productName}
            <Badge tone={status.tone}>{status.label}</Badge>
          </span>
        }
        subtitle={`Recipe per 1 ${bom.outputUnit} · updated ${formatDateTime(bom.updatedAt)}`}
        actions={
          <>
            <Button to="/bom" variant="ghost">
              ← Back
            </Button>
            <Button to={`/bom/${bom.id}/edit`} variant="secondary">
              ✎ Edit
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : '🗑 Delete'}
            </Button>
          </>
        }
      />

      <div className="stack">
        <Card title="Product">
          <div className="detail-grid">
            <Detail label="Product">{bom.productName}</Detail>
            <Detail label="Code">{bom.productCode || '—'}</Detail>
            <Detail label="Yields">1 {bom.outputUnit}</Detail>
            <Detail label="Components">{bom.components.length}</Detail>
          </div>
          {bom.notes ? (
            <>
              <div className="divider" style={{ margin: '18px 0' }} />
              <div className="detail-item__label">Notes</div>
              <p style={{ marginTop: 4 }}>{bom.notes}</p>
            </>
          ) : null}
        </Card>

        <Card
          title="Components"
          actions={
            <div className="row" style={{ gap: 8 }}>
              <span className="text-sm muted">Compute for</span>
              <input
                className="input"
                style={{ width: 90, textAlign: 'right' }}
                type="number"
                min="0"
                step="any"
                value={multiplier}
                onChange={(event) => setMultiplier(event.target.value)}
              />
              <span className="text-sm muted">{bom.outputUnit}</span>
            </div>
          }
          bodyFlush
        >
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Code</th>
                  <th className="num">Per unit</th>
                  <th>Unit</th>
                  <th className="num">Total for {formatNumber(qty)}</th>
                </tr>
              </thead>
              <tbody>
                {bom.components.map((component) => (
                  <tr key={component.id}>
                    <td className="cell-strong">{component.materialName}</td>
                    <td className="cell-mono">{component.materialCode || '—'}</td>
                    <td className="num">{formatNumber(component.quantityPerUnit)}</td>
                    <td>{component.unit}</td>
                    <td className="num fw-700" style={{ color: 'var(--brand-700)' }}>
                      {formatNumber(component.quantityPerUnit * qty)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}
