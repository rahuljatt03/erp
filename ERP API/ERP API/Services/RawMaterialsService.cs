using ERP_API.Data;
using ERP_API.Dtos;
using ERP_API.Interfaces;
using ERP_API.Models;
using Microsoft.EntityFrameworkCore;

namespace ERP_API.Services;

/// <summary>
/// EF Core-backed implementation of <see cref="IRawMaterialsService"/>. Mirrors
/// the frontend inventory.service.js rawMaterialsService behaviour.
/// </summary>
public class RawMaterialsService : IRawMaterialsService
{
    private readonly ErpDbContext _db;

    public RawMaterialsService(ErpDbContext db) => _db = db;

    public async Task<List<RawMaterialStock>> GetAllAsync()
    {
        return await _db.RawMaterials.ToListAsync();
    }

    public async Task<RawMaterialStock> CreateAsync(RawMaterialRequestDto draft)
    {
        var record = new RawMaterialStock
        {
            Code = (draft.Code ?? string.Empty).Trim(),
            Name = (draft.Name ?? string.Empty).Trim(),
            Unit = string.IsNullOrWhiteSpace(draft.Unit) ? "kg" : draft.Unit,
            OnHand = draft.OnHand,
        };
        _db.RawMaterials.Add(record);
        await _db.SaveChangesAsync();
        return record;
    }

    public async Task<RawMaterialStock?> SetOnHandAsync(int id, double onHand)
    {
        var rm = await _db.RawMaterials.FirstOrDefaultAsync(r => r.Id == id);
        if (rm is null) return null;

        rm.OnHand = onHand;
        await _db.SaveChangesAsync();
        return rm;
    }

    public async Task<bool> NameExistsAsync(string name)
    {
        var target = (name ?? string.Empty).Trim().ToLower();
        if (target.Length == 0) return false;
        return await _db.RawMaterials.AnyAsync(r => r.Name.ToLower() == target);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var rm = await _db.RawMaterials.FirstOrDefaultAsync(r => r.Id == id);
        if (rm is null) return false;

        _db.RawMaterials.Remove(rm);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<RawMaterialStock> ReceiveAsync(StockMovementRequest move)
    {
        var amount = move.Qty;

        // Match by id, then name, else create — mirrors the frontend.
        RawMaterialStock? match = null;
        if (move.RawMaterialId is int id)
            match = await _db.RawMaterials.FirstOrDefaultAsync(r => r.Id == id);

        if (match is null)
        {
            var name = (move.Name ?? string.Empty).Trim().ToLower();
            match = await _db.RawMaterials.FirstOrDefaultAsync(r => r.Name.ToLower() == name);
        }

        if (match is not null)
        {
            match.OnHand += amount;
            await _db.SaveChangesAsync();
            return match;
        }

        var created = new RawMaterialStock
        {
            Code = move.Code ?? string.Empty,
            Name = string.IsNullOrWhiteSpace(move.Name) ? "Unknown material" : move.Name,
            Unit = string.IsNullOrWhiteSpace(move.Unit) ? "kg" : move.Unit,
            OnHand = amount,
        };
        _db.RawMaterials.Add(created);
        await _db.SaveChangesAsync();
        return created;
    }

    public async Task<RawMaterialStock?> ConsumeAsync(StockMovementRequest move)
    {
        var amount = move.Qty;

        // Match by id, then name; floor at zero; no-op if untracked.
        RawMaterialStock? match = null;
        if (move.RawMaterialId is int id)
            match = await _db.RawMaterials.FirstOrDefaultAsync(r => r.Id == id);

        if (match is null)
        {
            var name = (move.Name ?? string.Empty).Trim().ToLower();
            match = await _db.RawMaterials.FirstOrDefaultAsync(r => r.Name.ToLower() == name);
        }

        if (match is null) return null;

        match.OnHand = Math.Max(0, match.OnHand - amount);
        await _db.SaveChangesAsync();
        return match;
    }
}
