using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AKZ.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddAllSizesPricesToSemiExport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "Price10B",
                table: "SemiExportRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Price6",
                table: "SemiExportRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Price7",
                table: "SemiExportRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Price9",
                table: "SemiExportRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Price10B",
                table: "SemiExportRecords");

            migrationBuilder.DropColumn(
                name: "Price6",
                table: "SemiExportRecords");

            migrationBuilder.DropColumn(
                name: "Price7",
                table: "SemiExportRecords");

            migrationBuilder.DropColumn(
                name: "Price9",
                table: "SemiExportRecords");
        }
    }
}
