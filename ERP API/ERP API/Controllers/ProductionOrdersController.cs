using ERP_API.Dtos;
using ERP_API.Interfaces;
using ERP_API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ERP_API.Controllers;

/// <summary>
/// REST endpoints for production / work orders. Depends only on
/// <see cref="IProductionService"/>. Maps to the frontend production.service.js.
/// </summary>
[ApiController]
[Route("api/production-orders")]
[Authorize]
public class ProductionOrdersController : ControllerBase
{
    private readonly IProductionService _service;

    public ProductionOrdersController(IProductionService service) => _service = service;

    /// <summary>GET /api/production-orders — list all, newest first.</summary>
    [HttpGet]
    public async Task<ActionResult<List<ProductionOrder>>> GetAll()
    {
        return Ok(await _service.GetAllAsync());
    }

    /// <summary>GET /api/production-orders/{id} — one work order.</summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<ProductionOrder>> GetById(int id)
    {
        var wo = await _service.GetByIdAsync(id);
        return wo is null ? NotFound() : Ok(wo);
    }

    /// <summary>POST /api/production-orders — create.</summary>
    [HttpPost]
    public async Task<ActionResult<ProductionOrder>> Create([FromBody] ProductionOrderRequest draft)
    {
        var created = await _service.CreateAsync(draft);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    /// <summary>PUT /api/production-orders/{id} — full update.</summary>
    [HttpPut("{id:int}")]
    public async Task<ActionResult<ProductionOrder>> Update(int id, [FromBody] ProductionOrderRequest draft)
    {
        var updated = await _service.UpdateAsync(id, draft);
        return updated is null ? NotFound() : Ok(updated);
    }

    /// <summary>DELETE /api/production-orders/{id}.</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var removed = await _service.DeleteAsync(id);
        return removed ? NoContent() : NotFound();
    }

    /// <summary>
    /// POST /api/production-orders/{id}/produce — report production of qty units.
    /// Advances producedQty + each material's consumedQty + status.
    /// </summary>
    [HttpPost("{id:int}/produce")]
    public async Task<ActionResult<ProductionOrder>> Produce(int id, [FromBody] ProduceRequest body)
    {
        var updated = await _service.ProduceAsync(id, body.Qty);
        return updated is null ? NotFound() : Ok(updated);
    }
}
