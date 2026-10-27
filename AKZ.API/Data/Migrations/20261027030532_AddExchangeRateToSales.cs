using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AKZ.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddExchangeRateToSales : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Currency",
                table: "Sales",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(3)",
                oldMaxLength: 3);

            migrationBuilder.AddColumn<int>(
                name: "ExchangeRateId",
                table: "Sales",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ExchangeRateRate",
                table: "Sales",
                type: "decimal(18,4)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Sales_ExchangeRateId",
                table: "Sales",
                column: "ExchangeRateId");

            migrationBuilder.AddForeignKey(
                name: "FK_Sales_ExchangeRates_ExchangeRateId",
                table: "Sales",
                column: "ExchangeRateId",
                principalTable: "ExchangeRates",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Sales_ExchangeRates_ExchangeRateId",
                table: "Sales");

            migrationBuilder.DropIndex(
                name: "IX_Sales_ExchangeRateId",
                table: "Sales");

            migrationBuilder.DropColumn(
                name: "ExchangeRateId",
                table: "Sales");

            migrationBuilder.DropColumn(
                name: "ExchangeRateRate",
                table: "Sales");

            migrationBuilder.AlterColumn<string>(
                name: "Currency",
                table: "Sales",
                type: "nvarchar(3)",
                maxLength: 3,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(10)",
                oldMaxLength: 10);
        }
    }
}
