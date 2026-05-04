using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AKZ.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPurificationProcessIdToPurifiedRecord : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "PurificationProcessId",
                table: "PurifiedRecords",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_PurifiedRecords_PurificationProcessId",
                table: "PurifiedRecords",
                column: "PurificationProcessId");

            migrationBuilder.AddForeignKey(
                name: "FK_PurifiedRecords_PurificationProcesses_PurificationProcessId",
                table: "PurifiedRecords",
                column: "PurificationProcessId",
                principalTable: "PurificationProcesses",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PurifiedRecords_PurificationProcesses_PurificationProcessId",
                table: "PurifiedRecords");

            migrationBuilder.DropIndex(
                name: "IX_PurifiedRecords_PurificationProcessId",
                table: "PurifiedRecords");

            migrationBuilder.DropColumn(
                name: "PurificationProcessId",
                table: "PurifiedRecords");
        }
    }
}
