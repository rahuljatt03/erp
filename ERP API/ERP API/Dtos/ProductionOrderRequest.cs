namespace ERP_API.Dtos;

/// <summary>
/// What a client sends to create or update a work order. Server-controlled fields
/// (Id, WoNo, ProducedQty, timestamps, CreatedBy) are intentionally absent.
/// </summary>
public class ProductionOrderRequest
{
    public string ProductName { get; set; } = string.Empty;
    public string? ProductCode { get; set; }
    public int? FinishedGoodId { get; set; }
    public double Quantity { get; set; }
    public string? Unit { get; set; }
    public string? Status { get; set; }
    public string? DueDate { get; set; }
    public int? SourceInquiryId { get; set; }
    public string? SourceInquiryNo { get; set; }
    public int? SourceSalesOrderId { get; set; }
    public string? SourceSalesOrderNo { get; set; }
    public string? Notes { get; set; }
    public List<WorkOrderMaterialRequest> Materials { get; set; } = new();
}
