using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AKZ.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class ChangePurifierToPlaceInPurificationProcess : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PurificationProcesses_Purifiers_PurifierId",
                table: "PurificationProcesses");

            migrationBuilder.DropForeignKey(
                name: "FK_PurifiedRecords_Purifiers_PurifierId",
                table: "PurifiedRecords");

            migrationBuilder.RenameColumn(
                name: "PurifierId",
                table: "PurifiedRecords",
                newName: "PlaceId");

            migrationBuilder.RenameIndex(
                name: "IX_PurifiedRecords_PurifierId",
                table: "PurifiedRecords",
                newName: "IX_PurifiedRecords_PlaceId");

            migrationBuilder.RenameColumn(
                name: "PurifierId",
                table: "PurificationProcesses",
                newName: "PlaceId");

            migrationBuilder.RenameIndex(
                name: "IX_PurificationProcesses_PurifierId",
                table: "PurificationProcesses",
                newName: "IX_PurificationProcesses_PlaceId");

            migrationBuilder.AddForeignKey(
                name: "FK_PurificationProcesses_Places_PlaceId",
                table: "PurificationProcesses",
                column: "PlaceId",
                principalTable: "Places",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_PurifiedRecords_Places_PlaceId",
                table: "PurifiedRecords",
                column: "PlaceId",
                principalTable: "Places",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PurificationProcesses_Places_PlaceId",
                table: "PurificationProcesses");

            migrationBuilder.DropForeignKey(
                name: "FK_PurifiedRecords_Places_PlaceId",
                table: "PurifiedRecords");

            migrationBuilder.RenameColumn(
                name: "PlaceId",
                table: "PurifiedRecords",
                newName: "PurifierId");

            migrationBuilder.RenameIndex(
                name: "IX_PurifiedRecords_PlaceId",
                table: "PurifiedRecords",
                newName: "IX_PurifiedRecords_PurifierId");

            migrationBuilder.RenameColumn(
                name: "PlaceId",
                table: "PurificationProcesses",
                newName: "PurifierId");

            migrationBuilder.RenameIndex(
                name: "IX_PurificationProcesses_PlaceId",
                table: "PurificationProcesses",
                newName: "IX_PurificationProcesses_PurifierId");

            migrationBuilder.AddForeignKey(
                name: "FK_PurificationProcesses_Purifiers_PurifierId",
                table: "PurificationProcesses",
                column: "PurifierId",
                principalTable: "Purifiers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_PurifiedRecords_Purifiers_PurifierId",
                table: "PurifiedRecords",
                column: "PurifierId",
                principalTable: "Purifiers",
                principalColumn: "Id");
        }
    }
}
