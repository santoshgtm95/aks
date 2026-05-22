using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AKZ.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class UpdateRefinementFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsWeightFull",
                table: "RefinementRecords");

            migrationBuilder.DropColumn(
                name: "IsWeightFull",
                table: "RefinementProcesses");

            migrationBuilder.AddColumn<decimal>(
                name: "LostWeight",
                table: "RefinementRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "LostWeight",
                table: "RefinementProcesses",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LostWeight",
                table: "RefinementRecords");

            migrationBuilder.DropColumn(
                name: "LostWeight",
                table: "RefinementProcesses");

            migrationBuilder.AddColumn<bool>(
                name: "IsWeightFull",
                table: "RefinementRecords",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsWeightFull",
                table: "RefinementProcesses",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }
    }
}
