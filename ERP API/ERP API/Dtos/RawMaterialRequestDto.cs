namespace ERP_API.Dtos;

/// <summary>Create a new raw-material stock record.</summary>
public class RawMaterialRequestDto
{
    public string? Code { get; set; }
    public string? Name { get; set; }
    public string? Unit { get; set; }
    public double OnHand { get; set; }
}
