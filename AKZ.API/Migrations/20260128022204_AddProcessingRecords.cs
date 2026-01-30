using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AKZ.API.Migrations
{
    /// <inheritdoc />
    public partial class AddProcessingRecords : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ProcessingRecords",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ProductId = table.Column<int>(type: "int", nullable: false),
                    WorkerNames = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Count = table.Column<int>(type: "int", nullable: false),
                    UnitWeight = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    RedWeight = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    WhiteWeight = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    SpecialWeight = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    NaturalWeight = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    ShortWeight = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    LossWeight = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    TotalWeight = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Difference = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProcessingRecords", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProcessingRecords_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProcessingRecords_ProductId",
                table: "ProcessingRecords",
                column: "ProductId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProcessingRecords");
        }
    }
}
