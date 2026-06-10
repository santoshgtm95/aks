using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AKZ.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPlaceToPurifier : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "PlaceId",
                table: "Purifiers",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Purifiers_PlaceId",
                table: "Purifiers",
                column: "PlaceId");

            migrationBuilder.AddForeignKey(
                name: "FK_Purifiers_Places_PlaceId",
                table: "Purifiers",
                column: "PlaceId",
                principalTable: "Places",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Purifiers_Places_PlaceId",
                table: "Purifiers");

            migrationBuilder.DropIndex(
                name: "IX_Purifiers_PlaceId",
                table: "Purifiers");

            migrationBuilder.DropColumn(
                name: "PlaceId",
                table: "Purifiers");
        }
    }
}
