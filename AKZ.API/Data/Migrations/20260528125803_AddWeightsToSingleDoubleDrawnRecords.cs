using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AKZ.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddWeightsToSingleDoubleDrawnRecords : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "LostWeight",
                table: "SingleDoubleDrawnRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "ReturnWeight",
                table: "SingleDoubleDrawnRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "SpoilageWeight",
                table: "SingleDoubleDrawnRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LostWeight",
                table: "SingleDoubleDrawnRecords");

            migrationBuilder.DropColumn(
                name: "ReturnWeight",
                table: "SingleDoubleDrawnRecords");

            migrationBuilder.DropColumn(
                name: "SpoilageWeight",
                table: "SingleDoubleDrawnRecords");
        }
    }
}
