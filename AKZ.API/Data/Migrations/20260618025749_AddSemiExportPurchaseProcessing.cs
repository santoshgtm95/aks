using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AKZ.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddSemiExportPurchaseProcessing : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SemiExportPurchaseProcessings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SemiExportPurchaseId = table.Column<int>(type: "int", nullable: false),
                    WorkerId = table.Column<int>(type: "int", nullable: false),
                    AssignWeight = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    LostWeight = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
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
                    table.PrimaryKey("PK_SemiExportPurchaseProcessings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SemiExportPurchaseProcessings_SemiExportPurchases_SemiExportPurchaseId",
                        column: x => x.SemiExportPurchaseId,
                        principalTable: "SemiExportPurchases",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SemiExportPurchaseProcessings_SingleDoubleDrawnWorkers_WorkerId",
                        column: x => x.WorkerId,
                        principalTable: "SingleDoubleDrawnWorkers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SemiExportPurchaseProcessings_SemiExportPurchaseId",
                table: "SemiExportPurchaseProcessings",
                column: "SemiExportPurchaseId");

            migrationBuilder.CreateIndex(
                name: "IX_SemiExportPurchaseProcessings_WorkerId",
                table: "SemiExportPurchaseProcessings",
                column: "WorkerId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SemiExportPurchaseProcessings");
        }
    }
}
