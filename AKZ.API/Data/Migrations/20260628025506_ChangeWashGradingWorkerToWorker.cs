using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AKZ.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class ChangeWashGradingWorkerToWorker : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_WashGradingProcesses_WashGradingWorkers_WashGradingWorkerId",
                table: "WashGradingProcesses");

            migrationBuilder.DropForeignKey(
                name: "FK_WashGradingRecords_WashGradingWorkers_WashGradingWorkerId",
                table: "WashGradingRecords");

            migrationBuilder.AddForeignKey(
                name: "FK_WashGradingProcesses_Workers_WashGradingWorkerId",
                table: "WashGradingProcesses",
                column: "WashGradingWorkerId",
                principalTable: "Workers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_WashGradingRecords_Workers_WashGradingWorkerId",
                table: "WashGradingRecords",
                column: "WashGradingWorkerId",
                principalTable: "Workers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_WashGradingProcesses_Workers_WashGradingWorkerId",
                table: "WashGradingProcesses");

            migrationBuilder.DropForeignKey(
                name: "FK_WashGradingRecords_Workers_WashGradingWorkerId",
                table: "WashGradingRecords");

            migrationBuilder.AddForeignKey(
                name: "FK_WashGradingProcesses_WashGradingWorkers_WashGradingWorkerId",
                table: "WashGradingProcesses",
                column: "WashGradingWorkerId",
                principalTable: "WashGradingWorkers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_WashGradingRecords_WashGradingWorkers_WashGradingWorkerId",
                table: "WashGradingRecords",
                column: "WashGradingWorkerId",
                principalTable: "WashGradingWorkers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
