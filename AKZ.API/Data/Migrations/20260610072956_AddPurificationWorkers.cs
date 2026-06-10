using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AKZ.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPurificationWorkers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PurificationWorkers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PurifiedRecordId = table.Column<int>(type: "int", nullable: false),
                    PlaceId = table.Column<int>(type: "int", nullable: false),
                    PurifierId = table.Column<int>(type: "int", nullable: false),
                    Count = table.Column<double>(type: "float", nullable: false),
                    WorkerFees = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
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
                    table.PrimaryKey("PK_PurificationWorkers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PurificationWorkers_Places_PlaceId",
                        column: x => x.PlaceId,
                        principalTable: "Places",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PurificationWorkers_PurifiedRecords_PurifiedRecordId",
                        column: x => x.PurifiedRecordId,
                        principalTable: "PurifiedRecords",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PurificationWorkers_Purifiers_PurifierId",
                        column: x => x.PurifierId,
                        principalTable: "Purifiers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PurificationWorkers_PlaceId",
                table: "PurificationWorkers",
                column: "PlaceId");

            migrationBuilder.CreateIndex(
                name: "IX_PurificationWorkers_PurifiedRecordId",
                table: "PurificationWorkers",
                column: "PurifiedRecordId");

            migrationBuilder.CreateIndex(
                name: "IX_PurificationWorkers_PurifierId",
                table: "PurificationWorkers",
                column: "PurifierId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PurificationWorkers");
        }
    }
}
