namespace ERP_API.Dtos;

/// <summary>
/// One raw-material requirement as sent by the client. No Id — the database
/// assigns the integer key, so the frontend's temporary ids are simply ignored.
/// </summary>
public class RawMaterialRequest
{
    public string MaterialName { get; set; } = string.Empty;
    public double Quantity { get; set; }
    public string? Unit { get; set; }
    public string? Notes { get; set; }
}
