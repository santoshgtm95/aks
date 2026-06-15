using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AKZ.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCustomerFieldsToSale : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CustomerContact",
                table: "Sales",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CustomerName",
                table: "Sales",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Remark",
                table: "Sales",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CustomerContact",
                table: "Sales");

            migrationBuilder.DropColumn(
                name: "CustomerName",
                table: "Sales");

            migrationBuilder.DropColumn(
                name: "Remark",
                table: "Sales");
        }
    }
}
