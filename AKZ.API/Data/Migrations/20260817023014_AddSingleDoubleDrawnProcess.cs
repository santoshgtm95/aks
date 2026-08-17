using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AKZ.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddSingleDoubleDrawnProcess : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "SingleDoubleDrawnProcessId",
                table: "SingleDoubleDrawnRecords",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "SingleDoubleDrawnProcesses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    RefinementRecordId = table.Column<int>(type: "int", nullable: false),
                    Category = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Weight = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    RemainingWeight = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    WorkerId = table.Column<int>(type: "int", nullable: true),
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
                    table.PrimaryKey("PK_SingleDoubleDrawnProcesses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SingleDoubleDrawnProcesses_RefinementRecords_RefinementRecordId",
                        column: x => x.RefinementRecordId,
                        principalTable: "RefinementRecords",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SingleDoubleDrawnProcesses_Workers_WorkerId",
                        column: x => x.WorkerId,
                        principalTable: "Workers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SingleDoubleDrawnRecords_SingleDoubleDrawnProcessId",
                table: "SingleDoubleDrawnRecords",
                column: "SingleDoubleDrawnProcessId");

            migrationBuilder.CreateIndex(
                name: "IX_SingleDoubleDrawnProcesses_RefinementRecordId",
                table: "SingleDoubleDrawnProcesses",
                column: "RefinementRecordId");

            migrationBuilder.CreateIndex(
                name: "IX_SingleDoubleDrawnProcesses_WorkerId",
                table: "SingleDoubleDrawnProcesses",
                column: "WorkerId");

            migrationBuilder.AddForeignKey(
                name: "FK_SingleDoubleDrawnRecords_SingleDoubleDrawnProcesses_SingleDoubleDrawnProcessId",
                table: "SingleDoubleDrawnRecords",
                column: "SingleDoubleDrawnProcessId",
                principalTable: "SingleDoubleDrawnProcesses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SingleDoubleDrawnRecords_SingleDoubleDrawnProcesses_SingleDoubleDrawnProcessId",
                table: "SingleDoubleDrawnRecords");

            migrationBuilder.DropTable(
                name: "SingleDoubleDrawnProcesses");

            migrationBuilder.DropIndex(
                name: "IX_SingleDoubleDrawnRecords_SingleDoubleDrawnProcessId",
                table: "SingleDoubleDrawnRecords");

            migrationBuilder.DropColumn(
                name: "SingleDoubleDrawnProcessId",
                table: "SingleDoubleDrawnRecords");
        }
    }
}
