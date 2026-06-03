using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AKZ.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class RemovePricesFromSemiExport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Price10",
                table: "SemiExportRecords");

            migrationBuilder.DropColumn(
                name: "Price10B",
                table: "SemiExportRecords");

            migrationBuilder.DropColumn(
                name: "Price12",
                table: "SemiExportRecords");

            migrationBuilder.DropColumn(
                name: "Price14",
                table: "SemiExportRecords");

            migrationBuilder.DropColumn(
                name: "Price16",
                table: "SemiExportRecords");

            migrationBuilder.DropColumn(
                name: "Price18",
                table: "SemiExportRecords");

            migrationBuilder.DropColumn(
                name: "Price20",
                table: "SemiExportRecords");

            migrationBuilder.DropColumn(
                name: "Price22",
                table: "SemiExportRecords");

            migrationBuilder.DropColumn(
                name: "Price24",
                table: "SemiExportRecords");

            migrationBuilder.DropColumn(
                name: "Price26",
                table: "SemiExportRecords");

            migrationBuilder.DropColumn(
                name: "Price28",
                table: "SemiExportRecords");

            migrationBuilder.DropColumn(
                name: "Price6",
                table: "SemiExportRecords");

            migrationBuilder.DropColumn(
                name: "Price7",
                table: "SemiExportRecords");

            migrationBuilder.DropColumn(
                name: "Price8",
                table: "SemiExportRecords");

            migrationBuilder.DropColumn(
                name: "Price9",
                table: "SemiExportRecords");

            migrationBuilder.DropColumn(
                name: "PriceB",
                table: "SemiExportRecords");

            migrationBuilder.DropColumn(
                name: "PriceLeftover",
                table: "SemiExportRecords");

            migrationBuilder.DropColumn(
                name: "PriceSpoil",
                table: "SemiExportRecords");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "Price10",
                table: "SemiExportRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Price10B",
                table: "SemiExportRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Price12",
                table: "SemiExportRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Price14",
                table: "SemiExportRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Price16",
                table: "SemiExportRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Price18",
                table: "SemiExportRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Price20",
                table: "SemiExportRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Price22",
                table: "SemiExportRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Price24",
                table: "SemiExportRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Price26",
                table: "SemiExportRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Price28",
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
                name: "Price8",
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

            migrationBuilder.AddColumn<decimal>(
                name: "PriceB",
                table: "SemiExportRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "PriceLeftover",
                table: "SemiExportRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "PriceSpoil",
                table: "SemiExportRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);
        }
    }
}
