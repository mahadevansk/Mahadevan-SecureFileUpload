using System;

namespace Backend.Models;

public class FileRecord
{
	public Guid Id { get; set; }
	public string? OwnerId { get; set; } // user id from claims
	public string? OriginalFileName { get; set; }
	public string? StoredFileName { get; set; }
	public string? ContentType { get; set; }
	public long Size { get; set; }
	public DateTime UploadedAt { get; set; }
}