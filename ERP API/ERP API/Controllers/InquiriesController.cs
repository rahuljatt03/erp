using ERP_API.Dtos;
using ERP_API.Interfaces;
using ERP_API.Models;
using Microsoft.AspNetCore.Mvc;

namespace ERP_API.Controllers;

/// <summary>
/// REST endpoints for inquiries. Depends only on <see cref="IInquiryService"/>.
/// Routes map 1:1 to the frontend inquiry.service.js methods.
/// </summary>
[ApiController]
[Route("api/inquiries")]
public class InquiriesController : ControllerBase
{
    private readonly IInquiryService _service;

    public InquiriesController(IInquiryService service) => _service = service;

    /// <summary>GET /api/inquiries — list all, newest first.</summary>
    [HttpGet]
    public async Task<ActionResult<List<Inquiry>>> GetAll()
    {
        return Ok(await _service.GetAllAsync());
    }

    /// <summary>GET /api/inquiries/{id} — one inquiry.</summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<Inquiry>> GetById(int id)
    {
        var inquiry = await _service.GetByIdAsync(id);
        return inquiry is null ? NotFound() : Ok(inquiry);
    }

    /// <summary>POST /api/inquiries — create.</summary>
    [HttpPost]
    public async Task<ActionResult<Inquiry>> Create([FromBody] InquiryRequest draft)
    {
        var created = await _service.CreateAsync(draft);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    /// <summary>PUT /api/inquiries/{id} — full update.</summary>
    [HttpPut("{id:int}")]
    public async Task<ActionResult<Inquiry>> Update(int id, [FromBody] InquiryRequest draft)
    {
        var updated = await _service.UpdateAsync(id, draft);
        return updated is null ? NotFound() : Ok(updated);
    }

    /// <summary>DELETE /api/inquiries/{id}.</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var removed = await _service.DeleteAsync(id);
        return removed ? NoContent() : NotFound();
    }

    /// <summary>PATCH /api/inquiries/{id}/status — lightweight status update.</summary>
    [HttpPatch("{id:int}/status")]
    public async Task<ActionResult<Inquiry>> SetStatus(int id, [FromBody] SetStatusRequest body)
    {
        var updated = await _service.SetStatusAsync(id, body.Status);
        return updated is null ? NotFound() : Ok(updated);
    }
}

/// <summary>Body for the status-change endpoint.</summary>
public class SetStatusRequest
{
    public string Status { get; set; } = default!;
}
