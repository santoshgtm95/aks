using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AKZ.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class CleanupSemiExportWorkerFeesFromProduct : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SemiExportWorkerFees",
                table: "Products");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "SemiExportWorkerFees",
                table: "Products",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);
        }
    }
}
