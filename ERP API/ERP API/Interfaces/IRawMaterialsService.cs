using ERP_API.Dtos;
using ERP_API.Models;

namespace ERP_API.Interfaces;

/// <summary>Contract for raw-material stock operations.</summary>
public interface IRawMaterialsService
{
    Task<List<RawMaterialStock>> GetAllAsync();
    Task<RawMaterialStock> CreateAsync(RawMaterialRequestDto draft);
    Task<RawMaterialStock?> SetOnHandAsync(int id, double onHand);

    /// <summary>True if a raw material with this name already exists (case-insensitive).</summary>
    Task<bool> NameExistsAsync(string name);

    /// <summary>Delete a raw-material record. Returns false if no record had that id.</summary>
    Task<bool> DeleteAsync(int id);

    /// <summary>Add received stock (match by id, then name, else create).</summary>
    Task<RawMaterialStock> ReceiveAsync(StockMovementRequest move);

    /// <summary>Remove consumed stock, floored at zero (match by id, then name; no-op if untracked).</summary>
    Task<RawMaterialStock?> ConsumeAsync(StockMovementRequest move);
}
