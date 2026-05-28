using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AKZ.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddSingleDoubleDrawnRecords : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SingleDoubleDrawnRecords",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    RefinementRecordId = table.Column<int>(type: "int", nullable: false),
                    Size6 = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Size7 = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Size8 = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Size9 = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Size10 = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Size10B = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Size12 = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Size14 = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Size16 = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Size18 = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Size20 = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Size22 = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Size24 = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Size26 = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Size28 = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    SizeBar = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
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
                    table.PrimaryKey("PK_SingleDoubleDrawnRecords", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SingleDoubleDrawnRecords_RefinementRecords_RefinementRecordId",
                        column: x => x.RefinementRecordId,
                        principalTable: "RefinementRecords",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SingleDoubleDrawnRecords_RefinementRecordId",
                table: "SingleDoubleDrawnRecords",
                column: "RefinementRecordId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SingleDoubleDrawnRecords");
        }
    }
}
