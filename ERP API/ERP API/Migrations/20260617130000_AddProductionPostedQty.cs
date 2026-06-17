using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ERP_API.Migrations
{
    /// <inheritdoc />
    public partial class AddProductionPostedQty : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "PostedQty",
                table: "production_orders",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<double>(
                name: "PostedQty",
                table: "work_order_materials",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0);

            // Backfill: under the previous flow the frontend already posted produced
            // units into finished-goods stock and consumed quantities out of raw
            // stock, so seed both ledgers to match what was already posted. Otherwise
            // the new reconcile would count those quantities a second time the next
            // time a work order is produced or edited.
            migrationBuilder.Sql(
                "UPDATE production_orders SET \"PostedQty\" = \"ProducedQty\";");
            migrationBuilder.Sql(
                "UPDATE work_order_materials SET \"PostedQty\" = \"ConsumedQty\";");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PostedQty",
                table: "production_orders");

            migrationBuilder.DropColumn(
                name: "PostedQty",
                table: "work_order_materials");
        }
    }
}
