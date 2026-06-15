import { useNavigate } from 'react-router-dom';
import PageHeader from '../../../shared/components/PageHeader';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import Badge from '../../../shared/components/Badge';
import { LoadingState, EmptyState, ErrorState } from '../../../shared/components/states';
import { useBoms } from '../useBom';
import { getBomStatusMeta } from '../bom.constants';

export default function BomListPage() {
  const { items, loading, error, refresh } = useBoms();
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title="Bill of Materials"
        subtitle="Per-unit product recipes. Requirement analysis uses these when a product has one."
        actions={
          <Button variant="primary" to="/bom/new">
            + New BOM
          </Button>
        }
      />

      <Card bodyFlush>
        {loading ? (
          <LoadingState label="Loading bills of materials…" />
        ) : error ? (
          <ErrorState text={error} onRetry={refresh} />
        ) : items.length === 0 ? (
          <EmptyState
            icon="🧩"
            title="No bills of materials yet"
            text="Define a per-unit recipe for a product so planning knows exactly what it needs."
            action={
              <Button variant="primary" to="/bom/new">
                + New BOM
              </Button>
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Code</th>
                  <th className="num">Components</th>
                  <th>Per</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((bom) => {
                  const status = getBomStatusMeta(bom.status);
                  return (
                    <tr key={bom.id} className="is-clickable" onClick={() => navigate(`/bom/${bom.id}`)}>
                      <td className="cell-strong">{bom.productName}</td>
                      <td className="cell-mono">{bom.productCode || '—'}</td>
                      <td className="num">{bom.components.length}</td>
                      <td>1 {bom.outputUnit}</td>
                      <td>
                        <Badge tone={status.tone}>{status.label}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
