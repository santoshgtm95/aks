using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AKZ.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddMessLabourWorkerToProcessing : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "MessLabourWorkerId",
                table: "ProcessingRecords",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "MessLabourWorkers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    WarehouseId = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
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
                    table.PrimaryKey("PK_MessLabourWorkers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MessLabourWorkers_Warehouses_WarehouseId",
                        column: x => x.WarehouseId,
                        principalTable: "Warehouses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProcessingRecords_MessLabourWorkerId",
                table: "ProcessingRecords",
                column: "MessLabourWorkerId");

            migrationBuilder.CreateIndex(
                name: "IX_MessLabourWorkers_WarehouseId",
                table: "MessLabourWorkers",
                column: "WarehouseId");

            migrationBuilder.AddForeignKey(
                name: "FK_ProcessingRecords_MessLabourWorkers_MessLabourWorkerId",
                table: "ProcessingRecords",
                column: "MessLabourWorkerId",
                principalTable: "MessLabourWorkers",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProcessingRecords_MessLabourWorkers_MessLabourWorkerId",
                table: "ProcessingRecords");

            migrationBuilder.DropTable(
                name: "MessLabourWorkers");

            migrationBuilder.DropIndex(
                name: "IX_ProcessingRecords_MessLabourWorkerId",
                table: "ProcessingRecords");

            migrationBuilder.DropColumn(
                name: "MessLabourWorkerId",
                table: "ProcessingRecords");
        }
    }
}
