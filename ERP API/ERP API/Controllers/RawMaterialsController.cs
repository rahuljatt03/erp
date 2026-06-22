using ERP_API.Dtos;
using ERP_API.Interfaces;
using ERP_API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ERP_API.Controllers;

/// <summary>
/// REST endpoints for raw-material stock. Maps to the frontend
/// inventory.service.js rawMaterialsService methods.
/// </summary>
[ApiController]
[Route("api/inventory/raw-materials")]
[Authorize]
public class RawMaterialsController : ControllerBase
{
    private readonly IRawMaterialsService _service;

    public RawMaterialsController(IRawMaterialsService service) => _service = service;

    /// <summary>GET /api/inventory/raw-materials — list all.</summary>
    [HttpGet]
    public async Task<ActionResult<List<RawMaterialStock>>> GetAll()
    {
        return Ok(await _service.GetAllAsync());
    }

    /// <summary>POST /api/inventory/raw-materials — create a record (rejects a duplicate name).</summary>
    [HttpPost]
    public async Task<ActionResult<RawMaterialStock>> Create([FromBody] RawMaterialRequestDto draft)
    {
        var name = (draft.Name ?? string.Empty).Trim();
        if (await _service.NameExistsAsync(name))
            return Conflict(new { message = $"A raw material named \"{name}\" already exists." });

        var created = await _service.CreateAsync(draft);
        return CreatedAtAction(nameof(GetAll), new { id = created.Id }, created);
    }

    /// <summary>PATCH /api/inventory/raw-materials/{id}/on-hand — set on-hand qty.</summary>
    [HttpPatch("{id:int}/on-hand")]
    public async Task<ActionResult<RawMaterialStock>> SetOnHand(int id, [FromBody] SetOnHandRequest body)
    {
        var updated = await _service.SetOnHandAsync(id, body.OnHand);
        return updated is null ? NotFound() : Ok(updated);
    }

    /// <summary>POST /api/inventory/raw-materials/receive — add received stock.</summary>
    [HttpPost("receive")]
    public async Task<ActionResult<RawMaterialStock>> Receive([FromBody] StockMovementRequest move)
    {
        return Ok(await _service.ReceiveAsync(move));
    }

    /// <summary>POST /api/inventory/raw-materials/consume — remove consumed stock (floored at 0).</summary>
    [HttpPost("consume")]
    public async Task<ActionResult<RawMaterialStock>> Consume([FromBody] StockMovementRequest move)
    {
        var result = await _service.ConsumeAsync(move);
        return result is null ? NoContent() : Ok(result);
    }

    /// <summary>DELETE /api/inventory/raw-materials/{id} — remove a record.</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var removed = await _service.DeleteAsync(id);
        return removed ? NoContent() : NotFound();
    }
}
