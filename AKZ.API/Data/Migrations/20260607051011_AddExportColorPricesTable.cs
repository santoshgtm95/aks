using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AKZ.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddExportColorPricesTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ExportColorPrices",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ExportId = table.Column<int>(type: "int", nullable: false),
                    ColorName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Price6 = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Price7 = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Price8 = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Price9 = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Price10 = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Price10B = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Price12 = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Price14 = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Price16 = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Price18 = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Price20 = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Price22 = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Price24 = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Price26 = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Price28 = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PriceBar = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExportColorPrices", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ExportColorPrices_Exports_ExportId",
                        column: x => x.ExportId,
                        principalTable: "Exports",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ExportColorPrices_ExportId",
                table: "ExportColorPrices",
                column: "ExportId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ExportColorPrices");
        }
    }
}
