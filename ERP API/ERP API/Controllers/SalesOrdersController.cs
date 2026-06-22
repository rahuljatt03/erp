using ERP_API.Dtos;
using ERP_API.Interfaces;
using ERP_API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ERP_API.Controllers;

/// <summary>
/// REST endpoints for sales orders. Depends only on <see cref="ISalesOrderService"/>.
/// Routes map 1:1 to the frontend sales.service.js methods.
/// </summary>
[ApiController]
[Route("api/sales-orders")]
[Authorize]
public class SalesOrdersController : ControllerBase
{
    private readonly ISalesOrderService _service;

    public SalesOrdersController(ISalesOrderService service) => _service = service;

    /// <summary>GET /api/sales-orders — list all, newest first.</summary>
    [HttpGet]
    public async Task<ActionResult<List<SalesOrder>>> GetAll()
    {
        return Ok(await _service.GetAllAsync());
    }

    /// <summary>GET /api/sales-orders/{id} — one sales order.</summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<SalesOrder>> GetById(int id)
    {
        var order = await _service.GetByIdAsync(id);
        return order is null ? NotFound() : Ok(order);
    }

    /// <summary>POST /api/sales-orders — create.</summary>
    [HttpPost]
    public async Task<ActionResult<SalesOrder>> Create([FromBody] SalesOrderRequest draft)
    {
        var created = await _service.CreateAsync(draft);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    /// <summary>PUT /api/sales-orders/{id} — full update.</summary>
    [HttpPut("{id:int}")]
    public async Task<ActionResult<SalesOrder>> Update(int id, [FromBody] SalesOrderRequest draft)
    {
        var updated = await _service.UpdateAsync(id, draft);
        return updated is null ? NotFound() : Ok(updated);
    }

    /// <summary>DELETE /api/sales-orders/{id}.</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var removed = await _service.DeleteAsync(id);
        return removed ? NoContent() : NotFound();
    }

    /// <summary>PATCH /api/sales-orders/{id}/status — lightweight status update.</summary>
    [HttpPatch("{id:int}/status")]
    public async Task<ActionResult<SalesOrder>> SetStatus(int id, [FromBody] SetStatusRequest body)
    {
        var updated = await _service.SetStatusAsync(id, body.Status);
        return updated is null ? NotFound() : Ok(updated);
    }
}
