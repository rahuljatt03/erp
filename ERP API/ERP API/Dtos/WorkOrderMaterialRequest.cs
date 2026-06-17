namespace ERP_API.Dtos;

/// <summary>
/// One work-order material as sent by the client. Existing rows carry their server
/// <see cref="Id"/> so the service can reconcile them in place (preserving the
/// consumed/posted ledger); new rows omit it and are inserted.
/// </summary>
public class WorkOrderMaterialRequest
{
    public int? Id { get; set; }
    public string MaterialName { get; set; } = string.Empty;
    public string? MaterialCode { get; set; }
    public int? RawMaterialId { get; set; }
    public double Quantity { get; set; }
    public string? Unit { get; set; }
    public double ConsumedQty { get; set; }
}
