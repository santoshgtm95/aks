using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AKZ.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPricesToSingleDoubleDrawn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "Price10",
                table: "SingleDoubleDrawnRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Price10B",
                table: "SingleDoubleDrawnRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Price12",
                table: "SingleDoubleDrawnRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Price14",
                table: "SingleDoubleDrawnRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Price16",
                table: "SingleDoubleDrawnRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Price18",
                table: "SingleDoubleDrawnRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Price20",
                table: "SingleDoubleDrawnRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Price22",
                table: "SingleDoubleDrawnRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Price24",
                table: "SingleDoubleDrawnRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Price26",
                table: "SingleDoubleDrawnRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Price28",
                table: "SingleDoubleDrawnRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Price6",
                table: "SingleDoubleDrawnRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Price7",
                table: "SingleDoubleDrawnRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Price8",
                table: "SingleDoubleDrawnRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Price9",
                table: "SingleDoubleDrawnRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "PriceBar",
                table: "SingleDoubleDrawnRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Price10",
                table: "SingleDoubleDrawnRecords");

            migrationBuilder.DropColumn(
                name: "Price10B",
                table: "SingleDoubleDrawnRecords");

            migrationBuilder.DropColumn(
                name: "Price12",
                table: "SingleDoubleDrawnRecords");

            migrationBuilder.DropColumn(
                name: "Price14",
                table: "SingleDoubleDrawnRecords");

            migrationBuilder.DropColumn(
                name: "Price16",
                table: "SingleDoubleDrawnRecords");

            migrationBuilder.DropColumn(
                name: "Price18",
                table: "SingleDoubleDrawnRecords");

            migrationBuilder.DropColumn(
                name: "Price20",
                table: "SingleDoubleDrawnRecords");

            migrationBuilder.DropColumn(
                name: "Price22",
                table: "SingleDoubleDrawnRecords");

            migrationBuilder.DropColumn(
                name: "Price24",
                table: "SingleDoubleDrawnRecords");

            migrationBuilder.DropColumn(
                name: "Price26",
                table: "SingleDoubleDrawnRecords");

            migrationBuilder.DropColumn(
                name: "Price28",
                table: "SingleDoubleDrawnRecords");

            migrationBuilder.DropColumn(
                name: "Price6",
                table: "SingleDoubleDrawnRecords");

            migrationBuilder.DropColumn(
                name: "Price7",
                table: "SingleDoubleDrawnRecords");

            migrationBuilder.DropColumn(
                name: "Price8",
                table: "SingleDoubleDrawnRecords");

            migrationBuilder.DropColumn(
                name: "Price9",
                table: "SingleDoubleDrawnRecords");

            migrationBuilder.DropColumn(
                name: "PriceBar",
                table: "SingleDoubleDrawnRecords");
        }
    }
}
