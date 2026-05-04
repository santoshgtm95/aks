using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AKZ.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCategoryCountsAndRemainingWeight : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ArtificialCount",
                table: "ProcessingRecords",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "NaturalCount",
                table: "ProcessingRecords",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "NaturalRedCount",
                table: "ProcessingRecords",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "NaturalWhiteCount",
                table: "ProcessingRecords",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "RedCount",
                table: "ProcessingRecords",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "RemainingWeight",
                table: "ProcessingRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "ShortCount",
                table: "ProcessingRecords",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ShortCutCount",
                table: "ProcessingRecords",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "SpecialCount",
                table: "ProcessingRecords",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "WhiteCount",
                table: "ProcessingRecords",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ArtificialCount",
                table: "ProcessingRecords");

            migrationBuilder.DropColumn(
                name: "NaturalCount",
                table: "ProcessingRecords");

            migrationBuilder.DropColumn(
                name: "NaturalRedCount",
                table: "ProcessingRecords");

            migrationBuilder.DropColumn(
                name: "NaturalWhiteCount",
                table: "ProcessingRecords");

            migrationBuilder.DropColumn(
                name: "RedCount",
                table: "ProcessingRecords");

            migrationBuilder.DropColumn(
                name: "RemainingWeight",
                table: "ProcessingRecords");

            migrationBuilder.DropColumn(
                name: "ShortCount",
                table: "ProcessingRecords");

            migrationBuilder.DropColumn(
                name: "ShortCutCount",
                table: "ProcessingRecords");

            migrationBuilder.DropColumn(
                name: "SpecialCount",
                table: "ProcessingRecords");

            migrationBuilder.DropColumn(
                name: "WhiteCount",
                table: "ProcessingRecords");
        }
    }
}
