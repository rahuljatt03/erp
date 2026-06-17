namespace ERP_API.Models;

/// <summary>
/// Production / work order header — build N of a finished product. Materials live
/// in the related work_order_materials table. Mirrors production.types.js.
/// </summary>
public class ProductionOrder
{
    public int Id { get; set; }                              // auto-increment PK
    public string WoNo { get; set; } = default!;             // e.g. WO-2026-0001
    public string ProductName { get; set; } = default!;
    public string? ProductCode { get; set; }
    public int? FinishedGoodId { get; set; }
    public double Quantity { get; set; }
    public string Unit { get; set; } = "pcs";
    public double ProducedQty { get; set; }
    public double PostedQty { get; set; }                    // producedQty already added to finished-goods stock (idempotency ledger)
    public string Status { get; set; } = "planned";          // planned|in_progress|completed|cancelled
    public string? DueDate { get; set; }                     // yyyy-mm-dd
    public int? SourceInquiryId { get; set; }
    public string? SourceInquiryNo { get; set; }
    public int? SourceSalesOrderId { get; set; }             // set when released from a sales order entering "in_production"
    public string? SourceSalesOrderNo { get; set; }
    public string? Notes { get; set; }
    public List<WorkOrderMaterial> Materials { get; set; } = new();
    public string CreatedBy { get; set; } = default!;
    public string CreatedAt { get; set; } = default!;        // ISO datetime
    public string UpdatedAt { get; set; } = default!;
}
