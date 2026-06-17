namespace ERP_API.Dtos;

/// <summary>
/// A stock movement — produce/receive (add) or consume (subtract). The record is
/// matched by id first, then sku/code, then name; if none match, produce/receive
/// create a new record. Mirrors the frontend produce()/receive()/consume() args.
/// </summary>
public class StockMovementRequest
{
    // Finished-good matching: finishedGoodId + sku + name. Raw-material matching:
    // rawMaterialId + code + name. Only the relevant fields are used per endpoint.
    public int? FinishedGoodId { get; set; }
    public int? RawMaterialId { get; set; }
    public string? Sku { get; set; }
    public string? Code { get; set; }
    public string? Name { get; set; }
    public string? Unit { get; set; }
    public double Qty { get; set; }
}
