using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AKZ.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class RemovePurifierFromProcess : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "PurifierId",
                table: "PurifiedRecords",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_PurifiedRecords_PurifierId",
                table: "PurifiedRecords",
                column: "PurifierId");

            migrationBuilder.AddForeignKey(
                name: "FK_PurifiedRecords_Purifiers_PurifierId",
                table: "PurifiedRecords",
                column: "PurifierId",
                principalTable: "Purifiers",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PurifiedRecords_Purifiers_PurifierId",
                table: "PurifiedRecords");

            migrationBuilder.DropIndex(
                name: "IX_PurifiedRecords_PurifierId",
                table: "PurifiedRecords");

            migrationBuilder.DropColumn(
                name: "PurifierId",
                table: "PurifiedRecords");
        }
    }
}
