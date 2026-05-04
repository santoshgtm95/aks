using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AKZ.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddAuditAndSoftDeleteFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "Workers",
                newName: "UpdateDate");

            migrationBuilder.RenameColumn(
                name: "UpdatedAt",
                table: "Users",
                newName: "DeleteDate");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "Users",
                newName: "UpdateDate");

            migrationBuilder.RenameColumn(
                name: "UpdatedAt",
                table: "Sales",
                newName: "DeleteDate");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "Sales",
                newName: "UpdateDate");

            migrationBuilder.RenameColumn(
                name: "UpdatedAt",
                table: "Products",
                newName: "DeleteDate");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "Products",
                newName: "UpdateDate");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "ProcessingRecords",
                newName: "UpdateDate");

            migrationBuilder.AddColumn<string>(
                name: "CreateBy",
                table: "Workers",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreateDate",
                table: "Workers",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "DeleteBy",
                table: "Workers",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeleteDate",
                table: "Workers",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DeleteFlg",
                table: "Workers",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "UpdateBy",
                table: "Workers",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CreateBy",
                table: "Users",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreateDate",
                table: "Users",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "DeleteBy",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DeleteFlg",
                table: "Users",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "UpdateBy",
                table: "Users",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CreateBy",
                table: "Sales",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreateDate",
                table: "Sales",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "DeleteBy",
                table: "Sales",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DeleteFlg",
                table: "Sales",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "UpdateBy",
                table: "Sales",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CreateBy",
                table: "Roles",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreateDate",
                table: "Roles",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "DeleteBy",
                table: "Roles",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeleteDate",
                table: "Roles",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DeleteFlg",
                table: "Roles",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "UpdateBy",
                table: "Roles",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdateDate",
                table: "Roles",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "CreateBy",
                table: "RolePermissions",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreateDate",
                table: "RolePermissions",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "DeleteBy",
                table: "RolePermissions",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeleteDate",
                table: "RolePermissions",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DeleteFlg",
                table: "RolePermissions",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "UpdateBy",
                table: "RolePermissions",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdateDate",
                table: "RolePermissions",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "CreateBy",
                table: "Products",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreateDate",
                table: "Products",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "DeleteBy",
                table: "Products",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DeleteFlg",
                table: "Products",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "UpdateBy",
                table: "Products",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CreateBy",
                table: "ProcessingRecords",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreateDate",
                table: "ProcessingRecords",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "DeleteBy",
                table: "ProcessingRecords",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeleteDate",
                table: "ProcessingRecords",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DeleteFlg",
                table: "ProcessingRecords",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "UpdateBy",
                table: "ProcessingRecords",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CreateBy",
                table: "Permissions",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreateDate",
                table: "Permissions",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "DeleteBy",
                table: "Permissions",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeleteDate",
                table: "Permissions",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DeleteFlg",
                table: "Permissions",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "UpdateBy",
                table: "Permissions",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdateDate",
                table: "Permissions",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CreateBy",
                table: "Workers");

            migrationBuilder.DropColumn(
                name: "CreateDate",
                table: "Workers");

            migrationBuilder.DropColumn(
                name: "DeleteBy",
                table: "Workers");

            migrationBuilder.DropColumn(
                name: "DeleteDate",
                table: "Workers");

            migrationBuilder.DropColumn(
                name: "DeleteFlg",
                table: "Workers");

            migrationBuilder.DropColumn(
                name: "UpdateBy",
                table: "Workers");

            migrationBuilder.DropColumn(
                name: "CreateBy",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "CreateDate",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "DeleteBy",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "DeleteFlg",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "UpdateBy",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "CreateBy",
                table: "Sales");

            migrationBuilder.DropColumn(
                name: "CreateDate",
                table: "Sales");

            migrationBuilder.DropColumn(
                name: "DeleteBy",
                table: "Sales");

            migrationBuilder.DropColumn(
                name: "DeleteFlg",
                table: "Sales");

            migrationBuilder.DropColumn(
                name: "UpdateBy",
                table: "Sales");

            migrationBuilder.DropColumn(
                name: "CreateBy",
                table: "Roles");

            migrationBuilder.DropColumn(
                name: "CreateDate",
                table: "Roles");

            migrationBuilder.DropColumn(
                name: "DeleteBy",
                table: "Roles");

            migrationBuilder.DropColumn(
                name: "DeleteDate",
                table: "Roles");

            migrationBuilder.DropColumn(
                name: "DeleteFlg",
                table: "Roles");

            migrationBuilder.DropColumn(
                name: "UpdateBy",
                table: "Roles");

            migrationBuilder.DropColumn(
                name: "UpdateDate",
                table: "Roles");

            migrationBuilder.DropColumn(
                name: "CreateBy",
                table: "RolePermissions");

            migrationBuilder.DropColumn(
                name: "CreateDate",
                table: "RolePermissions");

            migrationBuilder.DropColumn(
                name: "DeleteBy",
                table: "RolePermissions");

            migrationBuilder.DropColumn(
                name: "DeleteDate",
                table: "RolePermissions");

            migrationBuilder.DropColumn(
                name: "DeleteFlg",
                table: "RolePermissions");

            migrationBuilder.DropColumn(
                name: "UpdateBy",
                table: "RolePermissions");

            migrationBuilder.DropColumn(
                name: "UpdateDate",
                table: "RolePermissions");

            migrationBuilder.DropColumn(
                name: "CreateBy",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "CreateDate",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "DeleteBy",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "DeleteFlg",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "UpdateBy",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "CreateBy",
                table: "ProcessingRecords");

            migrationBuilder.DropColumn(
                name: "CreateDate",
                table: "ProcessingRecords");

            migrationBuilder.DropColumn(
                name: "DeleteBy",
                table: "ProcessingRecords");

            migrationBuilder.DropColumn(
                name: "DeleteDate",
                table: "ProcessingRecords");

            migrationBuilder.DropColumn(
                name: "DeleteFlg",
                table: "ProcessingRecords");

            migrationBuilder.DropColumn(
                name: "UpdateBy",
                table: "ProcessingRecords");

            migrationBuilder.DropColumn(
                name: "CreateBy",
                table: "Permissions");

            migrationBuilder.DropColumn(
                name: "CreateDate",
                table: "Permissions");

            migrationBuilder.DropColumn(
                name: "DeleteBy",
                table: "Permissions");

            migrationBuilder.DropColumn(
                name: "DeleteDate",
                table: "Permissions");

            migrationBuilder.DropColumn(
                name: "DeleteFlg",
                table: "Permissions");

            migrationBuilder.DropColumn(
                name: "UpdateBy",
                table: "Permissions");

            migrationBuilder.DropColumn(
                name: "UpdateDate",
                table: "Permissions");

            migrationBuilder.RenameColumn(
                name: "UpdateDate",
                table: "Workers",
                newName: "CreatedAt");

            migrationBuilder.RenameColumn(
                name: "UpdateDate",
                table: "Users",
                newName: "CreatedAt");

            migrationBuilder.RenameColumn(
                name: "DeleteDate",
                table: "Users",
                newName: "UpdatedAt");

            migrationBuilder.RenameColumn(
                name: "UpdateDate",
                table: "Sales",
                newName: "CreatedAt");

            migrationBuilder.RenameColumn(
                name: "DeleteDate",
                table: "Sales",
                newName: "UpdatedAt");

            migrationBuilder.RenameColumn(
                name: "UpdateDate",
                table: "Products",
                newName: "CreatedAt");

            migrationBuilder.RenameColumn(
                name: "DeleteDate",
                table: "Products",
                newName: "UpdatedAt");

            migrationBuilder.RenameColumn(
                name: "UpdateDate",
                table: "ProcessingRecords",
                newName: "CreatedAt");
        }
    }
}
