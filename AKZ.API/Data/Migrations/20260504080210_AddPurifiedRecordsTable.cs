using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AKZ.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPurifiedRecordsTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PurifiedRecords",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ProcessingRecordId = table.Column<int>(type: "int", nullable: false),
                    Category = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Count = table.Column<int>(type: "int", nullable: false),
                    Weight = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    PurifierId = table.Column<int>(type: "int", nullable: true),
                    IsWeightFull = table.Column<bool>(type: "bit", nullable: false),
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
                    table.PrimaryKey("PK_PurifiedRecords", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PurifiedRecords_ProcessingRecords_ProcessingRecordId",
                        column: x => x.ProcessingRecordId,
                        principalTable: "ProcessingRecords",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PurifiedRecords_Purifiers_PurifierId",
                        column: x => x.PurifierId,
                        principalTable: "Purifiers",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_PurifiedRecords_ProcessingRecordId",
                table: "PurifiedRecords",
                column: "ProcessingRecordId");

            migrationBuilder.CreateIndex(
                name: "IX_PurifiedRecords_PurifierId",
                table: "PurifiedRecords",
                column: "PurifierId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PurifiedRecords");
        }
    }
}
