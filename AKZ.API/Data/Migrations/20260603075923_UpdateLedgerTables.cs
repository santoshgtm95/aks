using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AKZ.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class UpdateLedgerTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "LedgerName",
                table: "Ledgers",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "ProductId",
                table: "LedgerMarkers",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_LedgerMarkers_ProductId",
                table: "LedgerMarkers",
                column: "ProductId");

            migrationBuilder.AddForeignKey(
                name: "FK_LedgerMarkers_Products_ProductId",
                table: "LedgerMarkers",
                column: "ProductId",
                principalTable: "Products",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_LedgerMarkers_Products_ProductId",
                table: "LedgerMarkers");

            migrationBuilder.DropIndex(
                name: "IX_LedgerMarkers_ProductId",
                table: "LedgerMarkers");

            migrationBuilder.DropColumn(
                name: "LedgerName",
                table: "Ledgers");

            migrationBuilder.DropColumn(
                name: "ProductId",
                table: "LedgerMarkers");
        }
    }
}
