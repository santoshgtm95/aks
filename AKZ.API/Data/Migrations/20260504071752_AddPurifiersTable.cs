using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AKZ.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPurifiersTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "PurifierId",
                table: "PurificationProcesses",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Purifiers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    WarehouseId = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    DeleteFlg = table.Column<int>(type: "int", nullable: false),
                    CreateDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreateBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UpdateDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdateBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DeleteDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DeleteBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Purifiers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Purifiers_Warehouses_WarehouseId",
                        column: x => x.WarehouseId,
                        principalTable: "Warehouses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PurificationProcesses_PurifierId",
                table: "PurificationProcesses",
                column: "PurifierId");

            migrationBuilder.CreateIndex(
                name: "IX_Purifiers_WarehouseId",
                table: "Purifiers",
                column: "WarehouseId");

            migrationBuilder.AddForeignKey(
                name: "FK_PurificationProcesses_Purifiers_PurifierId",
                table: "PurificationProcesses",
                column: "PurifierId",
                principalTable: "Purifiers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PurificationProcesses_Purifiers_PurifierId",
                table: "PurificationProcesses");

            migrationBuilder.DropTable(
                name: "Purifiers");

            migrationBuilder.DropIndex(
                name: "IX_PurificationProcesses_PurifierId",
                table: "PurificationProcesses");

            migrationBuilder.DropColumn(
                name: "PurifierId",
                table: "PurificationProcesses");
        }
    }
}
