using ERP_API.Dtos;
using ERP_API.Interfaces;
using ERP_API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ERP_API.Controllers;

/// <summary>
/// REST endpoints for quotations. Depends only on <see cref="IQuotationService"/>.
/// Routes map 1:1 to the frontend quotation.service.js methods.
/// </summary>
[ApiController]
[Route("api/quotations")]
[Authorize]
public class QuotationsController : ControllerBase
{
    private readonly IQuotationService _service;

    public QuotationsController(IQuotationService service) => _service = service;

    /// <summary>GET /api/quotations — list all, newest first.</summary>
    [HttpGet]
    public async Task<ActionResult<List<Quotation>>> GetAll()
    {
        return Ok(await _service.GetAllAsync());
    }

    /// <summary>GET /api/quotations/{id} — one quotation.</summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<Quotation>> GetById(int id)
    {
        var quote = await _service.GetByIdAsync(id);
        return quote is null ? NotFound() : Ok(quote);
    }

    /// <summary>POST /api/quotations — create.</summary>
    [HttpPost]
    public async Task<ActionResult<Quotation>> Create([FromBody] QuotationRequest draft)
    {
        var created = await _service.CreateAsync(draft);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    /// <summary>PUT /api/quotations/{id} — full update.</summary>
    [HttpPut("{id:int}")]
    public async Task<ActionResult<Quotation>> Update(int id, [FromBody] QuotationRequest draft)
    {
        var updated = await _service.UpdateAsync(id, draft);
        return updated is null ? NotFound() : Ok(updated);
    }

    /// <summary>DELETE /api/quotations/{id}.</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var removed = await _service.DeleteAsync(id);
        return removed ? NoContent() : NotFound();
    }

    /// <summary>PATCH /api/quotations/{id}/status — lightweight status update.</summary>
    [HttpPatch("{id:int}/status")]
    public async Task<ActionResult<Quotation>> SetStatus(int id, [FromBody] SetStatusRequest body)
    {
        var updated = await _service.SetStatusAsync(id, body.Status);
        return updated is null ? NotFound() : Ok(updated);
    }
}
