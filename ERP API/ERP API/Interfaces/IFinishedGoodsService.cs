using ERP_API.Dtos;
using ERP_API.Models;

namespace ERP_API.Interfaces;

/// <summary>Contract for finished-goods stock operations.</summary>
public interface IFinishedGoodsService
{
    Task<List<FinishedGood>> GetAllAsync();
    Task<FinishedGood> CreateAsync(FinishedGoodRequest draft);
    Task<FinishedGood?> SetOnHandAsync(int id, double onHand);

    /// <summary>Add produced units to stock (match by id, then sku/name, else create).</summary>
    Task<FinishedGood> ProduceAsync(StockMovementRequest move);
}
