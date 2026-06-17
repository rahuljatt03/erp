using System.Text.Json.Serialization;

namespace ERP_API.Models;

/// <summary>A purchase-order line for one raw material. Stored in purchase_order_items.</summary>
public class PurchaseOrderItem
{
    public int Id { get; set; }                              // auto-increment PK
    public string MaterialName { get; set; } = default!;
    public string? MaterialCode { get; set; }
    public int? RawMaterialId { get; set; }
    public double Quantity { get; set; }                     // ordered quantity
    public string Unit { get; set; } = "kg";
    public double UnitPrice { get; set; }
    public double ReceivedQty { get; set; }                  // cumulative received so far

    // Idempotency ledger: how much of this line has already been pushed into
    // raw-material inventory. The procurement service only ever posts the
    // (ReceivedQty - PostedQty) delta, so a line is counted into stock exactly
    // once no matter how many times its status is re-saved or toggled.
    public double PostedQty { get; set; }

    // Foreign key back to the parent purchase order — hidden from the API JSON.
    [JsonIgnore]
    public int PurchaseOrderId { get; set; }
    [JsonIgnore]
    public PurchaseOrder? PurchaseOrder { get; set; }
}
