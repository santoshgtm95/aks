using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AKZ.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddSpoilageSizeAndReturnSize : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "PriceReturnSize",
                table: "SingleDoubleDrawnRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "PriceSpoilageSize",
                table: "SingleDoubleDrawnRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "ReturnSize",
                table: "SingleDoubleDrawnRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "SpoilageSize",
                table: "SingleDoubleDrawnRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PriceReturnSize",
                table: "SingleDoubleDrawnRecords");

            migrationBuilder.DropColumn(
                name: "PriceSpoilageSize",
                table: "SingleDoubleDrawnRecords");

            migrationBuilder.DropColumn(
                name: "ReturnSize",
                table: "SingleDoubleDrawnRecords");

            migrationBuilder.DropColumn(
                name: "SpoilageSize",
                table: "SingleDoubleDrawnRecords");
        }
    }
}
