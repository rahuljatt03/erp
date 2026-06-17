using ERP_API.Dtos;
using ERP_API.Models;

namespace ERP_API.Interfaces;

/// <summary>
/// Contract for sales-order data operations. The controller depends on this, not
/// on the DbContext.
/// </summary>
public interface ISalesOrderService
{
    Task<List<SalesOrder>> GetAllAsync();
    Task<SalesOrder?> GetByIdAsync(int id);
    Task<SalesOrder> CreateAsync(SalesOrderRequest draft);
    Task<SalesOrder?> UpdateAsync(int id, SalesOrderRequest draft);
    Task<bool> DeleteAsync(int id);
    Task<SalesOrder?> SetStatusAsync(int id, string status);
}
