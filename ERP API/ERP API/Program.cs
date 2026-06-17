using System.Text.Json.Serialization;
using ERP_API.Data;
using ERP_API.Interfaces;
using ERP_API.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// --- Services ---------------------------------------------------------------

// SuppressImplicitRequiredAttributeForNonNullableReferenceTypes: with nullable
// reference types on, non-nullable strings would otherwise be auto-"required" in
// request bodies — but Id/InquiryNo/timestamps are server-generated, so clients
// must not be forced to send them.
builder.Services
    .AddControllers(options =>
        options.SuppressImplicitRequiredAttributeForNonNullableReferenceTypes = true)
    .AddJsonOptions(options =>
        // The React forms bind <input type="number"> to its string value, so
        // quantity/unitPrice arrive as JSON strings ("1"). Allow numeric values to
        // be read from strings instead of returning 400.
        options.JsonSerializerOptions.NumberHandling = JsonNumberHandling.AllowReadingFromString);
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// PostgreSQL via EF Core. Connection string lives in appsettings.json.
builder.Services.AddDbContext<ErpDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("ErpDb")));

// Module services — registered against their interfaces (one per module).
builder.Services.AddScoped<IInquiryService, InquiryService>();
builder.Services.AddScoped<IQuotationService, QuotationService>();
builder.Services.AddScoped<ISalesOrderService, SalesOrderService>();
builder.Services.AddScoped<IFinishedGoodsService, FinishedGoodsService>();
builder.Services.AddScoped<IRawMaterialsService, RawMaterialsService>();
builder.Services.AddScoped<IProductionService, ProductionService>();
builder.Services.AddScoped<IProcurementService, ProcurementService>();

// Allow the Vite/React frontend (dev server) to call the API.
const string FrontendCors = "frontend";
builder.Services.AddCors(options =>
{
    options.AddPolicy(FrontendCors, policy =>
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

var app = builder.Build();

// --- Pipeline ---------------------------------------------------------------

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// CORS must come BEFORE HttpsRedirection: otherwise the preflight OPTIONS request
// can be answered with a 307 redirect, which browsers refuse to follow for CORS,
// surfacing as a "blocked by CORS policy" error in the React app.
app.UseCors(FrontendCors);
app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();
