using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AKZ.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddExportsTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Exports",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    LedgerId = table.Column<int>(type: "int", nullable: false),
                    Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    SelectedColors = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SelectedWeight = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TotalExportWeightViss = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TotalExportWeightKg = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ProductAmountMMK = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ProductAmountCNY = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    WorkerFees = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    GrandTotalMMK = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ExchangeRateId = table.Column<int>(type: "int", nullable: true),
                    SellingPrice = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
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
                    table.PrimaryKey("PK_Exports", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Exports_ExchangeRates_ExchangeRateId",
                        column: x => x.ExchangeRateId,
                        principalTable: "ExchangeRates",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Exports_Ledgers_LedgerId",
                        column: x => x.LedgerId,
                        principalTable: "Ledgers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Exports_ExchangeRateId",
                table: "Exports",
                column: "ExchangeRateId");

            migrationBuilder.CreateIndex(
                name: "IX_Exports_LedgerId",
                table: "Exports",
                column: "LedgerId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Exports");
        }
    }
}
