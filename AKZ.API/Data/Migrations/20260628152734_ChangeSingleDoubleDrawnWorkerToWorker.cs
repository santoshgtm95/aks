using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AKZ.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class ChangeSingleDoubleDrawnWorkerToWorker : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SemiExportPurchaseProcessings_SingleDoubleDrawnWorkers_WorkerId",
                table: "SemiExportPurchaseProcessings");

            migrationBuilder.DropForeignKey(
                name: "FK_SingleDoubleDrawnRecords_SingleDoubleDrawnWorkers_WorkerId",
                table: "SingleDoubleDrawnRecords");

            // Remove orphaned rows whose WorkerId does not exist in Workers
            migrationBuilder.Sql(
                "DELETE FROM SemiExportPurchaseProcessings " +
                "WHERE WorkerId NOT IN (SELECT Id FROM Workers);");
            migrationBuilder.Sql(
                "DELETE FROM SingleDoubleDrawnRecords " +
                "WHERE WorkerId IS NOT NULL AND WorkerId NOT IN (SELECT Id FROM Workers);");

            migrationBuilder.AddForeignKey(
                name: "FK_SemiExportPurchaseProcessings_Workers_WorkerId",
                table: "SemiExportPurchaseProcessings",
                column: "WorkerId",
                principalTable: "Workers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SingleDoubleDrawnRecords_Workers_WorkerId",
                table: "SingleDoubleDrawnRecords",
                column: "WorkerId",
                principalTable: "Workers",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SemiExportPurchaseProcessings_Workers_WorkerId",
                table: "SemiExportPurchaseProcessings");

            migrationBuilder.DropForeignKey(
                name: "FK_SingleDoubleDrawnRecords_Workers_WorkerId",
                table: "SingleDoubleDrawnRecords");

            migrationBuilder.AddForeignKey(
                name: "FK_SemiExportPurchaseProcessings_SingleDoubleDrawnWorkers_WorkerId",
                table: "SemiExportPurchaseProcessings",
                column: "WorkerId",
                principalTable: "SingleDoubleDrawnWorkers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SingleDoubleDrawnRecords_SingleDoubleDrawnWorkers_WorkerId",
                table: "SingleDoubleDrawnRecords",
                column: "WorkerId",
                principalTable: "SingleDoubleDrawnWorkers",
                principalColumn: "Id");
        }
    }
}
