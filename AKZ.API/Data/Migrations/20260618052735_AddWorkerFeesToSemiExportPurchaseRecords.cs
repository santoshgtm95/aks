using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AKZ.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkerFeesToSemiExportPurchaseRecords : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "WorkerFees",
                table: "SemiExportPurchaseRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "WorkerName",
                table: "SemiExportPurchaseRecords",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "WorkerFees",
                table: "SemiExportPurchaseRecords");

            migrationBuilder.DropColumn(
                name: "WorkerName",
                table: "SemiExportPurchaseRecords");
        }
    }
}
