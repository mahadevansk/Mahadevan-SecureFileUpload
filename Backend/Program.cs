using System.Text;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddOpenApi();
builder.Services.AddControllers();

// Configure DbContext to use SQLite (file-based). Connection string in appsettings.json
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
     ?? "Data Source=app.db";
builder.Services.AddDbContext<AppDbContext>(opts =>
    opts.UseSqlite(connectionString));

// Configure JWT authentication
var jwtSection = builder.Configuration.GetSection("Jwt");
var jwtKey = jwtSection.GetValue<string>("Key") ??
    throw new InvalidOperationException(
        "JWT:Key is not configured in appsettings.json");
var jwtIssuer = jwtSection.GetValue<string>("Issuer");
var jwtAudience = jwtSection.GetValue<string>("Audience");
var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme =
        JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme =
        JwtBearerDefaults.AuthenticationScheme;
})
    .AddJwtBearer(options =>
    {
        // In local development we allow HTTP so Postman / frontend can call without HTTPS setup.
        options.RequireHttpsMetadata = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = !string.IsNullOrEmpty(jwtIssuer),
            ValidIssuer = jwtIssuer,
            ValidateAudience = !string.IsNullOrEmpty(jwtAudience),
            ValidAudience = jwtAudience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = signingKey,
            ValidateLifetime = true,
        };
    });

builder.Services.AddAuthorization();

// File storage and auth helpers
builder.Services.AddSingleton<IFileStorageService,
    LocalFileStorageService>();
builder.Services.AddSingleton<IPasswordHasher, PasswordHasher>();
builder.Services.AddSingleton<IJwtTokenService, JwtTokenService>();

var app = builder.Build();

// Ensure the SQLite database file and schema exist
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
    // seed a simple test user.
    var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
    if (!db.Users.Any())
    {
        var sampleUser = new Backend.Models.User
        {
            Id = Guid.NewGuid(),
            Username = "test",
            PasswordHash = hasher.Hash("Password123!"),
            CreatedAt = DateTime.UtcNow
        };
        db.Users.Add(sampleUser);
        db.SaveChanges();
        Console.WriteLine($"Seeded sample user -> username: {
                sampleUser.Username}, password: Password123!");
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// Only redirect HTTP -> HTTPS in non-development environments to ease local testing
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
