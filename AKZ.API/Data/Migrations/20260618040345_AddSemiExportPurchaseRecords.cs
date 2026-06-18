using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AKZ.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddSemiExportPurchaseRecords : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SemiExportPurchaseRecords",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SemiExportPurchaseProcessingId = table.Column<int>(type: "int", nullable: false),
                    SemiExportPurchaseId = table.Column<int>(type: "int", nullable: false),
                    CustomerName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Contact = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Color = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ReceiveDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    AssignWeight = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    LostWeight = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    ExchangeRateId = table.Column<int>(type: "int", nullable: true),
                    ExchangeRateRate = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Size6Weight = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Size6Price = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Size7Weight = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Size7Price = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Size8Weight = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Size8Price = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Size9Weight = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Size9Price = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Size10Weight = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Size10Price = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Size10BWeight = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Size10BPrice = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Size12Weight = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Size12Price = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Size14Weight = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Size14Price = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Size16Weight = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Size16Price = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Size18Weight = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Size18Price = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Size20Weight = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Size20Price = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Size22Weight = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Size22Price = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Size24Weight = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Size24Price = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Size26Weight = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Size26Price = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Size28Weight = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Size28Price = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    SizeBarWeight = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    SizeBarPrice = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    ReturnWeight = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    ReturnPrice = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    SpoilageWeight = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    SpoilagePrice = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    LostSizeWeight = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    LostSizePrice = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
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
                    table.PrimaryKey("PK_SemiExportPurchaseRecords", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SemiExportPurchaseRecords_ExchangeRates_ExchangeRateId",
                        column: x => x.ExchangeRateId,
                        principalTable: "ExchangeRates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_SemiExportPurchaseRecords_SemiExportPurchaseProcessings_SemiExportPurchaseProcessingId",
                        column: x => x.SemiExportPurchaseProcessingId,
                        principalTable: "SemiExportPurchaseProcessings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SemiExportPurchaseRecords_SemiExportPurchases_SemiExportPurchaseId",
                        column: x => x.SemiExportPurchaseId,
                        principalTable: "SemiExportPurchases",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SemiExportPurchaseRecords_ExchangeRateId",
                table: "SemiExportPurchaseRecords",
                column: "ExchangeRateId");

            migrationBuilder.CreateIndex(
                name: "IX_SemiExportPurchaseRecords_SemiExportPurchaseId",
                table: "SemiExportPurchaseRecords",
                column: "SemiExportPurchaseId");

            migrationBuilder.CreateIndex(
                name: "IX_SemiExportPurchaseRecords_SemiExportPurchaseProcessingId",
                table: "SemiExportPurchaseRecords",
                column: "SemiExportPurchaseProcessingId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SemiExportPurchaseRecords");
        }
    }
}
