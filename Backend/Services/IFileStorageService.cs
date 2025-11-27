using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace Backend.Services;

public interface IFileStorageService
{
    Task SaveAsync(Stream stream, string storedName,
         CancellationToken cancellationToken = default);
    Task<Stream> GetStreamAsync(string storedName,
        CancellationToken cancellationToken = default);
    Task DeleteAsync(string storedName,
        CancellationToken cancellationToken = default);
}
