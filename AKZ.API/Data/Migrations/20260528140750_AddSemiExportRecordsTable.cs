using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AKZ.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddSemiExportRecordsTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SemiExportRecords",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    SingleDoubleDrawnRecordId = table.Column<int>(type: "int", nullable: false),
                    PriceB = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Price28 = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Price26 = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Price24 = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Price22 = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Price20 = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Price18 = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Price16 = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Price14 = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Price12 = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Price10 = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Price8 = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    PriceLeftover = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    PriceSpoil = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Remark = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
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
                    table.PrimaryKey("PK_SemiExportRecords", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SemiExportRecords_SingleDoubleDrawnRecords_SingleDoubleDrawnRecordId",
                        column: x => x.SingleDoubleDrawnRecordId,
                        principalTable: "SingleDoubleDrawnRecords",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SemiExportRecords_SingleDoubleDrawnRecordId",
                table: "SemiExportRecords",
                column: "SingleDoubleDrawnRecordId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SemiExportRecords");
        }
    }
}
