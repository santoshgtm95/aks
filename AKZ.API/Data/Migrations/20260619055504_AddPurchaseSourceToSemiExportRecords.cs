using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AKZ.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPurchaseSourceToSemiExportRecords : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Remark",
                table: "SemiExportPurchaseRecords");

            migrationBuilder.AlterColumn<int>(
                name: "SingleDoubleDrawnRecordId",
                table: "SemiExportRecords",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddColumn<int>(
                name: "SemiExportPurchaseRecordId",
                table: "SemiExportRecords",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_SemiExportRecords_SemiExportPurchaseRecordId",
                table: "SemiExportRecords",
                column: "SemiExportPurchaseRecordId");

            migrationBuilder.AddForeignKey(
                name: "FK_SemiExportRecords_SemiExportPurchaseRecords_SemiExportPurchaseRecordId",
                table: "SemiExportRecords",
                column: "SemiExportPurchaseRecordId",
                principalTable: "SemiExportPurchaseRecords",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SemiExportRecords_SemiExportPurchaseRecords_SemiExportPurchaseRecordId",
                table: "SemiExportRecords");

            migrationBuilder.DropIndex(
                name: "IX_SemiExportRecords_SemiExportPurchaseRecordId",
                table: "SemiExportRecords");

            migrationBuilder.DropColumn(
                name: "SemiExportPurchaseRecordId",
                table: "SemiExportRecords");

            migrationBuilder.AlterColumn<int>(
                name: "SingleDoubleDrawnRecordId",
                table: "SemiExportRecords",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Remark",
                table: "SemiExportPurchaseRecords",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");
        }
    }
}
