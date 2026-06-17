using ERP_API.Models;
using Microsoft.EntityFrameworkCore;

namespace ERP_API.Data;

/// <summary>
/// EF Core context for the ERP. One DbSet per table; a new module's DbSets get
/// added here as each API is built.
/// </summary>
public class ErpDbContext : DbContext
{
    public ErpDbContext(DbContextOptions<ErpDbContext> options) : base(options) { }

    public DbSet<Inquiry> Inquiries => Set<Inquiry>();
    public DbSet<InquiryItem> InquiryItems => Set<InquiryItem>();
    public DbSet<RawMaterialRequirement> RawMaterialRequirements => Set<RawMaterialRequirement>();

    public DbSet<Quotation> Quotations => Set<Quotation>();
    public DbSet<QuotationItem> QuotationItems => Set<QuotationItem>();

    public DbSet<SalesOrder> SalesOrders => Set<SalesOrder>();
    public DbSet<SalesOrderItem> SalesOrderItems => Set<SalesOrderItem>();

    public DbSet<FinishedGood> FinishedGoods => Set<FinishedGood>();
    public DbSet<RawMaterialStock> RawMaterials => Set<RawMaterialStock>();

    public DbSet<ProductionOrder> ProductionOrders => Set<ProductionOrder>();
    public DbSet<WorkOrderMaterial> WorkOrderMaterials => Set<WorkOrderMaterial>();

    public DbSet<PurchaseOrder> PurchaseOrders => Set<PurchaseOrder>();
    public DbSet<PurchaseOrderItem> PurchaseOrderItems => Set<PurchaseOrderItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Inquiry>(e =>
        {
            e.ToTable("inquiries");
            e.HasIndex(x => x.InquiryNo).IsUnique();
            e.HasMany(x => x.Items)
             .WithOne(x => x.Inquiry!)
             .HasForeignKey(x => x.InquiryId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<InquiryItem>(e =>
        {
            e.ToTable("inquiry_items");
            e.HasMany(x => x.RawMaterials)
             .WithOne(x => x.InquiryItem!)
             .HasForeignKey(x => x.InquiryItemId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<RawMaterialRequirement>(e =>
        {
            e.ToTable("raw_material_requirements");
        });

        modelBuilder.Entity<Quotation>(e =>
        {
            e.ToTable("quotations");
            e.HasIndex(x => x.QuoteNo).IsUnique();
            e.HasMany(x => x.Items)
             .WithOne(x => x.Quotation!)
             .HasForeignKey(x => x.QuotationId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<QuotationItem>(e =>
        {
            e.ToTable("quotation_items");
        });

        modelBuilder.Entity<SalesOrder>(e =>
        {
            e.ToTable("sales_orders");
            e.HasIndex(x => x.SoNo).IsUnique();
            e.HasMany(x => x.Items)
             .WithOne(x => x.SalesOrder!)
             .HasForeignKey(x => x.SalesOrderId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SalesOrderItem>(e =>
        {
            e.ToTable("sales_order_items");
        });

        modelBuilder.Entity<FinishedGood>(e =>
        {
            e.ToTable("finished_goods");
        });

        modelBuilder.Entity<RawMaterialStock>(e =>
        {
            e.ToTable("raw_materials");
        });

        modelBuilder.Entity<ProductionOrder>(e =>
        {
            e.ToTable("production_orders");
            e.HasIndex(x => x.WoNo).IsUnique();
            e.HasMany(x => x.Materials)
             .WithOne(x => x.ProductionOrder!)
             .HasForeignKey(x => x.ProductionOrderId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<WorkOrderMaterial>(e =>
        {
            e.ToTable("work_order_materials");
        });

        modelBuilder.Entity<PurchaseOrder>(e =>
        {
            e.ToTable("purchase_orders");
            e.HasIndex(x => x.PoNo).IsUnique();
            e.HasMany(x => x.Items)
             .WithOne(x => x.PurchaseOrder!)
             .HasForeignKey(x => x.PurchaseOrderId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PurchaseOrderItem>(e =>
        {
            e.ToTable("purchase_order_items");
        });
    }
}
