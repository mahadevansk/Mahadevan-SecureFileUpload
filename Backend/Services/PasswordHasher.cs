using System.Security.Cryptography;
using System.Text;

namespace Backend.Services;

public interface IPasswordHasher
{
    string Hash(string password);
    bool Verify(string hashed, string password);
}

/// <summary>
/// Simple password hasher.
/// </summary>
public class PasswordHasher : IPasswordHasher
{
    private const int Iterations = 100_000;
    private const int SaltSize = 16; // 128-bit
    private const int HashSize = 32; // 256-bit

    public string Hash(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(SaltSize);
        var pbkdf2 = new Rfc2898DeriveBytes(password, salt,
            Iterations, HashAlgorithmName.SHA256);
        var hash = pbkdf2.GetBytes(HashSize);
        return $"{Iterations}.{Convert.ToBase64String(salt)}.{
            Convert.ToBase64String(hash)}";
    }

    public bool Verify(string hashed, string password)
    {
        try
        {
            var parts = hashed.Split('.', 3);
            if (parts.Length != 3) return false;
            var iterations = int.Parse(parts[0]);
            var salt = Convert.FromBase64String(parts[1]);
            
            var expected = Convert.FromBase64String(parts[2]);
            var pbkdf2 = new Rfc2898DeriveBytes(password, salt,
                iterations, HashAlgorithmName.SHA256);

            var actual = pbkdf2.GetBytes(expected.Length);
            return CryptographicOperations.FixedTimeEquals(actual, expected);

        }
        catch
        {
            return false;
        }
    }
}
