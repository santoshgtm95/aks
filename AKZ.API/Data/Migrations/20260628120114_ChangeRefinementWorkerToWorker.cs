using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AKZ.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class ChangeRefinementWorkerToWorker : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RefinementProcesses_RefinementWorkers_RefinementWorkerId",
                table: "RefinementProcesses");

            migrationBuilder.DropForeignKey(
                name: "FK_RefinementRecords_RefinementWorkers_RefinementWorkerId",
                table: "RefinementRecords");

            // Remove orphaned rows whose RefinementWorkerId does not exist in Workers
            migrationBuilder.Sql(
                "DELETE FROM RefinementProcesses " +
                "WHERE RefinementWorkerId IS NOT NULL AND RefinementWorkerId NOT IN (SELECT Id FROM Workers);");
            migrationBuilder.Sql(
                "DELETE FROM RefinementRecords " +
                "WHERE RefinementWorkerId IS NOT NULL AND RefinementWorkerId NOT IN (SELECT Id FROM Workers);");

            migrationBuilder.AddForeignKey(
                name: "FK_RefinementProcesses_Workers_RefinementWorkerId",
                table: "RefinementProcesses",
                column: "RefinementWorkerId",
                principalTable: "Workers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_RefinementRecords_Workers_RefinementWorkerId",
                table: "RefinementRecords",
                column: "RefinementWorkerId",
                principalTable: "Workers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RefinementProcesses_Workers_RefinementWorkerId",
                table: "RefinementProcesses");

            migrationBuilder.DropForeignKey(
                name: "FK_RefinementRecords_Workers_RefinementWorkerId",
                table: "RefinementRecords");

            migrationBuilder.AddForeignKey(
                name: "FK_RefinementProcesses_RefinementWorkers_RefinementWorkerId",
                table: "RefinementProcesses",
                column: "RefinementWorkerId",
                principalTable: "RefinementWorkers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_RefinementRecords_RefinementWorkers_RefinementWorkerId",
                table: "RefinementRecords",
                column: "RefinementWorkerId",
                principalTable: "RefinementWorkers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
