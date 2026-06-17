using ERP_API.Dtos;
using ERP_API.Models;

namespace ERP_API.Interfaces;

/// <summary>
/// Contract for quotation data operations. The controller depends on this, not
/// on the DbContext.
/// </summary>
public interface IQuotationService
{
    Task<List<Quotation>> GetAllAsync();
    Task<Quotation?> GetByIdAsync(int id);
    Task<Quotation> CreateAsync(QuotationRequest draft);
    Task<Quotation?> UpdateAsync(int id, QuotationRequest draft);
    Task<bool> DeleteAsync(int id);
    Task<Quotation?> SetStatusAsync(int id, string status);
}
