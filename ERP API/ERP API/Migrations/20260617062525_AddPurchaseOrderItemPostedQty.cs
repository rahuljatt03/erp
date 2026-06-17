using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ERP_API.Migrations
{
    /// <inheritdoc />
    public partial class AddPurchaseOrderItemPostedQty : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "PostedQty",
                table: "purchase_order_items",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0);

            // Backfill: any quantity already received under the previous flow was
            // already posted into raw-material inventory, so seed the ledger to
            // match. Otherwise the new reconcile would count those quantities a
            // second time the next time the order is touched.
            migrationBuilder.Sql(
                "UPDATE purchase_order_items SET \"PostedQty\" = \"ReceivedQty\";");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PostedQty",
                table: "purchase_order_items");
        }
    }
}
