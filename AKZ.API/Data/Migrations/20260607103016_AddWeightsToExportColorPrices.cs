using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AKZ.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddWeightsToExportColorPrices : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "Weight10",
                table: "ExportColorPrices",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Weight10B",
                table: "ExportColorPrices",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Weight12",
                table: "ExportColorPrices",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Weight14",
                table: "ExportColorPrices",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Weight16",
                table: "ExportColorPrices",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Weight18",
                table: "ExportColorPrices",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Weight20",
                table: "ExportColorPrices",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Weight22",
                table: "ExportColorPrices",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Weight24",
                table: "ExportColorPrices",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Weight26",
                table: "ExportColorPrices",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Weight28",
                table: "ExportColorPrices",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Weight6",
                table: "ExportColorPrices",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Weight7",
                table: "ExportColorPrices",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Weight8",
                table: "ExportColorPrices",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Weight9",
                table: "ExportColorPrices",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "WeightBar",
                table: "ExportColorPrices",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Weight10",
                table: "ExportColorPrices");

            migrationBuilder.DropColumn(
                name: "Weight10B",
                table: "ExportColorPrices");

            migrationBuilder.DropColumn(
                name: "Weight12",
                table: "ExportColorPrices");

            migrationBuilder.DropColumn(
                name: "Weight14",
                table: "ExportColorPrices");

            migrationBuilder.DropColumn(
                name: "Weight16",
                table: "ExportColorPrices");

            migrationBuilder.DropColumn(
                name: "Weight18",
                table: "ExportColorPrices");

            migrationBuilder.DropColumn(
                name: "Weight20",
                table: "ExportColorPrices");

            migrationBuilder.DropColumn(
                name: "Weight22",
                table: "ExportColorPrices");

            migrationBuilder.DropColumn(
                name: "Weight24",
                table: "ExportColorPrices");

            migrationBuilder.DropColumn(
                name: "Weight26",
                table: "ExportColorPrices");

            migrationBuilder.DropColumn(
                name: "Weight28",
                table: "ExportColorPrices");

            migrationBuilder.DropColumn(
                name: "Weight6",
                table: "ExportColorPrices");

            migrationBuilder.DropColumn(
                name: "Weight7",
                table: "ExportColorPrices");

            migrationBuilder.DropColumn(
                name: "Weight8",
                table: "ExportColorPrices");

            migrationBuilder.DropColumn(
                name: "Weight9",
                table: "ExportColorPrices");

            migrationBuilder.DropColumn(
                name: "WeightBar",
                table: "ExportColorPrices");
        }
    }
}
