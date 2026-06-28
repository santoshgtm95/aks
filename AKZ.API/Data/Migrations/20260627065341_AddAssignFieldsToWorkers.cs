using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AKZ.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddAssignFieldsToWorkers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "AssignGirdleBush",
                table: "Workers",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "AssignMessLabour",
                table: "Workers",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "AssignSemiExportPurchase",
                table: "Workers",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "AssignSingleDoubleDrawn",
                table: "Workers",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "AssignWashGrading",
                table: "Workers",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AssignGirdleBush",
                table: "Workers");

            migrationBuilder.DropColumn(
                name: "AssignMessLabour",
                table: "Workers");

            migrationBuilder.DropColumn(
                name: "AssignSemiExportPurchase",
                table: "Workers");

            migrationBuilder.DropColumn(
                name: "AssignSingleDoubleDrawn",
                table: "Workers");

            migrationBuilder.DropColumn(
                name: "AssignWashGrading",
                table: "Workers");
        }
    }
}
