using ERP_API.Data;
using ERP_API.Dtos;
using ERP_API.Interfaces;
using ERP_API.Models;
using Microsoft.EntityFrameworkCore;

namespace ERP_API.Services;

/// <summary>
/// EF Core-backed implementation of <see cref="IFinishedGoodsService"/>. Mirrors
/// the frontend inventory.service.js finishedGoodsService behaviour.
/// </summary>
public class FinishedGoodsService : IFinishedGoodsService
{
    private readonly ErpDbContext _db;

    public FinishedGoodsService(ErpDbContext db) => _db = db;

    public async Task<List<FinishedGood>> GetAllAsync()
    {
        return await _db.FinishedGoods.ToListAsync();
    }

    public async Task<FinishedGood> CreateAsync(FinishedGoodRequest draft)
    {
        var record = new FinishedGood
        {
            Sku = (draft.Sku ?? string.Empty).Trim(),
            Name = (draft.Name ?? string.Empty).Trim(),
            Unit = string.IsNullOrWhiteSpace(draft.Unit) ? "pcs" : draft.Unit,
            OnHand = draft.OnHand,
        };
        _db.FinishedGoods.Add(record);
        await _db.SaveChangesAsync();
        return record;
    }

    public async Task<FinishedGood?> SetOnHandAsync(int id, double onHand)
    {
        var fg = await _db.FinishedGoods.FirstOrDefaultAsync(f => f.Id == id);
        if (fg is null) return null;

        fg.OnHand = onHand;
        await _db.SaveChangesAsync();
        return fg;
    }

    public async Task<FinishedGood> ProduceAsync(StockMovementRequest move)
    {
        var amount = move.Qty;

        // Match by id, then SKU/name, else create — mirrors the frontend.
        FinishedGood? match = null;
        if (move.FinishedGoodId is int id)
            match = await _db.FinishedGoods.FirstOrDefaultAsync(f => f.Id == id);

        if (match is null)
        {
            var sku = (move.Sku ?? string.Empty).Trim().ToLower();
            var name = (move.Name ?? string.Empty).Trim().ToLower();
            match = await _db.FinishedGoods.FirstOrDefaultAsync(f =>
                (sku != "" && f.Sku.ToLower() == sku) || f.Name.ToLower() == name);
        }

        if (match is not null)
        {
            match.OnHand += amount;
            await _db.SaveChangesAsync();
            return match;
        }

        var created = new FinishedGood
        {
            Sku = move.Sku ?? string.Empty,
            Name = string.IsNullOrWhiteSpace(move.Name) ? "Unknown product" : move.Name,
            Unit = string.IsNullOrWhiteSpace(move.Unit) ? "pcs" : move.Unit,
            OnHand = amount,
        };
        _db.FinishedGoods.Add(created);
        await _db.SaveChangesAsync();
        return created;
    }
}
