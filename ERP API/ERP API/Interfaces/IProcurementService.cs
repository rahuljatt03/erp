using ERP_API.Dtos;
using ERP_API.Models;

namespace ERP_API.Interfaces;

/// <summary>
/// Contract for procurement / purchase-order operations. The controller depends
/// on this, not on the DbContext.
/// </summary>
public interface IProcurementService
{
    Task<List<PurchaseOrder>> GetAllAsync();
    Task<PurchaseOrder?> GetByIdAsync(int id);
    Task<PurchaseOrder> CreateAsync(PurchaseOrderRequest draft);
    Task<PurchaseOrder?> UpdateAsync(int id, PurchaseOrderRequest draft);
    Task<bool> DeleteAsync(int id);

    /// <summary>
    /// Record a goods receipt: increments each line's receivedQty and recomputes
    /// the PO status. Returns null if the PO doesn't exist. Raw-material inventory
    /// is updated by the frontend, mirroring the existing architecture.
    /// </summary>
    Task<PurchaseOrder?> ReceiveAsync(int id, List<ReceiptRequest> receipts);
}
