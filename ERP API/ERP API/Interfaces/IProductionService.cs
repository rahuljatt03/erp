using ERP_API.Dtos;
using ERP_API.Models;

namespace ERP_API.Interfaces;

/// <summary>
/// Contract for production / work-order operations. The controller depends on
/// this, not on the DbContext.
/// </summary>
public interface IProductionService
{
    Task<List<ProductionOrder>> GetAllAsync();
    Task<ProductionOrder?> GetByIdAsync(int id);
    Task<ProductionOrder> CreateAsync(ProductionOrderRequest draft);
    Task<ProductionOrder?> UpdateAsync(int id, ProductionOrderRequest draft);
    Task<bool> DeleteAsync(int id);

    /// <summary>
    /// Report production of qty units (capped at outstanding): advances
    /// producedQty, each material's consumedQty proportionally, and the status, then
    /// posts the inventory side effect — produced units added to finished-goods
    /// stock, consumed materials deducted from raw stock (counted once via the
    /// PostedQty ledgers). Returns null if the work order doesn't exist.
    /// </summary>
    Task<ProductionOrder?> ProduceAsync(int id, double qty);
}
