
using System;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Backend.Data;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("files")]
[Authorize]
public class FilesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IFileStorageService _storage;
    private const long MaxFileSize = 10 * 1024 * 1024; // 10 MB

    public FilesController(AppDbContext db, IFileStorageService storage)
    {
        _db = db;
        _storage = storage;
    }

    [HttpPost("upload")]
    public async Task<IActionResult> Upload(IFormFile file)
    {
        if (file == null) return BadRequest("No file provided");
        if (file.Length == 0) return BadRequest("Empty file");
        if (file.Length > MaxFileSize) return BadRequest($"File too large. Max is {MaxFileSize} bytes");

        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var storedName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);
        await using var stream = file.OpenReadStream();
        await _storage.SaveAsync(stream, storedName);

        var record = new FileRecord
        {
            Id = Guid.NewGuid(),
            OwnerId = userId,
            OriginalFileName = file.FileName,
            StoredFileName = storedName,
            ContentType = file.ContentType,
            Size = file.Length,
            UploadedAt = DateTime.UtcNow
        };

        _db.Files.Add(record);
        await _db.SaveChangesAsync();
        return Ok(record);
    }

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var list = await _db.Files.Where(f => f.OwnerId == userId).
            OrderByDescending(f => f.UploadedAt).ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id:guid}/download")]
    public async Task<IActionResult> Download(Guid id)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var rec = await _db.Files.FindAsync(id);
        if (rec == null || rec.OwnerId != userId) return NotFound();

        var stream = await _storage.GetStreamAsync(rec.StoredFileName ?? string.Empty);
        return File(stream, rec.ContentType ?? "application/octet-stream", rec.OriginalFileName);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var rec = await _db.Files.FindAsync(id);
        if (rec == null || rec.OwnerId != userId) return NotFound();

        await _storage.DeleteAsync(rec.StoredFileName ?? string.Empty);
        _db.Files.Remove(rec);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}