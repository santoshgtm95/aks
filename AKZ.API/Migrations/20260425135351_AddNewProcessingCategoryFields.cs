using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AKZ.API.Migrations
{
    /// <inheritdoc />
    public partial class AddNewProcessingCategoryFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "ArtificialWeight",
                table: "ProcessingRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "NaturalRedWeight",
                table: "ProcessingRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "NaturalWhiteWeight",
                table: "ProcessingRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "ShortCutWeight",
                table: "ProcessingRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ArtificialWeight",
                table: "ProcessingRecords");

            migrationBuilder.DropColumn(
                name: "NaturalRedWeight",
                table: "ProcessingRecords");

            migrationBuilder.DropColumn(
                name: "NaturalWhiteWeight",
                table: "ProcessingRecords");

            migrationBuilder.DropColumn(
                name: "ShortCutWeight",
                table: "ProcessingRecords");
        }
    }
}
