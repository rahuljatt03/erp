using ERP_API.Dtos;
using ERP_API.Interfaces;
using ERP_API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ERP_API.Controllers;

/// <summary>
/// REST endpoints for procurement / purchase orders. Depends only on
/// <see cref="IProcurementService"/>. Maps to the frontend procurement.service.js.
/// </summary>
[ApiController]
[Route("api/purchase-orders")]
[Authorize]
public class PurchaseOrdersController : ControllerBase
{
    private readonly IProcurementService _service;

    public PurchaseOrdersController(IProcurementService service) => _service = service;

    /// <summary>GET /api/purchase-orders — list all, newest first.</summary>
    [HttpGet]
    public async Task<ActionResult<List<PurchaseOrder>>> GetAll()
    {
        return Ok(await _service.GetAllAsync());
    }

    /// <summary>GET /api/purchase-orders/{id} — one purchase order.</summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<PurchaseOrder>> GetById(int id)
    {
        var po = await _service.GetByIdAsync(id);
        return po is null ? NotFound() : Ok(po);
    }

    /// <summary>POST /api/purchase-orders — create.</summary>
    [HttpPost]
    public async Task<ActionResult<PurchaseOrder>> Create([FromBody] PurchaseOrderRequest draft)
    {
        var created = await _service.CreateAsync(draft);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    /// <summary>PUT /api/purchase-orders/{id} — full update (status derived from receipts).</summary>
    [HttpPut("{id:int}")]
    public async Task<ActionResult<PurchaseOrder>> Update(int id, [FromBody] PurchaseOrderRequest draft)
    {
        var updated = await _service.UpdateAsync(id, draft);
        return updated is null ? NotFound() : Ok(updated);
    }

    /// <summary>DELETE /api/purchase-orders/{id}.</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var removed = await _service.DeleteAsync(id);
        return removed ? NoContent() : NotFound();
    }

    /// <summary>
    /// POST /api/purchase-orders/{id}/receive — record a goods receipt. Body is a
    /// list of { itemId, qty }. Increments receivedQty and recomputes status.
    /// </summary>
    [HttpPost("{id:int}/receive")]
    public async Task<ActionResult<PurchaseOrder>> Receive(int id, [FromBody] List<ReceiptRequest> receipts)
    {
        var updated = await _service.ReceiveAsync(id, receipts);
        return updated is null ? NotFound() : Ok(updated);
    }
}
