using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AKZ.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class ChangeProcessingRecordWorkerToWorker : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProcessingRecordWorkers_MessLabourWorkers_MessLabourWorkerId",
                table: "ProcessingRecordWorkers");

            // Remove orphaned rows whose MessLabourWorkerId does not exist in Workers
            // (they previously referenced MessLabourWorkers which is being deprecated)
            migrationBuilder.Sql(
                "DELETE FROM ProcessingRecordWorkers " +
                "WHERE MessLabourWorkerId NOT IN (SELECT Id FROM Workers);");

            migrationBuilder.AddForeignKey(
                name: "FK_ProcessingRecordWorkers_Workers_MessLabourWorkerId",
                table: "ProcessingRecordWorkers",
                column: "MessLabourWorkerId",
                principalTable: "Workers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProcessingRecordWorkers_Workers_MessLabourWorkerId",
                table: "ProcessingRecordWorkers");

            migrationBuilder.AddForeignKey(
                name: "FK_ProcessingRecordWorkers_MessLabourWorkers_MessLabourWorkerId",
                table: "ProcessingRecordWorkers",
                column: "MessLabourWorkerId",
                principalTable: "MessLabourWorkers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
