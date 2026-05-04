using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AKZ.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPurificationTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "RemArtificialCount",
                table: "ProcessingRecords",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "RemArtificialWeight",
                table: "ProcessingRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "RemNaturalCount",
                table: "ProcessingRecords",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "RemNaturalRedCount",
                table: "ProcessingRecords",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "RemNaturalRedWeight",
                table: "ProcessingRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "RemNaturalWeight",
                table: "ProcessingRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "RemNaturalWhiteCount",
                table: "ProcessingRecords",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "RemNaturalWhiteWeight",
                table: "ProcessingRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "RemRedCount",
                table: "ProcessingRecords",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "RemRedWeight",
                table: "ProcessingRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "RemShortCount",
                table: "ProcessingRecords",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "RemShortCutCount",
                table: "ProcessingRecords",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "RemShortCutWeight",
                table: "ProcessingRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "RemShortWeight",
                table: "ProcessingRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "RemSpecialCount",
                table: "ProcessingRecords",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "RemSpecialWeight",
                table: "ProcessingRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "RemWhiteCount",
                table: "ProcessingRecords",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "RemWhiteWeight",
                table: "ProcessingRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.CreateTable(
                name: "PurificationProcesses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ProcessingRecordId = table.Column<int>(type: "int", nullable: false),
                    Category = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PurifyCount = table.Column<int>(type: "int", nullable: false),
                    PurifyWeight = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    RemainingCountAfter = table.Column<int>(type: "int", nullable: false),
                    RemainingWeightAfter = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
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
                    table.PrimaryKey("PK_PurificationProcesses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PurificationProcesses_ProcessingRecords_ProcessingRecordId",
                        column: x => x.ProcessingRecordId,
                        principalTable: "ProcessingRecords",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PurificationProcesses_ProcessingRecordId",
                table: "PurificationProcesses",
                column: "ProcessingRecordId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PurificationProcesses");

            migrationBuilder.DropColumn(
                name: "RemArtificialCount",
                table: "ProcessingRecords");

            migrationBuilder.DropColumn(
                name: "RemArtificialWeight",
                table: "ProcessingRecords");

            migrationBuilder.DropColumn(
                name: "RemNaturalCount",
                table: "ProcessingRecords");

            migrationBuilder.DropColumn(
                name: "RemNaturalRedCount",
                table: "ProcessingRecords");

            migrationBuilder.DropColumn(
                name: "RemNaturalRedWeight",
                table: "ProcessingRecords");

            migrationBuilder.DropColumn(
                name: "RemNaturalWeight",
                table: "ProcessingRecords");

            migrationBuilder.DropColumn(
                name: "RemNaturalWhiteCount",
                table: "ProcessingRecords");

            migrationBuilder.DropColumn(
                name: "RemNaturalWhiteWeight",
                table: "ProcessingRecords");

            migrationBuilder.DropColumn(
                name: "RemRedCount",
                table: "ProcessingRecords");

            migrationBuilder.DropColumn(
                name: "RemRedWeight",
                table: "ProcessingRecords");

            migrationBuilder.DropColumn(
                name: "RemShortCount",
                table: "ProcessingRecords");

            migrationBuilder.DropColumn(
                name: "RemShortCutCount",
                table: "ProcessingRecords");

            migrationBuilder.DropColumn(
                name: "RemShortCutWeight",
                table: "ProcessingRecords");

            migrationBuilder.DropColumn(
                name: "RemShortWeight",
                table: "ProcessingRecords");

            migrationBuilder.DropColumn(
                name: "RemSpecialCount",
                table: "ProcessingRecords");

            migrationBuilder.DropColumn(
                name: "RemSpecialWeight",
                table: "ProcessingRecords");

            migrationBuilder.DropColumn(
                name: "RemWhiteCount",
                table: "ProcessingRecords");

            migrationBuilder.DropColumn(
                name: "RemWhiteWeight",
                table: "ProcessingRecords");
        }
    }
}
