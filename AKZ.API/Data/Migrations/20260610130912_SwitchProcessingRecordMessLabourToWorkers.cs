using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AKZ.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class SwitchProcessingRecordMessLabourToWorkers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProcessingRecords_MessLabourWorkers_MessLabourWorkerId",
                table: "ProcessingRecords");

            migrationBuilder.DropIndex(
                name: "IX_ProcessingRecords_MessLabourWorkerId",
                table: "ProcessingRecords");

            migrationBuilder.DropColumn(
                name: "MessLabourWorkerId",
                table: "ProcessingRecords");

            migrationBuilder.CreateTable(
                name: "ProcessingRecordWorkers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProcessingRecordId = table.Column<int>(type: "int", nullable: false),
                    MessLabourWorkerId = table.Column<int>(type: "int", nullable: false),
                    WorkerFee = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProcessingRecordWorkers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProcessingRecordWorkers_MessLabourWorkers_MessLabourWorkerId",
                        column: x => x.MessLabourWorkerId,
                        principalTable: "MessLabourWorkers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProcessingRecordWorkers_ProcessingRecords_ProcessingRecordId",
                        column: x => x.ProcessingRecordId,
                        principalTable: "ProcessingRecords",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProcessingRecordWorkers_MessLabourWorkerId",
                table: "ProcessingRecordWorkers",
                column: "MessLabourWorkerId");

            migrationBuilder.CreateIndex(
                name: "IX_ProcessingRecordWorkers_ProcessingRecordId",
                table: "ProcessingRecordWorkers",
                column: "ProcessingRecordId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProcessingRecordWorkers");

            migrationBuilder.AddColumn<int>(
                name: "MessLabourWorkerId",
                table: "ProcessingRecords",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProcessingRecords_MessLabourWorkerId",
                table: "ProcessingRecords",
                column: "MessLabourWorkerId");

            migrationBuilder.AddForeignKey(
                name: "FK_ProcessingRecords_MessLabourWorkers_MessLabourWorkerId",
                table: "ProcessingRecords",
                column: "MessLabourWorkerId",
                principalTable: "MessLabourWorkers",
                principalColumn: "Id");
        }
    }
}
