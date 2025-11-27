using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;

namespace Backend.Services;

public class LocalFileStorageService : IFileStorageService
{
    private readonly string _basePath;

    public LocalFileStorageService(IConfiguration cfg)
    {
        _basePath = cfg["FileStorage:Path"] ??
            Path.Combine(Directory.GetCurrentDirectory(), "uploads");
        Directory.CreateDirectory(_basePath);
    }

    public async Task SaveAsync(Stream stream, string storedName,
        CancellationToken cancellationToken = default)
    {
        var path = Path.Combine(_basePath, storedName);
        await using var fs = File.Create(path);
        await stream.CopyToAsync(fs, cancellationToken);
    }

    public Task<Stream> GetStreamAsync(string storedName,
        CancellationToken cancellationToken = default)
    {
        var path = Path.Combine(_basePath, storedName);
        Stream s = File.OpenRead(path);
        return Task.FromResult(s);
    }

    public Task DeleteAsync(string storedName,
        CancellationToken cancellationToken = default)
    {
        var path = Path.Combine(_basePath, storedName);
        if (File.Exists(path)) File.Delete(path);
        return Task.CompletedTask;
    }
}
