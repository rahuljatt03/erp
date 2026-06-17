using System.Text.Json.Serialization;

namespace ERP_API.Models;

/// <summary>A raw material consumed by a work order. Stored in work_order_materials.</summary>
public class WorkOrderMaterial
{
    public int Id { get; set; }                              // auto-increment PK
    public string MaterialName { get; set; } = default!;
    public string? MaterialCode { get; set; }
    public int? RawMaterialId { get; set; }
    public double Quantity { get; set; }                     // required for the full work-order qty
    public string Unit { get; set; } = "kg";
    public double ConsumedQty { get; set; }                  // cumulative consumed so far
    public double PostedQty { get; set; }                    // consumedQty already deducted from raw stock (idempotency ledger)

    // Foreign key back to the parent work order — hidden from the API JSON.
    [JsonIgnore]
    public int ProductionOrderId { get; set; }
    [JsonIgnore]
    public ProductionOrder? ProductionOrder { get; set; }
}
