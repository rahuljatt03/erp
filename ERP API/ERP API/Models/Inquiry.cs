namespace ERP_API.Models;

/// <summary>
/// Inquiry header. Line items live in the related inquiry_items table via the
/// Items navigation. Shape still matches the frontend inquiry.types.js JSON.
/// </summary>
public class Inquiry
{
    public int Id { get; set; }                              // auto-increment PK
    public string InquiryNo { get; set; } = default!;       // e.g. INQ-2026-0001
    public string CustomerName { get; set; } = default!;
    public string? CustomerContact { get; set; }
    public string InquiryDate { get; set; } = default!;      // yyyy-mm-dd
    public string Status { get; set; } = "draft";            // draft|submitted|under_review|quoted|converted|closed
    public string? Notes { get; set; }
    public List<InquiryItem> Items { get; set; } = new();    // related table
    public string CreatedBy { get; set; } = default!;
    public string CreatedAt { get; set; } = default!;        // ISO datetime
    public string UpdatedAt { get; set; } = default!;
}
