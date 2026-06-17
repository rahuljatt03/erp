using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ERP_API.Migrations
{
    /// <inheritdoc />
    public partial class AddProductionSourceSalesOrder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "SourceSalesOrderId",
                table: "production_orders",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SourceSalesOrderNo",
                table: "production_orders",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SourceSalesOrderId",
                table: "production_orders");

            migrationBuilder.DropColumn(
                name: "SourceSalesOrderNo",
                table: "production_orders");
        }
    }
}
