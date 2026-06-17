using ERP_API.Dtos;
using ERP_API.Models;

namespace ERP_API.Interfaces;

/// <summary>Contract for finished-goods stock operations.</summary>
public interface IFinishedGoodsService
{
    Task<List<FinishedGood>> GetAllAsync();
    Task<FinishedGood> CreateAsync(FinishedGoodRequest draft);
    Task<FinishedGood?> SetOnHandAsync(int id, double onHand);

    /// <summary>True if a finished good with this name already exists (case-insensitive).</summary>
    Task<bool> NameExistsAsync(string name);

    /// <summary>Delete a finished-good record. Returns false if no record had that id.</summary>
    Task<bool> DeleteAsync(int id);

    /// <summary>Add produced units to stock (match by id, then sku/name, else create).</summary>
    Task<FinishedGood> ProduceAsync(StockMovementRequest move);
}
