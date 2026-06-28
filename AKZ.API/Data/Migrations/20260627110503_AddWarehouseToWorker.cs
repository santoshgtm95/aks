using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AKZ.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddWarehouseToWorker : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "WarehouseId",
                table: "Workers",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "WarehouseName",
                table: "Workers",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Workers_WarehouseId",
                table: "Workers",
                column: "WarehouseId");

            migrationBuilder.AddForeignKey(
                name: "FK_Workers_Warehouses_WarehouseId",
                table: "Workers",
                column: "WarehouseId",
                principalTable: "Warehouses",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Workers_Warehouses_WarehouseId",
                table: "Workers");

            migrationBuilder.DropIndex(
                name: "IX_Workers_WarehouseId",
                table: "Workers");

            migrationBuilder.DropColumn(
                name: "WarehouseId",
                table: "Workers");

            migrationBuilder.DropColumn(
                name: "WarehouseName",
                table: "Workers");
        }
    }
}
