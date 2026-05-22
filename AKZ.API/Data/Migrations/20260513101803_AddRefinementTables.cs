using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AKZ.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddRefinementTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "RefinementProcesses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    PurifiedRecordId = table.Column<int>(type: "int", nullable: false),
                    Category = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Count = table.Column<int>(type: "int", nullable: false),
                    Weight = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    RemainingCountAfter = table.Column<int>(type: "int", nullable: false),
                    RemainingWeightAfter = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    PurifierId = table.Column<int>(type: "int", nullable: true),
                    IsWeightFull = table.Column<bool>(type: "bit", nullable: false),
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
                    table.PrimaryKey("PK_RefinementProcesses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RefinementProcesses_PurifiedRecords_PurifiedRecordId",
                        column: x => x.PurifiedRecordId,
                        principalTable: "PurifiedRecords",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RefinementProcesses_Purifiers_PurifierId",
                        column: x => x.PurifierId,
                        principalTable: "Purifiers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "RefinementRecords",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    PurifiedRecordId = table.Column<int>(type: "int", nullable: false),
                    Category = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Count = table.Column<int>(type: "int", nullable: false),
                    Weight = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    PurifierId = table.Column<int>(type: "int", nullable: true),
                    IsWeightFull = table.Column<bool>(type: "bit", nullable: false),
                    RefinementProcessId = table.Column<int>(type: "int", nullable: true),
                    RemainingCount = table.Column<int>(type: "int", nullable: false),
                    RemainingWeight = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
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
                    table.PrimaryKey("PK_RefinementRecords", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RefinementRecords_PurifiedRecords_PurifiedRecordId",
                        column: x => x.PurifiedRecordId,
                        principalTable: "PurifiedRecords",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RefinementRecords_Purifiers_PurifierId",
                        column: x => x.PurifierId,
                        principalTable: "Purifiers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RefinementRecords_RefinementProcesses_RefinementProcessId",
                        column: x => x.RefinementProcessId,
                        principalTable: "RefinementProcesses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RefinementProcesses_PurifiedRecordId",
                table: "RefinementProcesses",
                column: "PurifiedRecordId");

            migrationBuilder.CreateIndex(
                name: "IX_RefinementProcesses_PurifierId",
                table: "RefinementProcesses",
                column: "PurifierId");

            migrationBuilder.CreateIndex(
                name: "IX_RefinementRecords_PurifiedRecordId",
                table: "RefinementRecords",
                column: "PurifiedRecordId");

            migrationBuilder.CreateIndex(
                name: "IX_RefinementRecords_PurifierId",
                table: "RefinementRecords",
                column: "PurifierId");

            migrationBuilder.CreateIndex(
                name: "IX_RefinementRecords_RefinementProcessId",
                table: "RefinementRecords",
                column: "RefinementProcessId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RefinementRecords");

            migrationBuilder.DropTable(
                name: "RefinementProcesses");
        }
    }
}
