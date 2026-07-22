using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AKZ.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddRefiningProcessesTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "RefiningProcessId",
                table: "RefinementRecords",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "RefiningProcesses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    PurifiedRecordId = table.Column<int>(type: "int", nullable: false),
                    Category = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Count = table.Column<double>(type: "float", nullable: false),
                    Weight = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    RefinementWorkerId = table.Column<int>(type: "int", nullable: true),
                    LostWeight = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    SpoilageWeight = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    ReturnWeight = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    RefinementProcessId = table.Column<int>(type: "int", nullable: true),
                    RemainingCount = table.Column<double>(type: "float", nullable: false),
                    RemainingWeight = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
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
                    table.PrimaryKey("PK_RefiningProcesses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RefiningProcesses_PurifiedRecords_PurifiedRecordId",
                        column: x => x.PurifiedRecordId,
                        principalTable: "PurifiedRecords",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RefiningProcesses_RefinementProcesses_RefinementProcessId",
                        column: x => x.RefinementProcessId,
                        principalTable: "RefinementProcesses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RefiningProcesses_Workers_RefinementWorkerId",
                        column: x => x.RefinementWorkerId,
                        principalTable: "Workers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RefinementRecords_RefiningProcessId",
                table: "RefinementRecords",
                column: "RefiningProcessId");

            migrationBuilder.CreateIndex(
                name: "IX_RefiningProcesses_PurifiedRecordId",
                table: "RefiningProcesses",
                column: "PurifiedRecordId");

            migrationBuilder.CreateIndex(
                name: "IX_RefiningProcesses_RefinementProcessId",
                table: "RefiningProcesses",
                column: "RefinementProcessId");

            migrationBuilder.CreateIndex(
                name: "IX_RefiningProcesses_RefinementWorkerId",
                table: "RefiningProcesses",
                column: "RefinementWorkerId");

            migrationBuilder.AddForeignKey(
                name: "FK_RefinementRecords_RefiningProcesses_RefiningProcessId",
                table: "RefinementRecords",
                column: "RefiningProcessId",
                principalTable: "RefiningProcesses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RefinementRecords_RefiningProcesses_RefiningProcessId",
                table: "RefinementRecords");

            migrationBuilder.DropTable(
                name: "RefiningProcesses");

            migrationBuilder.DropIndex(
                name: "IX_RefinementRecords_RefiningProcessId",
                table: "RefinementRecords");

            migrationBuilder.DropColumn(
                name: "RefiningProcessId",
                table: "RefinementRecords");
        }
    }
}
