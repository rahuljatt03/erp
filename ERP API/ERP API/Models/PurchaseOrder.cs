namespace ERP_API.Models;

/// <summary>
/// Purchase order header — sent to a supplier. Line items live in the related
/// purchase_order_items table. Mirrors the frontend procurement.types.js shape.
/// </summary>
public class PurchaseOrder
{
    public int Id { get; set; }                              // auto-increment PK
    public string PoNo { get; set; } = default!;             // e.g. PO-2026-0001
    public string SupplierName { get; set; } = default!;
    public string? SupplierContact { get; set; }
    public string Status { get; set; } = "draft";            // draft|ordered|partially_received|received|cancelled
    public string OrderDate { get; set; } = default!;        // yyyy-mm-dd
    public string? ExpectedDate { get; set; }                // yyyy-mm-dd
    public int? SourceInquiryId { get; set; }
    public string? SourceInquiryNo { get; set; }
    public string? Notes { get; set; }
    public List<PurchaseOrderItem> Items { get; set; } = new();
    public string CreatedBy { get; set; } = default!;
    public string CreatedAt { get; set; } = default!;        // ISO datetime
    public string UpdatedAt { get; set; } = default!;
}
