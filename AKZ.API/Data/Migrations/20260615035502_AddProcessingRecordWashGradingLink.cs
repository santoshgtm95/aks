using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AKZ.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddProcessingRecordWashGradingLink : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "WashGradingRecordId",
                table: "ProcessingRecords",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProcessingRecords_WashGradingRecordId",
                table: "ProcessingRecords",
                column: "WashGradingRecordId");

            migrationBuilder.AddForeignKey(
                name: "FK_ProcessingRecords_WashGradingRecords_WashGradingRecordId",
                table: "ProcessingRecords",
                column: "WashGradingRecordId",
                principalTable: "WashGradingRecords",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProcessingRecords_WashGradingRecords_WashGradingRecordId",
                table: "ProcessingRecords");

            migrationBuilder.DropIndex(
                name: "IX_ProcessingRecords_WashGradingRecordId",
                table: "ProcessingRecords");

            migrationBuilder.DropColumn(
                name: "WashGradingRecordId",
                table: "ProcessingRecords");
        }
    }
}
