using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AKZ.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class UpdateColorCategories : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "SpecialWeight",
                table: "ProcessingRecords",
                newName: "WhiteExtraWeight");

            migrationBuilder.RenameColumn(
                name: "SpecialCount",
                table: "ProcessingRecords",
                newName: "WhiteExtraCount");

            migrationBuilder.RenameColumn(
                name: "ShortWeight",
                table: "ProcessingRecords",
                newName: "RemWhiteExtraWeight");

            migrationBuilder.RenameColumn(
                name: "ShortCutWeight",
                table: "ProcessingRecords",
                newName: "RemRegularWeight");

            migrationBuilder.RenameColumn(
                name: "ShortCutCount",
                table: "ProcessingRecords",
                newName: "RemWhiteExtraCount");

            migrationBuilder.RenameColumn(
                name: "ShortCount",
                table: "ProcessingRecords",
                newName: "RemRegularExtraCount");

            migrationBuilder.RenameColumn(
                name: "RemSpecialWeight",
                table: "ProcessingRecords",
                newName: "RemRegularExtraWeight");

            migrationBuilder.RenameColumn(
                name: "RemSpecialCount",
                table: "ProcessingRecords",
                newName: "RemRegularCount");

            migrationBuilder.RenameColumn(
                name: "RemShortWeight",
                table: "ProcessingRecords",
                newName: "RemReclaimedWeight");

            migrationBuilder.RenameColumn(
                name: "RemShortCutWeight",
                table: "ProcessingRecords",
                newName: "RemOffCutsWeight");

            migrationBuilder.RenameColumn(
                name: "RemShortCutCount",
                table: "ProcessingRecords",
                newName: "RemReclaimedCount");

            migrationBuilder.RenameColumn(
                name: "RemShortCount",
                table: "ProcessingRecords",
                newName: "RemOffCutsCount");

            migrationBuilder.RenameColumn(
                name: "RemNaturalRedWeight",
                table: "ProcessingRecords",
                newName: "RemNaturalWhiteExtraWeight");

            migrationBuilder.RenameColumn(
                name: "RemNaturalRedCount",
                table: "ProcessingRecords",
                newName: "RemNaturalWhiteExtraCount");

            migrationBuilder.RenameColumn(
                name: "NaturalRedWeight",
                table: "ProcessingRecords",
                newName: "RemFluffWeight");

            migrationBuilder.RenameColumn(
                name: "NaturalRedCount",
                table: "ProcessingRecords",
                newName: "RemFluffCount");

            migrationBuilder.AddColumn<double>(
                name: "BlackCount",
                table: "ProcessingRecords",
                type: "float",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<double>(
                name: "BlackExtraCount",
                table: "ProcessingRecords",
                type: "float",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<decimal>(
                name: "BlackExtraWeight",
                table: "ProcessingRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "BlackWeight",
                table: "ProcessingRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<double>(
                name: "FluffCount",
                table: "ProcessingRecords",
                type: "float",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<decimal>(
                name: "FluffWeight",
                table: "ProcessingRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<double>(
                name: "NaturalWhiteExtraCount",
                table: "ProcessingRecords",
                type: "float",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<decimal>(
                name: "NaturalWhiteExtraWeight",
                table: "ProcessingRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<double>(
                name: "OffCutsCount",
                table: "ProcessingRecords",
                type: "float",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<decimal>(
                name: "OffCutsWeight",
                table: "ProcessingRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<double>(
                name: "ReclaimedCount",
                table: "ProcessingRecords",
                type: "float",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<decimal>(
                name: "ReclaimedWeight",
                table: "ProcessingRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<double>(
                name: "RegularCount",
                table: "ProcessingRecords",
                type: "float",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<double>(
                name: "RegularExtraCount",
                table: "ProcessingRecords",
                type: "float",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<decimal>(
                name: "RegularExtraWeight",
                table: "ProcessingRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "RegularWeight",
                table: "ProcessingRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<double>(
                name: "RemBlackCount",
                table: "ProcessingRecords",
                type: "float",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<double>(
                name: "RemBlackExtraCount",
                table: "ProcessingRecords",
                type: "float",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<decimal>(
                name: "RemBlackExtraWeight",
                table: "ProcessingRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "RemBlackWeight",
                table: "ProcessingRecords",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BlackCount",
                table: "ProcessingRecords");

            migrationBuilder.DropColumn(
                name: "BlackExtraCount",
                table: "ProcessingRecords");

            migrationBuilder.DropColumn(
                name: "BlackExtraWeight",
                table: "ProcessingRecords");

            migrationBuilder.DropColumn(
                name: "BlackWeight",
                table: "ProcessingRecords");

            migrationBuilder.DropColumn(
                name: "FluffCount",
                table: "ProcessingRecords");

            migrationBuilder.DropColumn(
                name: "FluffWeight",
                table: "ProcessingRecords");

            migrationBuilder.DropColumn(
                name: "NaturalWhiteExtraCount",
                table: "ProcessingRecords");

            migrationBuilder.DropColumn(
                name: "NaturalWhiteExtraWeight",
                table: "ProcessingRecords");

            migrationBuilder.DropColumn(
                name: "OffCutsCount",
                table: "ProcessingRecords");

            migrationBuilder.DropColumn(
                name: "OffCutsWeight",
                table: "ProcessingRecords");

            migrationBuilder.DropColumn(
                name: "ReclaimedCount",
                table: "ProcessingRecords");

            migrationBuilder.DropColumn(
                name: "ReclaimedWeight",
                table: "ProcessingRecords");

            migrationBuilder.DropColumn(
                name: "RegularCount",
                table: "ProcessingRecords");

            migrationBuilder.DropColumn(
                name: "RegularExtraCount",
                table: "ProcessingRecords");

            migrationBuilder.DropColumn(
                name: "RegularExtraWeight",
                table: "ProcessingRecords");

            migrationBuilder.DropColumn(
                name: "RegularWeight",
                table: "ProcessingRecords");

            migrationBuilder.DropColumn(
                name: "RemBlackCount",
                table: "ProcessingRecords");

            migrationBuilder.DropColumn(
                name: "RemBlackExtraCount",
                table: "ProcessingRecords");

            migrationBuilder.DropColumn(
                name: "RemBlackExtraWeight",
                table: "ProcessingRecords");

            migrationBuilder.DropColumn(
                name: "RemBlackWeight",
                table: "ProcessingRecords");

            migrationBuilder.RenameColumn(
                name: "WhiteExtraWeight",
                table: "ProcessingRecords",
                newName: "SpecialWeight");

            migrationBuilder.RenameColumn(
                name: "WhiteExtraCount",
                table: "ProcessingRecords",
                newName: "SpecialCount");

            migrationBuilder.RenameColumn(
                name: "RemWhiteExtraWeight",
                table: "ProcessingRecords",
                newName: "ShortWeight");

            migrationBuilder.RenameColumn(
                name: "RemWhiteExtraCount",
                table: "ProcessingRecords",
                newName: "ShortCutCount");

            migrationBuilder.RenameColumn(
                name: "RemRegularWeight",
                table: "ProcessingRecords",
                newName: "ShortCutWeight");

            migrationBuilder.RenameColumn(
                name: "RemRegularExtraWeight",
                table: "ProcessingRecords",
                newName: "RemSpecialWeight");

            migrationBuilder.RenameColumn(
                name: "RemRegularExtraCount",
                table: "ProcessingRecords",
                newName: "ShortCount");

            migrationBuilder.RenameColumn(
                name: "RemRegularCount",
                table: "ProcessingRecords",
                newName: "RemSpecialCount");

            migrationBuilder.RenameColumn(
                name: "RemReclaimedWeight",
                table: "ProcessingRecords",
                newName: "RemShortWeight");

            migrationBuilder.RenameColumn(
                name: "RemReclaimedCount",
                table: "ProcessingRecords",
                newName: "RemShortCutCount");

            migrationBuilder.RenameColumn(
                name: "RemOffCutsWeight",
                table: "ProcessingRecords",
                newName: "RemShortCutWeight");

            migrationBuilder.RenameColumn(
                name: "RemOffCutsCount",
                table: "ProcessingRecords",
                newName: "RemShortCount");

            migrationBuilder.RenameColumn(
                name: "RemNaturalWhiteExtraWeight",
                table: "ProcessingRecords",
                newName: "RemNaturalRedWeight");

            migrationBuilder.RenameColumn(
                name: "RemNaturalWhiteExtraCount",
                table: "ProcessingRecords",
                newName: "RemNaturalRedCount");

            migrationBuilder.RenameColumn(
                name: "RemFluffWeight",
                table: "ProcessingRecords",
                newName: "NaturalRedWeight");

            migrationBuilder.RenameColumn(
                name: "RemFluffCount",
                table: "ProcessingRecords",
                newName: "NaturalRedCount");
        }
    }
}
