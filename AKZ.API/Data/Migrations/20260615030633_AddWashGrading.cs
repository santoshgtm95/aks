using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AKZ.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddWashGrading : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "WashGradingWorkers",
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
                    table.PrimaryKey("PK_WashGradingWorkers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WashGradingWorkers_Warehouses_WarehouseId",
                        column: x => x.WarehouseId,
                        principalTable: "Warehouses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "WashGradingProcesses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ProductId = table.Column<int>(type: "int", nullable: false),
                    Weight = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    RemainingWeightAfter = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    WashGradingWorkerId = table.Column<int>(type: "int", nullable: true),
                    WorkerFees = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
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
                    table.PrimaryKey("PK_WashGradingProcesses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WashGradingProcesses_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WashGradingProcesses_WashGradingWorkers_WashGradingWorkerId",
                        column: x => x.WashGradingWorkerId,
                        principalTable: "WashGradingWorkers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "WashGradingRecords",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ProductId = table.Column<int>(type: "int", nullable: false),
                    Weight = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    LostWeight = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    RemainingWeight = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    WashGradingWorkerId = table.Column<int>(type: "int", nullable: true),
                    WashGradingProcessId = table.Column<int>(type: "int", nullable: true),
                    WorkerFees = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
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
                    table.PrimaryKey("PK_WashGradingRecords", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WashGradingRecords_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WashGradingRecords_WashGradingProcesses_WashGradingProcessId",
                        column: x => x.WashGradingProcessId,
                        principalTable: "WashGradingProcesses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WashGradingRecords_WashGradingWorkers_WashGradingWorkerId",
                        column: x => x.WashGradingWorkerId,
                        principalTable: "WashGradingWorkers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_WashGradingProcesses_ProductId",
                table: "WashGradingProcesses",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_WashGradingProcesses_WashGradingWorkerId",
                table: "WashGradingProcesses",
                column: "WashGradingWorkerId");

            migrationBuilder.CreateIndex(
                name: "IX_WashGradingRecords_ProductId",
                table: "WashGradingRecords",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_WashGradingRecords_WashGradingProcessId",
                table: "WashGradingRecords",
                column: "WashGradingProcessId");

            migrationBuilder.CreateIndex(
                name: "IX_WashGradingRecords_WashGradingWorkerId",
                table: "WashGradingRecords",
                column: "WashGradingWorkerId");

            migrationBuilder.CreateIndex(
                name: "IX_WashGradingWorkers_WarehouseId",
                table: "WashGradingWorkers",
                column: "WarehouseId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "WashGradingRecords");

            migrationBuilder.DropTable(
                name: "WashGradingProcesses");

            migrationBuilder.DropTable(
                name: "WashGradingWorkers");
        }
    }
}
