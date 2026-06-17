using ERP_API.Dtos;
using ERP_API.Models;

namespace ERP_API.Interfaces;

/// <summary>
/// Contract for inquiry data operations. The controller depends on this, not on
/// the DbContext, so the persistence layer can be swapped or mocked freely.
/// </summary>
public interface IInquiryService
{
    Task<List<Inquiry>> GetAllAsync();
    Task<Inquiry?> GetByIdAsync(int id);
    Task<Inquiry> CreateAsync(InquiryRequest draft);
    Task<Inquiry?> UpdateAsync(int id, InquiryRequest draft);
    Task<bool> DeleteAsync(int id);
    Task<Inquiry?> SetStatusAsync(int id, string status);
}
