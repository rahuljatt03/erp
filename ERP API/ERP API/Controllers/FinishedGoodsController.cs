using ERP_API.Dtos;
using ERP_API.Interfaces;
using ERP_API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ERP_API.Controllers;

/// <summary>
/// REST endpoints for finished-goods stock. Maps to the frontend
/// inventory.service.js finishedGoodsService methods.
/// </summary>
[ApiController]
[Route("api/inventory/finished-goods")]
[Authorize]
public class FinishedGoodsController : ControllerBase
{
    private readonly IFinishedGoodsService _service;

    public FinishedGoodsController(IFinishedGoodsService service) => _service = service;

    /// <summary>GET /api/inventory/finished-goods — list all.</summary>
    [HttpGet]
    public async Task<ActionResult<List<FinishedGood>>> GetAll()
    {
        return Ok(await _service.GetAllAsync());
    }

    /// <summary>POST /api/inventory/finished-goods — create a record (rejects a duplicate name).</summary>
    [HttpPost]
    public async Task<ActionResult<FinishedGood>> Create([FromBody] FinishedGoodRequest draft)
    {
        var name = (draft.Name ?? string.Empty).Trim();
        if (await _service.NameExistsAsync(name))
            return Conflict(new { message = $"A finished good named \"{name}\" already exists." });

        var created = await _service.CreateAsync(draft);
        return CreatedAtAction(nameof(GetAll), new { id = created.Id }, created);
    }

    /// <summary>PATCH /api/inventory/finished-goods/{id}/on-hand — set on-hand qty.</summary>
    [HttpPatch("{id:int}/on-hand")]
    public async Task<ActionResult<FinishedGood>> SetOnHand(int id, [FromBody] SetOnHandRequest body)
    {
        var updated = await _service.SetOnHandAsync(id, body.OnHand);
        return updated is null ? NotFound() : Ok(updated);
    }

    /// <summary>POST /api/inventory/finished-goods/produce — add produced units to stock.</summary>
    [HttpPost("produce")]
    public async Task<ActionResult<FinishedGood>> Produce([FromBody] StockMovementRequest move)
    {
        return Ok(await _service.ProduceAsync(move));
    }

    /// <summary>DELETE /api/inventory/finished-goods/{id} — remove a record.</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var removed = await _service.DeleteAsync(id);
        return removed ? NoContent() : NotFound();
    }
}
