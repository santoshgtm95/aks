using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AKZ.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class RefactorPurifierToRefinementWorkerV3 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RefinementProcesses_Purifiers_PurifierId",
                table: "RefinementProcesses");

            migrationBuilder.DropForeignKey(
                name: "FK_RefinementRecords_Purifiers_PurifierId",
                table: "RefinementRecords");

            migrationBuilder.RenameColumn(
                name: "PurifierId",
                table: "RefinementRecords",
                newName: "RefinementWorkerId");

            migrationBuilder.RenameIndex(
                name: "IX_RefinementRecords_PurifierId",
                table: "RefinementRecords",
                newName: "IX_RefinementRecords_RefinementWorkerId");

            migrationBuilder.RenameColumn(
                name: "PurifierId",
                table: "RefinementProcesses",
                newName: "RefinementWorkerId");

            migrationBuilder.RenameIndex(
                name: "IX_RefinementProcesses_PurifierId",
                table: "RefinementProcesses",
                newName: "IX_RefinementProcesses_RefinementWorkerId");

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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RefinementProcesses_RefinementWorkers_RefinementWorkerId",
                table: "RefinementProcesses");

            migrationBuilder.DropForeignKey(
                name: "FK_RefinementRecords_RefinementWorkers_RefinementWorkerId",
                table: "RefinementRecords");

            migrationBuilder.RenameColumn(
                name: "RefinementWorkerId",
                table: "RefinementRecords",
                newName: "PurifierId");

            migrationBuilder.RenameIndex(
                name: "IX_RefinementRecords_RefinementWorkerId",
                table: "RefinementRecords",
                newName: "IX_RefinementRecords_PurifierId");

            migrationBuilder.RenameColumn(
                name: "RefinementWorkerId",
                table: "RefinementProcesses",
                newName: "PurifierId");

            migrationBuilder.RenameIndex(
                name: "IX_RefinementProcesses_RefinementWorkerId",
                table: "RefinementProcesses",
                newName: "IX_RefinementProcesses_PurifierId");

            migrationBuilder.AddForeignKey(
                name: "FK_RefinementProcesses_Purifiers_PurifierId",
                table: "RefinementProcesses",
                column: "PurifierId",
                principalTable: "Purifiers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_RefinementRecords_Purifiers_PurifierId",
                table: "RefinementRecords",
                column: "PurifierId",
                principalTable: "Purifiers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
