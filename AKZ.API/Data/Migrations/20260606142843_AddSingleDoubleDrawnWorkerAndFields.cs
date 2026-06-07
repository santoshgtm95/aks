using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AKZ.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddSingleDoubleDrawnWorkerAndFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Note",
                table: "SingleDoubleDrawnRecords",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "SingleDoubleLostWeight",
                table: "SingleDoubleDrawnRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "WorkerId",
                table: "SingleDoubleDrawnRecords",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "SingleDoubleDrawnWorkers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    WarehouseId = table.Column<int>(type: "int", nullable: false),
                    DeleteFlg = table.Column<int>(type: "int", nullable: false),
                    CreateDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreateBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UpdateDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdateBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DeleteDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DeleteBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SingleDoubleDrawnWorkers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SingleDoubleDrawnWorkers_Warehouses_WarehouseId",
                        column: x => x.WarehouseId,
                        principalTable: "Warehouses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SingleDoubleDrawnRecords_WorkerId",
                table: "SingleDoubleDrawnRecords",
                column: "WorkerId");

            migrationBuilder.CreateIndex(
                name: "IX_SingleDoubleDrawnWorkers_WarehouseId",
                table: "SingleDoubleDrawnWorkers",
                column: "WarehouseId");

            migrationBuilder.AddForeignKey(
                name: "FK_SingleDoubleDrawnRecords_SingleDoubleDrawnWorkers_WorkerId",
                table: "SingleDoubleDrawnRecords",
                column: "WorkerId",
                principalTable: "SingleDoubleDrawnWorkers",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SingleDoubleDrawnRecords_SingleDoubleDrawnWorkers_WorkerId",
                table: "SingleDoubleDrawnRecords");

            migrationBuilder.DropTable(
                name: "SingleDoubleDrawnWorkers");

            migrationBuilder.DropIndex(
                name: "IX_SingleDoubleDrawnRecords_WorkerId",
                table: "SingleDoubleDrawnRecords");

            migrationBuilder.DropColumn(
                name: "Note",
                table: "SingleDoubleDrawnRecords");

            migrationBuilder.DropColumn(
                name: "SingleDoubleLostWeight",
                table: "SingleDoubleDrawnRecords");

            migrationBuilder.DropColumn(
                name: "WorkerId",
                table: "SingleDoubleDrawnRecords");
        }
    }
}
