using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AKZ.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddExchangeRateIdToSemiExportRecord : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ExchangeRateId",
                table: "SemiExportRecords",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_SemiExportRecords_ExchangeRateId",
                table: "SemiExportRecords",
                column: "ExchangeRateId");

            migrationBuilder.AddForeignKey(
                name: "FK_SemiExportRecords_ExchangeRates_ExchangeRateId",
                table: "SemiExportRecords",
                column: "ExchangeRateId",
                principalTable: "ExchangeRates",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SemiExportRecords_ExchangeRates_ExchangeRateId",
                table: "SemiExportRecords");

            migrationBuilder.DropIndex(
                name: "IX_SemiExportRecords_ExchangeRateId",
                table: "SemiExportRecords");

            migrationBuilder.DropColumn(
                name: "ExchangeRateId",
                table: "SemiExportRecords");
        }
    }
}
