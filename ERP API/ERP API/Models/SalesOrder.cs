namespace ERP_API.Models;

/// <summary>
/// Sales order header — a confirmed customer order. Line items live in the
/// related sales_order_items table. Mirrors the frontend sales.types.js shape.
/// </summary>
public class SalesOrder
{
    public int Id { get; set; }                              // auto-increment PK
    public string SoNo { get; set; } = default!;             // e.g. SO-2026-0001
    public string CustomerName { get; set; } = default!;
    public string? CustomerContact { get; set; }
    public int? SourceInquiryId { get; set; }
    public string? SourceInquiryNo { get; set; }
    public string OrderDate { get; set; } = default!;        // yyyy-mm-dd
    public string? ExpectedDeliveryDate { get; set; }
    public string Status { get; set; } = "confirmed";        // draft|confirmed|in_production|fulfilled|cancelled
    public string? Notes { get; set; }
    public List<SalesOrderItem> Items { get; set; } = new();
    public string CreatedBy { get; set; } = default!;
    public string CreatedAt { get; set; } = default!;        // ISO datetime
    public string UpdatedAt { get; set; } = default!;
}
