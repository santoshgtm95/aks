IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
CREATE TABLE [Permissions] (
    [Id] int NOT NULL IDENTITY,
    [Name] nvarchar(100) NOT NULL,
    [Description] nvarchar(200) NULL,
    CONSTRAINT [PK_Permissions] PRIMARY KEY ([Id])
);

CREATE TABLE [Products] (
    [Id] int NOT NULL IDENTITY,
    [Date] datetime2 NOT NULL,
    [Packages] int NOT NULL,
    [Marker] nvarchar(100) NOT NULL,
    [Unit] nvarchar(10) NOT NULL,
    [Weight] decimal(18,2) NOT NULL,
    [Price] decimal(18,2) NOT NULL,
    [Currency] nvarchar(3) NOT NULL,
    [RemainingWeight] decimal(18,2) NOT NULL,
    [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    CONSTRAINT [PK_Products] PRIMARY KEY ([Id])
);

CREATE TABLE [Roles] (
    [Id] int NOT NULL IDENTITY,
    [Name] nvarchar(50) NOT NULL,
    [Description] nvarchar(200) NULL,
    CONSTRAINT [PK_Roles] PRIMARY KEY ([Id])
);

CREATE TABLE [RolePermissions] (
    [Id] int NOT NULL IDENTITY,
    [RoleId] int NOT NULL,
    [PermissionId] int NOT NULL,
    CONSTRAINT [PK_RolePermissions] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_RolePermissions_Permissions_PermissionId] FOREIGN KEY ([PermissionId]) REFERENCES [Permissions] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_RolePermissions_Roles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [Roles] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [Users] (
    [Id] int NOT NULL IDENTITY,
    [Username] nvarchar(100) NOT NULL,
    [PasswordHash] nvarchar(255) NOT NULL,
    [FullName] nvarchar(100) NOT NULL,
    [Email] nvarchar(100) NOT NULL,
    [PhoneNumber] nvarchar(20) NULL,
    [RoleId] int NOT NULL,
    [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    CONSTRAINT [PK_Users] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Users_Roles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [Roles] ([Id]) ON DELETE NO ACTION
);

CREATE TABLE [Sales] (
    [Id] int NOT NULL IDENTITY,
    [Date] datetime2 NOT NULL,
    [ProductId] int NOT NULL,
    [Marker] nvarchar(100) NOT NULL,
    [Unit] nvarchar(10) NOT NULL,
    [Weight] decimal(18,2) NOT NULL,
    [Price] decimal(18,2) NOT NULL,
    [Currency] nvarchar(3) NOT NULL,
    [SellerId] int NOT NULL,
    [TotalRemaining] decimal(18,2) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    CONSTRAINT [PK_Sales] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Sales_Products_ProductId] FOREIGN KEY ([ProductId]) REFERENCES [Products] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Sales_Users_SellerId] FOREIGN KEY ([SellerId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
);

CREATE UNIQUE INDEX [IX_Permissions_Name] ON [Permissions] ([Name]);

CREATE INDEX [IX_RolePermissions_PermissionId] ON [RolePermissions] ([PermissionId]);

CREATE INDEX [IX_RolePermissions_RoleId] ON [RolePermissions] ([RoleId]);

CREATE UNIQUE INDEX [IX_Roles_Name] ON [Roles] ([Name]);

CREATE INDEX [IX_Sales_ProductId] ON [Sales] ([ProductId]);

CREATE INDEX [IX_Sales_SellerId] ON [Sales] ([SellerId]);

CREATE UNIQUE INDEX [IX_Users_Email] ON [Users] ([Email]);

CREATE INDEX [IX_Users_RoleId] ON [Users] ([RoleId]);

CREATE UNIQUE INDEX [IX_Users_Username] ON [Users] ([Username]);

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260126053349_InitialCreate', N'9.0.0');

ALTER TABLE [Sales] ADD [Category] nvarchar(50) NOT NULL DEFAULT N'';

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260126100031_AddCategoryToSale', N'9.0.0');

CREATE TABLE [ProcessingRecords] (
    [Id] int NOT NULL IDENTITY,
    [Date] datetime2 NOT NULL,
    [ProductId] int NOT NULL,
    [WorkerNames] nvarchar(max) NOT NULL,
    [Count] int NOT NULL,
    [UnitWeight] decimal(18,4) NOT NULL,
    [RedWeight] decimal(18,4) NOT NULL,
    [WhiteWeight] decimal(18,4) NOT NULL,
    [SpecialWeight] decimal(18,4) NOT NULL,
    [NaturalWeight] decimal(18,4) NOT NULL,
    [ShortWeight] decimal(18,4) NOT NULL,
    [LossWeight] decimal(18,4) NOT NULL,
    [TotalWeight] decimal(18,4) NOT NULL,
    [Difference] decimal(18,4) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_ProcessingRecords] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_ProcessingRecords_Products_ProductId] FOREIGN KEY ([ProductId]) REFERENCES [Products] ([Id]) ON DELETE NO ACTION
);

CREATE INDEX [IX_ProcessingRecords_ProductId] ON [ProcessingRecords] ([ProductId]);

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260128022204_AddProcessingRecords', N'9.0.0');

CREATE TABLE [Workers] (
    [Id] int NOT NULL IDENTITY,
    [Name] nvarchar(100) NOT NULL,
    [PhoneNumber] nvarchar(20) NULL,
    [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_Workers] PRIMARY KEY ([Id])
);

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260128025045_AddWorkers', N'9.0.0');

ALTER TABLE [ProcessingRecords] ADD [ArtificialWeight] decimal(18,4) NOT NULL DEFAULT 0.0;

ALTER TABLE [ProcessingRecords] ADD [NaturalRedWeight] decimal(18,4) NOT NULL DEFAULT 0.0;

ALTER TABLE [ProcessingRecords] ADD [NaturalWhiteWeight] decimal(18,4) NOT NULL DEFAULT 0.0;

ALTER TABLE [ProcessingRecords] ADD [ShortCutWeight] decimal(18,4) NOT NULL DEFAULT 0.0;

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260425135351_AddNewProcessingCategoryFields', N'9.0.0');

ALTER TABLE [ProcessingRecords] ADD [ArtificialCount] int NOT NULL DEFAULT 0;

ALTER TABLE [ProcessingRecords] ADD [NaturalCount] int NOT NULL DEFAULT 0;

ALTER TABLE [ProcessingRecords] ADD [NaturalRedCount] int NOT NULL DEFAULT 0;

ALTER TABLE [ProcessingRecords] ADD [NaturalWhiteCount] int NOT NULL DEFAULT 0;

ALTER TABLE [ProcessingRecords] ADD [RedCount] int NOT NULL DEFAULT 0;

ALTER TABLE [ProcessingRecords] ADD [RemainingWeight] decimal(18,4) NOT NULL DEFAULT 0.0;

ALTER TABLE [ProcessingRecords] ADD [ShortCount] int NOT NULL DEFAULT 0;

ALTER TABLE [ProcessingRecords] ADD [ShortCutCount] int NOT NULL DEFAULT 0;

ALTER TABLE [ProcessingRecords] ADD [SpecialCount] int NOT NULL DEFAULT 0;

ALTER TABLE [ProcessingRecords] ADD [WhiteCount] int NOT NULL DEFAULT 0;

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260427080837_AddCategoryCountsAndRemainingWeight', N'9.0.0');

ALTER TABLE [ProcessingRecords] ADD [RemainingCount] int NOT NULL DEFAULT 0;

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260427081512_AddRemainingCountField', N'9.0.0');

ALTER TABLE [ProcessingRecords] ADD [RemainingWeightKg] decimal(18,4) NULL;

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260428014133_AddRemainingWeightKgToProcessingRecords', N'9.0.0');

EXEC sp_rename N'[Workers].[CreatedAt]', N'UpdateDate', 'COLUMN';

EXEC sp_rename N'[Users].[UpdatedAt]', N'DeleteDate', 'COLUMN';

EXEC sp_rename N'[Users].[CreatedAt]', N'UpdateDate', 'COLUMN';

EXEC sp_rename N'[Sales].[UpdatedAt]', N'DeleteDate', 'COLUMN';

EXEC sp_rename N'[Sales].[CreatedAt]', N'UpdateDate', 'COLUMN';

EXEC sp_rename N'[Products].[UpdatedAt]', N'DeleteDate', 'COLUMN';

EXEC sp_rename N'[Products].[CreatedAt]', N'UpdateDate', 'COLUMN';

EXEC sp_rename N'[ProcessingRecords].[CreatedAt]', N'UpdateDate', 'COLUMN';

ALTER TABLE [Workers] ADD [CreateBy] nvarchar(max) NOT NULL DEFAULT N'';

ALTER TABLE [Workers] ADD [CreateDate] datetime2 NOT NULL DEFAULT '0001-01-01T00:00:00.0000000';

ALTER TABLE [Workers] ADD [DeleteBy] nvarchar(max) NULL;

ALTER TABLE [Workers] ADD [DeleteDate] datetime2 NULL;

ALTER TABLE [Workers] ADD [DeleteFlg] int NOT NULL DEFAULT 0;

ALTER TABLE [Workers] ADD [UpdateBy] nvarchar(max) NOT NULL DEFAULT N'';

ALTER TABLE [Users] ADD [CreateBy] nvarchar(max) NOT NULL DEFAULT N'';

ALTER TABLE [Users] ADD [CreateDate] datetime2 NOT NULL DEFAULT '0001-01-01T00:00:00.0000000';

ALTER TABLE [Users] ADD [DeleteBy] nvarchar(max) NULL;

ALTER TABLE [Users] ADD [DeleteFlg] int NOT NULL DEFAULT 0;

ALTER TABLE [Users] ADD [UpdateBy] nvarchar(max) NOT NULL DEFAULT N'';

ALTER TABLE [Sales] ADD [CreateBy] nvarchar(max) NOT NULL DEFAULT N'';

ALTER TABLE [Sales] ADD [CreateDate] datetime2 NOT NULL DEFAULT '0001-01-01T00:00:00.0000000';

ALTER TABLE [Sales] ADD [DeleteBy] nvarchar(max) NULL;

ALTER TABLE [Sales] ADD [DeleteFlg] int NOT NULL DEFAULT 0;

ALTER TABLE [Sales] ADD [UpdateBy] nvarchar(max) NOT NULL DEFAULT N'';

ALTER TABLE [Roles] ADD [CreateBy] nvarchar(max) NOT NULL DEFAULT N'';

ALTER TABLE [Roles] ADD [CreateDate] datetime2 NOT NULL DEFAULT '0001-01-01T00:00:00.0000000';

ALTER TABLE [Roles] ADD [DeleteBy] nvarchar(max) NULL;

ALTER TABLE [Roles] ADD [DeleteDate] datetime2 NULL;

ALTER TABLE [Roles] ADD [DeleteFlg] int NOT NULL DEFAULT 0;

ALTER TABLE [Roles] ADD [UpdateBy] nvarchar(max) NOT NULL DEFAULT N'';

ALTER TABLE [Roles] ADD [UpdateDate] datetime2 NOT NULL DEFAULT '0001-01-01T00:00:00.0000000';

ALTER TABLE [RolePermissions] ADD [CreateBy] nvarchar(max) NOT NULL DEFAULT N'';

ALTER TABLE [RolePermissions] ADD [CreateDate] datetime2 NOT NULL DEFAULT '0001-01-01T00:00:00.0000000';

ALTER TABLE [RolePermissions] ADD [DeleteBy] nvarchar(max) NULL;

ALTER TABLE [RolePermissions] ADD [DeleteDate] datetime2 NULL;

ALTER TABLE [RolePermissions] ADD [DeleteFlg] int NOT NULL DEFAULT 0;

ALTER TABLE [RolePermissions] ADD [UpdateBy] nvarchar(max) NOT NULL DEFAULT N'';

ALTER TABLE [RolePermissions] ADD [UpdateDate] datetime2 NOT NULL DEFAULT '0001-01-01T00:00:00.0000000';

ALTER TABLE [Products] ADD [CreateBy] nvarchar(max) NOT NULL DEFAULT N'';

ALTER TABLE [Products] ADD [CreateDate] datetime2 NOT NULL DEFAULT '0001-01-01T00:00:00.0000000';

ALTER TABLE [Products] ADD [DeleteBy] nvarchar(max) NULL;

ALTER TABLE [Products] ADD [DeleteFlg] int NOT NULL DEFAULT 0;

ALTER TABLE [Products] ADD [UpdateBy] nvarchar(max) NOT NULL DEFAULT N'';

ALTER TABLE [ProcessingRecords] ADD [CreateBy] nvarchar(max) NOT NULL DEFAULT N'';

ALTER TABLE [ProcessingRecords] ADD [CreateDate] datetime2 NOT NULL DEFAULT '0001-01-01T00:00:00.0000000';

ALTER TABLE [ProcessingRecords] ADD [DeleteBy] nvarchar(max) NULL;

ALTER TABLE [ProcessingRecords] ADD [DeleteDate] datetime2 NULL;

ALTER TABLE [ProcessingRecords] ADD [DeleteFlg] int NOT NULL DEFAULT 0;

ALTER TABLE [ProcessingRecords] ADD [UpdateBy] nvarchar(max) NOT NULL DEFAULT N'';

ALTER TABLE [Permissions] ADD [CreateBy] nvarchar(max) NOT NULL DEFAULT N'';

ALTER TABLE [Permissions] ADD [CreateDate] datetime2 NOT NULL DEFAULT '0001-01-01T00:00:00.0000000';

ALTER TABLE [Permissions] ADD [DeleteBy] nvarchar(max) NULL;

ALTER TABLE [Permissions] ADD [DeleteDate] datetime2 NULL;

ALTER TABLE [Permissions] ADD [DeleteFlg] int NOT NULL DEFAULT 0;

ALTER TABLE [Permissions] ADD [UpdateBy] nvarchar(max) NOT NULL DEFAULT N'';

ALTER TABLE [Permissions] ADD [UpdateDate] datetime2 NOT NULL DEFAULT '0001-01-01T00:00:00.0000000';

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260428130948_AddAuditAndSoftDeleteFields', N'9.0.0');

ALTER TABLE [Products] ADD [WarehouseId] int NULL;

CREATE TABLE [Warehouses] (
    [Id] int NOT NULL IDENTITY,
    [Name] nvarchar(100) NOT NULL,
    [Location] nvarchar(250) NULL,
    [IsActive] bit NOT NULL,
    [DeleteFlg] int NOT NULL,
    [CreateDate] datetime2 NOT NULL,
    [CreateBy] nvarchar(max) NOT NULL,
    [UpdateDate] datetime2 NOT NULL,
    [UpdateBy] nvarchar(max) NOT NULL,
    [DeleteDate] datetime2 NULL,
    [DeleteBy] nvarchar(max) NULL,
    CONSTRAINT [PK_Warehouses] PRIMARY KEY ([Id])
);

CREATE INDEX [IX_Products_WarehouseId] ON [Products] ([WarehouseId]);

ALTER TABLE [Products] ADD CONSTRAINT [FK_Products_Warehouses_WarehouseId] FOREIGN KEY ([WarehouseId]) REFERENCES [Warehouses] ([Id]) ON DELETE SET NULL;

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260429063101_AddWarehouses', N'9.0.0');

DECLARE @var0 sysname;
SELECT @var0 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Products]') AND [c].[name] = N'Packages');
IF @var0 IS NOT NULL EXEC(N'ALTER TABLE [Products] DROP CONSTRAINT [' + @var0 + '];');
ALTER TABLE [Products] ALTER COLUMN [Packages] nvarchar(100) NOT NULL;

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260429063928_ChangePackagesToString', N'9.0.0');

CREATE TABLE [UserPermissions] (
    [Id] int NOT NULL IDENTITY,
    [UserId] int NOT NULL,
    [PermissionId] int NOT NULL,
    [IsGranted] bit NOT NULL,
    [DeleteFlg] int NOT NULL,
    [CreateDate] datetime2 NOT NULL,
    [CreateBy] nvarchar(max) NOT NULL,
    [UpdateDate] datetime2 NOT NULL,
    [UpdateBy] nvarchar(max) NOT NULL,
    [DeleteDate] datetime2 NULL,
    [DeleteBy] nvarchar(max) NULL,
    CONSTRAINT [PK_UserPermissions] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_UserPermissions_Permissions_PermissionId] FOREIGN KEY ([PermissionId]) REFERENCES [Permissions] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_UserPermissions_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
);

CREATE INDEX [IX_UserPermissions_PermissionId] ON [UserPermissions] ([PermissionId]);

CREATE INDEX [IX_UserPermissions_UserId] ON [UserPermissions] ([UserId]);

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260429073244_AddUserPermissions', N'9.0.0');

DROP INDEX [IX_Users_Email] ON [Users];

DROP INDEX [IX_Users_Username] ON [Users];

CREATE UNIQUE INDEX [IX_Users_Email] ON [Users] ([Email]) WHERE [DeleteFlg] = 0;

CREATE UNIQUE INDEX [IX_Users_Username] ON [Users] ([Username]) WHERE [DeleteFlg] = 0;

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260429074659_UpdateUserUniqueIndexes', N'9.0.0');

ALTER TABLE [ProcessingRecords] ADD [RemArtificialCount] int NOT NULL DEFAULT 0;

ALTER TABLE [ProcessingRecords] ADD [RemArtificialWeight] decimal(18,4) NOT NULL DEFAULT 0.0;

ALTER TABLE [ProcessingRecords] ADD [RemNaturalCount] int NOT NULL DEFAULT 0;

ALTER TABLE [ProcessingRecords] ADD [RemNaturalRedCount] int NOT NULL DEFAULT 0;

ALTER TABLE [ProcessingRecords] ADD [RemNaturalRedWeight] decimal(18,4) NOT NULL DEFAULT 0.0;

ALTER TABLE [ProcessingRecords] ADD [RemNaturalWeight] decimal(18,4) NOT NULL DEFAULT 0.0;

ALTER TABLE [ProcessingRecords] ADD [RemNaturalWhiteCount] int NOT NULL DEFAULT 0;

ALTER TABLE [ProcessingRecords] ADD [RemNaturalWhiteWeight] decimal(18,4) NOT NULL DEFAULT 0.0;

ALTER TABLE [ProcessingRecords] ADD [RemRedCount] int NOT NULL DEFAULT 0;

ALTER TABLE [ProcessingRecords] ADD [RemRedWeight] decimal(18,4) NOT NULL DEFAULT 0.0;

ALTER TABLE [ProcessingRecords] ADD [RemShortCount] int NOT NULL DEFAULT 0;

ALTER TABLE [ProcessingRecords] ADD [RemShortCutCount] int NOT NULL DEFAULT 0;

ALTER TABLE [ProcessingRecords] ADD [RemShortCutWeight] decimal(18,4) NOT NULL DEFAULT 0.0;

ALTER TABLE [ProcessingRecords] ADD [RemShortWeight] decimal(18,4) NOT NULL DEFAULT 0.0;

ALTER TABLE [ProcessingRecords] ADD [RemSpecialCount] int NOT NULL DEFAULT 0;

ALTER TABLE [ProcessingRecords] ADD [RemSpecialWeight] decimal(18,4) NOT NULL DEFAULT 0.0;

ALTER TABLE [ProcessingRecords] ADD [RemWhiteCount] int NOT NULL DEFAULT 0;

ALTER TABLE [ProcessingRecords] ADD [RemWhiteWeight] decimal(18,4) NOT NULL DEFAULT 0.0;

CREATE TABLE [PurificationProcesses] (
    [Id] int NOT NULL IDENTITY,
    [Date] datetime2 NOT NULL,
    [ProcessingRecordId] int NOT NULL,
    [Category] nvarchar(max) NOT NULL,
    [PurifyCount] int NOT NULL,
    [PurifyWeight] decimal(18,4) NOT NULL,
    [RemainingCountAfter] int NOT NULL,
    [RemainingWeightAfter] decimal(18,4) NOT NULL,
    [DeleteFlg] int NOT NULL,
    [CreateDate] datetime2 NOT NULL,
    [CreateBy] nvarchar(max) NOT NULL,
    [UpdateDate] datetime2 NOT NULL,
    [UpdateBy] nvarchar(max) NOT NULL,
    [DeleteDate] datetime2 NULL,
    [DeleteBy] nvarchar(max) NULL,
    CONSTRAINT [PK_PurificationProcesses] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_PurificationProcesses_ProcessingRecords_ProcessingRecordId] FOREIGN KEY ([ProcessingRecordId]) REFERENCES [ProcessingRecords] ([Id]) ON DELETE CASCADE
);

CREATE INDEX [IX_PurificationProcesses_ProcessingRecordId] ON [PurificationProcesses] ([ProcessingRecordId]);

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260504051713_AddPurificationTable', N'9.0.0');

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260504052236_FixExistingProcessingRecords', N'9.0.0');

ALTER TABLE [PurificationProcesses] ADD [PurifierId] int NULL;

CREATE TABLE [Purifiers] (
    [Id] int NOT NULL IDENTITY,
    [Name] nvarchar(100) NOT NULL,
    [WarehouseId] int NOT NULL,
    [IsActive] bit NOT NULL,
    [DeleteFlg] int NOT NULL,
    [CreateDate] datetime2 NOT NULL,
    [CreateBy] nvarchar(max) NOT NULL,
    [UpdateDate] datetime2 NOT NULL,
    [UpdateBy] nvarchar(max) NOT NULL,
    [DeleteDate] datetime2 NULL,
    [DeleteBy] nvarchar(max) NULL,
    CONSTRAINT [PK_Purifiers] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Purifiers_Warehouses_WarehouseId] FOREIGN KEY ([WarehouseId]) REFERENCES [Warehouses] ([Id]) ON DELETE NO ACTION
);

CREATE INDEX [IX_PurificationProcesses_PurifierId] ON [PurificationProcesses] ([PurifierId]);

CREATE INDEX [IX_Purifiers_WarehouseId] ON [Purifiers] ([WarehouseId]);

ALTER TABLE [PurificationProcesses] ADD CONSTRAINT [FK_PurificationProcesses_Purifiers_PurifierId] FOREIGN KEY ([PurifierId]) REFERENCES [Purifiers] ([Id]) ON DELETE NO ACTION;

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260504071752_AddPurifiersTable', N'9.0.0');

ALTER TABLE [PurificationProcesses] ADD [IsWeightFull] bit NOT NULL DEFAULT CAST(0 AS bit);

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260504074759_AddIsWeightFullToPurificationProcess', N'9.0.0');

CREATE TABLE [PurifiedRecords] (
    [Id] int NOT NULL IDENTITY,
    [Date] datetime2 NOT NULL,
    [ProcessingRecordId] int NOT NULL,
    [Category] nvarchar(max) NOT NULL,
    [Count] int NOT NULL,
    [Weight] decimal(18,4) NOT NULL,
    [PurifierId] int NULL,
    [IsWeightFull] bit NOT NULL,
    [RemainingCount] int NOT NULL,
    [RemainingWeight] decimal(18,4) NOT NULL,
    [DeleteFlg] int NOT NULL,
    [CreateDate] datetime2 NOT NULL,
    [CreateBy] nvarchar(max) NOT NULL,
    [UpdateDate] datetime2 NOT NULL,
    [UpdateBy] nvarchar(max) NOT NULL,
    [DeleteDate] datetime2 NULL,
    [DeleteBy] nvarchar(max) NULL,
    CONSTRAINT [PK_PurifiedRecords] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_PurifiedRecords_ProcessingRecords_ProcessingRecordId] FOREIGN KEY ([ProcessingRecordId]) REFERENCES [ProcessingRecords] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_PurifiedRecords_Purifiers_PurifierId] FOREIGN KEY ([PurifierId]) REFERENCES [Purifiers] ([Id])
);

CREATE INDEX [IX_PurifiedRecords_ProcessingRecordId] ON [PurifiedRecords] ([ProcessingRecordId]);

CREATE INDEX [IX_PurifiedRecords_PurifierId] ON [PurifiedRecords] ([PurifierId]);

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260504080210_AddPurifiedRecordsTable', N'9.0.0');

ALTER TABLE [PurifiedRecords] ADD [PurificationProcessId] int NULL;

CREATE INDEX [IX_PurifiedRecords_PurificationProcessId] ON [PurifiedRecords] ([PurificationProcessId]);

ALTER TABLE [PurifiedRecords] ADD CONSTRAINT [FK_PurifiedRecords_PurificationProcesses_PurificationProcessId] FOREIGN KEY ([PurificationProcessId]) REFERENCES [PurificationProcesses] ([Id]);

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260504094358_AddPurificationProcessIdToPurifiedRecord', N'9.0.0');

ALTER TABLE [Users] ADD [WarehouseId] int NULL;

CREATE INDEX [IX_Users_WarehouseId] ON [Users] ([WarehouseId]);

ALTER TABLE [Users] ADD CONSTRAINT [FK_Users_Warehouses_WarehouseId] FOREIGN KEY ([WarehouseId]) REFERENCES [Warehouses] ([Id]);

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260504101305_AddWarehouseToUser', N'9.0.0');

CREATE TABLE [RefinementProcesses] (
    [Id] int NOT NULL IDENTITY,
    [Date] datetime2 NOT NULL,
    [PurifiedRecordId] int NOT NULL,
    [Category] nvarchar(max) NOT NULL,
    [Count] int NOT NULL,
    [Weight] decimal(18,4) NOT NULL,
    [RemainingCountAfter] int NOT NULL,
    [RemainingWeightAfter] decimal(18,4) NOT NULL,
    [PurifierId] int NULL,
    [IsWeightFull] bit NOT NULL,
    [DeleteFlg] int NOT NULL,
    [CreateDate] datetime2 NOT NULL,
    [CreateBy] nvarchar(max) NOT NULL,
    [UpdateDate] datetime2 NOT NULL,
    [UpdateBy] nvarchar(max) NOT NULL,
    [DeleteDate] datetime2 NULL,
    [DeleteBy] nvarchar(max) NULL,
    CONSTRAINT [PK_RefinementProcesses] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_RefinementProcesses_PurifiedRecords_PurifiedRecordId] FOREIGN KEY ([PurifiedRecordId]) REFERENCES [PurifiedRecords] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_RefinementProcesses_Purifiers_PurifierId] FOREIGN KEY ([PurifierId]) REFERENCES [Purifiers] ([Id]) ON DELETE NO ACTION
);

CREATE TABLE [RefinementRecords] (
    [Id] int NOT NULL IDENTITY,
    [Date] datetime2 NOT NULL,
    [PurifiedRecordId] int NOT NULL,
    [Category] nvarchar(max) NOT NULL,
    [Count] int NOT NULL,
    [Weight] decimal(18,4) NOT NULL,
    [PurifierId] int NULL,
    [IsWeightFull] bit NOT NULL,
    [RefinementProcessId] int NULL,
    [RemainingCount] int NOT NULL,
    [RemainingWeight] decimal(18,4) NOT NULL,
    [DeleteFlg] int NOT NULL,
    [CreateDate] datetime2 NOT NULL,
    [CreateBy] nvarchar(max) NOT NULL,
    [UpdateDate] datetime2 NOT NULL,
    [UpdateBy] nvarchar(max) NOT NULL,
    [DeleteDate] datetime2 NULL,
    [DeleteBy] nvarchar(max) NULL,
    CONSTRAINT [PK_RefinementRecords] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_RefinementRecords_PurifiedRecords_PurifiedRecordId] FOREIGN KEY ([PurifiedRecordId]) REFERENCES [PurifiedRecords] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_RefinementRecords_Purifiers_PurifierId] FOREIGN KEY ([PurifierId]) REFERENCES [Purifiers] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_RefinementRecords_RefinementProcesses_RefinementProcessId] FOREIGN KEY ([RefinementProcessId]) REFERENCES [RefinementProcesses] ([Id]) ON DELETE NO ACTION
);

CREATE INDEX [IX_RefinementProcesses_PurifiedRecordId] ON [RefinementProcesses] ([PurifiedRecordId]);

CREATE INDEX [IX_RefinementProcesses_PurifierId] ON [RefinementProcesses] ([PurifierId]);

CREATE INDEX [IX_RefinementRecords_PurifiedRecordId] ON [RefinementRecords] ([PurifiedRecordId]);

CREATE INDEX [IX_RefinementRecords_PurifierId] ON [RefinementRecords] ([PurifierId]);

CREATE INDEX [IX_RefinementRecords_RefinementProcessId] ON [RefinementRecords] ([RefinementProcessId]);

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260513101803_AddRefinementTables', N'9.0.0');

DECLARE @var1 sysname;
SELECT @var1 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[RefinementRecords]') AND [c].[name] = N'IsWeightFull');
IF @var1 IS NOT NULL EXEC(N'ALTER TABLE [RefinementRecords] DROP CONSTRAINT [' + @var1 + '];');
ALTER TABLE [RefinementRecords] DROP COLUMN [IsWeightFull];

DECLARE @var2 sysname;
SELECT @var2 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[RefinementProcesses]') AND [c].[name] = N'IsWeightFull');
IF @var2 IS NOT NULL EXEC(N'ALTER TABLE [RefinementProcesses] DROP CONSTRAINT [' + @var2 + '];');
ALTER TABLE [RefinementProcesses] DROP COLUMN [IsWeightFull];

ALTER TABLE [RefinementRecords] ADD [LostWeight] decimal(18,4) NOT NULL DEFAULT 0.0;

ALTER TABLE [RefinementProcesses] ADD [LostWeight] decimal(18,4) NOT NULL DEFAULT 0.0;

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260516040255_UpdateRefinementFields', N'9.0.0');

DECLARE @var3 sysname;
SELECT @var3 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[RefinementProcesses]') AND [c].[name] = N'LostWeight');
IF @var3 IS NOT NULL EXEC(N'ALTER TABLE [RefinementProcesses] DROP CONSTRAINT [' + @var3 + '];');
ALTER TABLE [RefinementProcesses] DROP COLUMN [LostWeight];

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260516042232_RemoveLostWeightFromProcess', N'9.0.0');

ALTER TABLE [RefinementRecords] ADD [ReturnWeight] decimal(18,4) NOT NULL DEFAULT 0.0;

ALTER TABLE [RefinementRecords] ADD [SpoilageWeight] decimal(18,4) NOT NULL DEFAULT 0.0;

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260527135356_AddSpoilageAndReturnWeightsToRefinementRecord', N'9.0.0');

CREATE TABLE [SingleDoubleDrawnRecords] (
    [Id] int NOT NULL IDENTITY,
    [Date] datetime2 NOT NULL,
    [RefinementRecordId] int NOT NULL,
    [Size6] decimal(18,4) NOT NULL,
    [Size7] decimal(18,4) NOT NULL,
    [Size8] decimal(18,4) NOT NULL,
    [Size9] decimal(18,4) NOT NULL,
    [Size10] decimal(18,4) NOT NULL,
    [Size10B] decimal(18,4) NOT NULL,
    [Size12] decimal(18,4) NOT NULL,
    [Size14] decimal(18,4) NOT NULL,
    [Size16] decimal(18,4) NOT NULL,
    [Size18] decimal(18,4) NOT NULL,
    [Size20] decimal(18,4) NOT NULL,
    [Size22] decimal(18,4) NOT NULL,
    [Size24] decimal(18,4) NOT NULL,
    [Size26] decimal(18,4) NOT NULL,
    [Size28] decimal(18,4) NOT NULL,
    [SizeBar] decimal(18,4) NOT NULL,
    [DeleteFlg] int NOT NULL,
    [CreateDate] datetime2 NOT NULL,
    [CreateBy] nvarchar(max) NOT NULL,
    [UpdateDate] datetime2 NOT NULL,
    [UpdateBy] nvarchar(max) NOT NULL,
    [DeleteDate] datetime2 NULL,
    [DeleteBy] nvarchar(max) NULL,
    CONSTRAINT [PK_SingleDoubleDrawnRecords] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_SingleDoubleDrawnRecords_RefinementRecords_RefinementRecordId] FOREIGN KEY ([RefinementRecordId]) REFERENCES [RefinementRecords] ([Id]) ON DELETE NO ACTION
);

CREATE INDEX [IX_SingleDoubleDrawnRecords_RefinementRecordId] ON [SingleDoubleDrawnRecords] ([RefinementRecordId]);

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260528031844_AddSingleDoubleDrawnRecords', N'9.0.0');

ALTER TABLE [SingleDoubleDrawnRecords] ADD [LostWeight] decimal(18,4) NOT NULL DEFAULT 0.0;

ALTER TABLE [SingleDoubleDrawnRecords] ADD [ReturnWeight] decimal(18,4) NOT NULL DEFAULT 0.0;

ALTER TABLE [SingleDoubleDrawnRecords] ADD [SpoilageWeight] decimal(18,4) NOT NULL DEFAULT 0.0;

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260528125803_AddWeightsToSingleDoubleDrawnRecords', N'9.0.0');

CREATE TABLE [SemiExportRecords] (
    [Id] int NOT NULL IDENTITY,
    [Date] datetime2 NOT NULL,
    [SingleDoubleDrawnRecordId] int NOT NULL,
    [PriceB] decimal(18,4) NOT NULL,
    [Price28] decimal(18,4) NOT NULL,
    [Price26] decimal(18,4) NOT NULL,
    [Price24] decimal(18,4) NOT NULL,
    [Price22] decimal(18,4) NOT NULL,
    [Price20] decimal(18,4) NOT NULL,
    [Price18] decimal(18,4) NOT NULL,
    [Price16] decimal(18,4) NOT NULL,
    [Price14] decimal(18,4) NOT NULL,
    [Price12] decimal(18,4) NOT NULL,
    [Price10] decimal(18,4) NOT NULL,
    [Price8] decimal(18,4) NOT NULL,
    [PriceLeftover] decimal(18,4) NOT NULL,
    [PriceSpoil] decimal(18,4) NOT NULL,
    [Remark] nvarchar(500) NOT NULL,
    [DeleteFlg] int NOT NULL,
    [CreateDate] datetime2 NOT NULL,
    [CreateBy] nvarchar(max) NOT NULL,
    [UpdateDate] datetime2 NOT NULL,
    [UpdateBy] nvarchar(max) NOT NULL,
    [DeleteDate] datetime2 NULL,
    [DeleteBy] nvarchar(max) NULL,
    CONSTRAINT [PK_SemiExportRecords] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_SemiExportRecords_SingleDoubleDrawnRecords_SingleDoubleDrawnRecordId] FOREIGN KEY ([SingleDoubleDrawnRecordId]) REFERENCES [SingleDoubleDrawnRecords] ([Id]) ON DELETE NO ACTION
);

CREATE INDEX [IX_SemiExportRecords_SingleDoubleDrawnRecordId] ON [SemiExportRecords] ([SingleDoubleDrawnRecordId]);

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260528140750_AddSemiExportRecordsTable', N'9.0.0');

ALTER TABLE [SemiExportRecords] ADD [Price10B] decimal(18,4) NOT NULL DEFAULT 0.0;

ALTER TABLE [SemiExportRecords] ADD [Price6] decimal(18,4) NOT NULL DEFAULT 0.0;

ALTER TABLE [SemiExportRecords] ADD [Price7] decimal(18,4) NOT NULL DEFAULT 0.0;

ALTER TABLE [SemiExportRecords] ADD [Price9] decimal(18,4) NOT NULL DEFAULT 0.0;

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260528155101_AddAllSizesPricesToSemiExport', N'9.0.0');

ALTER TABLE [SingleDoubleDrawnRecords] ADD [Price10] decimal(18,4) NOT NULL DEFAULT 0.0;

ALTER TABLE [SingleDoubleDrawnRecords] ADD [Price10B] decimal(18,4) NOT NULL DEFAULT 0.0;

ALTER TABLE [SingleDoubleDrawnRecords] ADD [Price12] decimal(18,4) NOT NULL DEFAULT 0.0;

ALTER TABLE [SingleDoubleDrawnRecords] ADD [Price14] decimal(18,4) NOT NULL DEFAULT 0.0;

ALTER TABLE [SingleDoubleDrawnRecords] ADD [Price16] decimal(18,4) NOT NULL DEFAULT 0.0;

ALTER TABLE [SingleDoubleDrawnRecords] ADD [Price18] decimal(18,4) NOT NULL DEFAULT 0.0;

ALTER TABLE [SingleDoubleDrawnRecords] ADD [Price20] decimal(18,4) NOT NULL DEFAULT 0.0;

ALTER TABLE [SingleDoubleDrawnRecords] ADD [Price22] decimal(18,4) NOT NULL DEFAULT 0.0;

ALTER TABLE [SingleDoubleDrawnRecords] ADD [Price24] decimal(18,4) NOT NULL DEFAULT 0.0;

ALTER TABLE [SingleDoubleDrawnRecords] ADD [Price26] decimal(18,4) NOT NULL DEFAULT 0.0;

ALTER TABLE [SingleDoubleDrawnRecords] ADD [Price28] decimal(18,4) NOT NULL DEFAULT 0.0;

ALTER TABLE [SingleDoubleDrawnRecords] ADD [Price6] decimal(18,4) NOT NULL DEFAULT 0.0;

ALTER TABLE [SingleDoubleDrawnRecords] ADD [Price7] decimal(18,4) NOT NULL DEFAULT 0.0;

ALTER TABLE [SingleDoubleDrawnRecords] ADD [Price8] decimal(18,4) NOT NULL DEFAULT 0.0;

ALTER TABLE [SingleDoubleDrawnRecords] ADD [Price9] decimal(18,4) NOT NULL DEFAULT 0.0;

ALTER TABLE [SingleDoubleDrawnRecords] ADD [PriceBar] decimal(18,4) NOT NULL DEFAULT 0.0;

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260529092403_AddPricesToSingleDoubleDrawn', N'9.0.0');

ALTER TABLE [SingleDoubleDrawnRecords] ADD [PriceReturnSize] decimal(18,4) NOT NULL DEFAULT 0.0;

ALTER TABLE [SingleDoubleDrawnRecords] ADD [PriceSpoilageSize] decimal(18,4) NOT NULL DEFAULT 0.0;

ALTER TABLE [SingleDoubleDrawnRecords] ADD [ReturnSize] decimal(18,4) NOT NULL DEFAULT 0.0;

ALTER TABLE [SingleDoubleDrawnRecords] ADD [SpoilageSize] decimal(18,4) NOT NULL DEFAULT 0.0;

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260529141314_AddSpoilageSizeAndReturnSize', N'9.0.0');

DECLARE @var4 sysname;
SELECT @var4 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[PurificationProcesses]') AND [c].[name] = N'RemainingCountAfter');
IF @var4 IS NOT NULL EXEC(N'ALTER TABLE [PurificationProcesses] DROP CONSTRAINT [' + @var4 + '];');
ALTER TABLE [PurificationProcesses] ALTER COLUMN [RemainingCountAfter] float NOT NULL;

DECLARE @var5 sysname;
SELECT @var5 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ProcessingRecords]') AND [c].[name] = N'WhiteCount');
IF @var5 IS NOT NULL EXEC(N'ALTER TABLE [ProcessingRecords] DROP CONSTRAINT [' + @var5 + '];');
ALTER TABLE [ProcessingRecords] ALTER COLUMN [WhiteCount] float NOT NULL;

DECLARE @var6 sysname;
SELECT @var6 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ProcessingRecords]') AND [c].[name] = N'SpecialCount');
IF @var6 IS NOT NULL EXEC(N'ALTER TABLE [ProcessingRecords] DROP CONSTRAINT [' + @var6 + '];');
ALTER TABLE [ProcessingRecords] ALTER COLUMN [SpecialCount] float NOT NULL;

DECLARE @var7 sysname;
SELECT @var7 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ProcessingRecords]') AND [c].[name] = N'ShortCutCount');
IF @var7 IS NOT NULL EXEC(N'ALTER TABLE [ProcessingRecords] DROP CONSTRAINT [' + @var7 + '];');
ALTER TABLE [ProcessingRecords] ALTER COLUMN [ShortCutCount] float NOT NULL;

DECLARE @var8 sysname;
SELECT @var8 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ProcessingRecords]') AND [c].[name] = N'ShortCount');
IF @var8 IS NOT NULL EXEC(N'ALTER TABLE [ProcessingRecords] DROP CONSTRAINT [' + @var8 + '];');
ALTER TABLE [ProcessingRecords] ALTER COLUMN [ShortCount] float NOT NULL;

DECLARE @var9 sysname;
SELECT @var9 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ProcessingRecords]') AND [c].[name] = N'RemainingCount');
IF @var9 IS NOT NULL EXEC(N'ALTER TABLE [ProcessingRecords] DROP CONSTRAINT [' + @var9 + '];');
ALTER TABLE [ProcessingRecords] ALTER COLUMN [RemainingCount] float NOT NULL;

DECLARE @var10 sysname;
SELECT @var10 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ProcessingRecords]') AND [c].[name] = N'RemWhiteCount');
IF @var10 IS NOT NULL EXEC(N'ALTER TABLE [ProcessingRecords] DROP CONSTRAINT [' + @var10 + '];');
ALTER TABLE [ProcessingRecords] ALTER COLUMN [RemWhiteCount] float NOT NULL;

DECLARE @var11 sysname;
SELECT @var11 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ProcessingRecords]') AND [c].[name] = N'RemSpecialCount');
IF @var11 IS NOT NULL EXEC(N'ALTER TABLE [ProcessingRecords] DROP CONSTRAINT [' + @var11 + '];');
ALTER TABLE [ProcessingRecords] ALTER COLUMN [RemSpecialCount] float NOT NULL;

DECLARE @var12 sysname;
SELECT @var12 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ProcessingRecords]') AND [c].[name] = N'RemShortCutCount');
IF @var12 IS NOT NULL EXEC(N'ALTER TABLE [ProcessingRecords] DROP CONSTRAINT [' + @var12 + '];');
ALTER TABLE [ProcessingRecords] ALTER COLUMN [RemShortCutCount] float NOT NULL;

DECLARE @var13 sysname;
SELECT @var13 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ProcessingRecords]') AND [c].[name] = N'RemShortCount');
IF @var13 IS NOT NULL EXEC(N'ALTER TABLE [ProcessingRecords] DROP CONSTRAINT [' + @var13 + '];');
ALTER TABLE [ProcessingRecords] ALTER COLUMN [RemShortCount] float NOT NULL;

DECLARE @var14 sysname;
SELECT @var14 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ProcessingRecords]') AND [c].[name] = N'RemRedCount');
IF @var14 IS NOT NULL EXEC(N'ALTER TABLE [ProcessingRecords] DROP CONSTRAINT [' + @var14 + '];');
ALTER TABLE [ProcessingRecords] ALTER COLUMN [RemRedCount] float NOT NULL;

DECLARE @var15 sysname;
SELECT @var15 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ProcessingRecords]') AND [c].[name] = N'RemNaturalWhiteCount');
IF @var15 IS NOT NULL EXEC(N'ALTER TABLE [ProcessingRecords] DROP CONSTRAINT [' + @var15 + '];');
ALTER TABLE [ProcessingRecords] ALTER COLUMN [RemNaturalWhiteCount] float NOT NULL;

DECLARE @var16 sysname;
SELECT @var16 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ProcessingRecords]') AND [c].[name] = N'RemNaturalRedCount');
IF @var16 IS NOT NULL EXEC(N'ALTER TABLE [ProcessingRecords] DROP CONSTRAINT [' + @var16 + '];');
ALTER TABLE [ProcessingRecords] ALTER COLUMN [RemNaturalRedCount] float NOT NULL;

DECLARE @var17 sysname;
SELECT @var17 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ProcessingRecords]') AND [c].[name] = N'RemNaturalCount');
IF @var17 IS NOT NULL EXEC(N'ALTER TABLE [ProcessingRecords] DROP CONSTRAINT [' + @var17 + '];');
ALTER TABLE [ProcessingRecords] ALTER COLUMN [RemNaturalCount] float NOT NULL;

DECLARE @var18 sysname;
SELECT @var18 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ProcessingRecords]') AND [c].[name] = N'RemArtificialCount');
IF @var18 IS NOT NULL EXEC(N'ALTER TABLE [ProcessingRecords] DROP CONSTRAINT [' + @var18 + '];');
ALTER TABLE [ProcessingRecords] ALTER COLUMN [RemArtificialCount] float NOT NULL;

DECLARE @var19 sysname;
SELECT @var19 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ProcessingRecords]') AND [c].[name] = N'RedCount');
IF @var19 IS NOT NULL EXEC(N'ALTER TABLE [ProcessingRecords] DROP CONSTRAINT [' + @var19 + '];');
ALTER TABLE [ProcessingRecords] ALTER COLUMN [RedCount] float NOT NULL;

DECLARE @var20 sysname;
SELECT @var20 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ProcessingRecords]') AND [c].[name] = N'NaturalWhiteCount');
IF @var20 IS NOT NULL EXEC(N'ALTER TABLE [ProcessingRecords] DROP CONSTRAINT [' + @var20 + '];');
ALTER TABLE [ProcessingRecords] ALTER COLUMN [NaturalWhiteCount] float NOT NULL;

DECLARE @var21 sysname;
SELECT @var21 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ProcessingRecords]') AND [c].[name] = N'NaturalRedCount');
IF @var21 IS NOT NULL EXEC(N'ALTER TABLE [ProcessingRecords] DROP CONSTRAINT [' + @var21 + '];');
ALTER TABLE [ProcessingRecords] ALTER COLUMN [NaturalRedCount] float NOT NULL;

DECLARE @var22 sysname;
SELECT @var22 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ProcessingRecords]') AND [c].[name] = N'NaturalCount');
IF @var22 IS NOT NULL EXEC(N'ALTER TABLE [ProcessingRecords] DROP CONSTRAINT [' + @var22 + '];');
ALTER TABLE [ProcessingRecords] ALTER COLUMN [NaturalCount] float NOT NULL;

DECLARE @var23 sysname;
SELECT @var23 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ProcessingRecords]') AND [c].[name] = N'Count');
IF @var23 IS NOT NULL EXEC(N'ALTER TABLE [ProcessingRecords] DROP CONSTRAINT [' + @var23 + '];');
ALTER TABLE [ProcessingRecords] ALTER COLUMN [Count] float NOT NULL;

DECLARE @var24 sysname;
SELECT @var24 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ProcessingRecords]') AND [c].[name] = N'ArtificialCount');
IF @var24 IS NOT NULL EXEC(N'ALTER TABLE [ProcessingRecords] DROP CONSTRAINT [' + @var24 + '];');
ALTER TABLE [ProcessingRecords] ALTER COLUMN [ArtificialCount] float NOT NULL;

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260531062021_ChangeCountFieldsToDouble', N'9.0.0');

ALTER TABLE [Sales] ADD [PlusMinusWeight] decimal(18,2) NOT NULL DEFAULT 0.0;

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260531095024_AddPlusMinusWeightToSale', N'9.0.0');

CREATE TABLE [RefinementWorkers] (
    [Id] int NOT NULL IDENTITY,
    [Name] nvarchar(100) NOT NULL,
    [WarehouseId] int NOT NULL,
    [IsActive] bit NOT NULL,
    [DeleteFlg] int NOT NULL,
    [CreateDate] datetime2 NOT NULL,
    [CreateBy] nvarchar(max) NOT NULL,
    [UpdateDate] datetime2 NOT NULL,
    [UpdateBy] nvarchar(max) NOT NULL,
    [DeleteDate] datetime2 NULL,
    [DeleteBy] nvarchar(max) NULL,
    CONSTRAINT [PK_RefinementWorkers] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_RefinementWorkers_Warehouses_WarehouseId] FOREIGN KEY ([WarehouseId]) REFERENCES [Warehouses] ([Id]) ON DELETE NO ACTION
);

CREATE INDEX [IX_RefinementWorkers_WarehouseId] ON [RefinementWorkers] ([WarehouseId]);

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260601092813_AddRefinementWorkers', N'9.0.0');

ALTER TABLE [Products] ADD [SemiExportWorkerFees] decimal(18,2) NOT NULL DEFAULT 0.0;

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260602074130_AddSemiExportWorkerFees', N'9.0.0');

ALTER TABLE [SemiExportRecords] ADD [WorkerFees] decimal(18,2) NOT NULL DEFAULT 0.0;

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260602084205_AddWorkerFeesToSemiExport', N'9.0.0');

DECLARE @var25 sysname;
SELECT @var25 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Products]') AND [c].[name] = N'SemiExportWorkerFees');
IF @var25 IS NOT NULL EXEC(N'ALTER TABLE [Products] DROP CONSTRAINT [' + @var25 + '];');
ALTER TABLE [Products] DROP COLUMN [SemiExportWorkerFees];

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260602084831_CleanupSemiExportWorkerFeesFromProduct', N'9.0.0');

DECLARE @var26 sysname;
SELECT @var26 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[SemiExportRecords]') AND [c].[name] = N'Price10');
IF @var26 IS NOT NULL EXEC(N'ALTER TABLE [SemiExportRecords] DROP CONSTRAINT [' + @var26 + '];');
ALTER TABLE [SemiExportRecords] DROP COLUMN [Price10];

DECLARE @var27 sysname;
SELECT @var27 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[SemiExportRecords]') AND [c].[name] = N'Price10B');
IF @var27 IS NOT NULL EXEC(N'ALTER TABLE [SemiExportRecords] DROP CONSTRAINT [' + @var27 + '];');
ALTER TABLE [SemiExportRecords] DROP COLUMN [Price10B];

DECLARE @var28 sysname;
SELECT @var28 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[SemiExportRecords]') AND [c].[name] = N'Price12');
IF @var28 IS NOT NULL EXEC(N'ALTER TABLE [SemiExportRecords] DROP CONSTRAINT [' + @var28 + '];');
ALTER TABLE [SemiExportRecords] DROP COLUMN [Price12];

DECLARE @var29 sysname;
SELECT @var29 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[SemiExportRecords]') AND [c].[name] = N'Price14');
IF @var29 IS NOT NULL EXEC(N'ALTER TABLE [SemiExportRecords] DROP CONSTRAINT [' + @var29 + '];');
ALTER TABLE [SemiExportRecords] DROP COLUMN [Price14];

DECLARE @var30 sysname;
SELECT @var30 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[SemiExportRecords]') AND [c].[name] = N'Price16');
IF @var30 IS NOT NULL EXEC(N'ALTER TABLE [SemiExportRecords] DROP CONSTRAINT [' + @var30 + '];');
ALTER TABLE [SemiExportRecords] DROP COLUMN [Price16];

DECLARE @var31 sysname;
SELECT @var31 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[SemiExportRecords]') AND [c].[name] = N'Price18');
IF @var31 IS NOT NULL EXEC(N'ALTER TABLE [SemiExportRecords] DROP CONSTRAINT [' + @var31 + '];');
ALTER TABLE [SemiExportRecords] DROP COLUMN [Price18];

DECLARE @var32 sysname;
SELECT @var32 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[SemiExportRecords]') AND [c].[name] = N'Price20');
IF @var32 IS NOT NULL EXEC(N'ALTER TABLE [SemiExportRecords] DROP CONSTRAINT [' + @var32 + '];');
ALTER TABLE [SemiExportRecords] DROP COLUMN [Price20];

DECLARE @var33 sysname;
SELECT @var33 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[SemiExportRecords]') AND [c].[name] = N'Price22');
IF @var33 IS NOT NULL EXEC(N'ALTER TABLE [SemiExportRecords] DROP CONSTRAINT [' + @var33 + '];');
ALTER TABLE [SemiExportRecords] DROP COLUMN [Price22];

DECLARE @var34 sysname;
SELECT @var34 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[SemiExportRecords]') AND [c].[name] = N'Price24');
IF @var34 IS NOT NULL EXEC(N'ALTER TABLE [SemiExportRecords] DROP CONSTRAINT [' + @var34 + '];');
ALTER TABLE [SemiExportRecords] DROP COLUMN [Price24];

DECLARE @var35 sysname;
SELECT @var35 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[SemiExportRecords]') AND [c].[name] = N'Price26');
IF @var35 IS NOT NULL EXEC(N'ALTER TABLE [SemiExportRecords] DROP CONSTRAINT [' + @var35 + '];');
ALTER TABLE [SemiExportRecords] DROP COLUMN [Price26];

DECLARE @var36 sysname;
SELECT @var36 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[SemiExportRecords]') AND [c].[name] = N'Price28');
IF @var36 IS NOT NULL EXEC(N'ALTER TABLE [SemiExportRecords] DROP CONSTRAINT [' + @var36 + '];');
ALTER TABLE [SemiExportRecords] DROP COLUMN [Price28];

DECLARE @var37 sysname;
SELECT @var37 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[SemiExportRecords]') AND [c].[name] = N'Price6');
IF @var37 IS NOT NULL EXEC(N'ALTER TABLE [SemiExportRecords] DROP CONSTRAINT [' + @var37 + '];');
ALTER TABLE [SemiExportRecords] DROP COLUMN [Price6];

DECLARE @var38 sysname;
SELECT @var38 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[SemiExportRecords]') AND [c].[name] = N'Price7');
IF @var38 IS NOT NULL EXEC(N'ALTER TABLE [SemiExportRecords] DROP CONSTRAINT [' + @var38 + '];');
ALTER TABLE [SemiExportRecords] DROP COLUMN [Price7];

DECLARE @var39 sysname;
SELECT @var39 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[SemiExportRecords]') AND [c].[name] = N'Price8');
IF @var39 IS NOT NULL EXEC(N'ALTER TABLE [SemiExportRecords] DROP CONSTRAINT [' + @var39 + '];');
ALTER TABLE [SemiExportRecords] DROP COLUMN [Price8];

DECLARE @var40 sysname;
SELECT @var40 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[SemiExportRecords]') AND [c].[name] = N'Price9');
IF @var40 IS NOT NULL EXEC(N'ALTER TABLE [SemiExportRecords] DROP CONSTRAINT [' + @var40 + '];');
ALTER TABLE [SemiExportRecords] DROP COLUMN [Price9];

DECLARE @var41 sysname;
SELECT @var41 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[SemiExportRecords]') AND [c].[name] = N'PriceB');
IF @var41 IS NOT NULL EXEC(N'ALTER TABLE [SemiExportRecords] DROP CONSTRAINT [' + @var41 + '];');
ALTER TABLE [SemiExportRecords] DROP COLUMN [PriceB];

DECLARE @var42 sysname;
SELECT @var42 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[SemiExportRecords]') AND [c].[name] = N'PriceLeftover');
IF @var42 IS NOT NULL EXEC(N'ALTER TABLE [SemiExportRecords] DROP CONSTRAINT [' + @var42 + '];');
ALTER TABLE [SemiExportRecords] DROP COLUMN [PriceLeftover];

DECLARE @var43 sysname;
SELECT @var43 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[SemiExportRecords]') AND [c].[name] = N'PriceSpoil');
IF @var43 IS NOT NULL EXEC(N'ALTER TABLE [SemiExportRecords] DROP CONSTRAINT [' + @var43 + '];');
ALTER TABLE [SemiExportRecords] DROP COLUMN [PriceSpoil];

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260602100212_RemovePricesFromSemiExport', N'9.0.0');

DECLARE @var44 sysname;
SELECT @var44 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[RefinementRecords]') AND [c].[name] = N'RemainingCount');
IF @var44 IS NOT NULL EXEC(N'ALTER TABLE [RefinementRecords] DROP CONSTRAINT [' + @var44 + '];');
ALTER TABLE [RefinementRecords] ALTER COLUMN [RemainingCount] float NOT NULL;

DECLARE @var45 sysname;
SELECT @var45 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[RefinementRecords]') AND [c].[name] = N'Count');
IF @var45 IS NOT NULL EXEC(N'ALTER TABLE [RefinementRecords] DROP CONSTRAINT [' + @var45 + '];');
ALTER TABLE [RefinementRecords] ALTER COLUMN [Count] float NOT NULL;

DECLARE @var46 sysname;
SELECT @var46 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[RefinementProcesses]') AND [c].[name] = N'RemainingCountAfter');
IF @var46 IS NOT NULL EXEC(N'ALTER TABLE [RefinementProcesses] DROP CONSTRAINT [' + @var46 + '];');
ALTER TABLE [RefinementProcesses] ALTER COLUMN [RemainingCountAfter] float NOT NULL;

DECLARE @var47 sysname;
SELECT @var47 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[RefinementProcesses]') AND [c].[name] = N'Count');
IF @var47 IS NOT NULL EXEC(N'ALTER TABLE [RefinementProcesses] DROP CONSTRAINT [' + @var47 + '];');
ALTER TABLE [RefinementProcesses] ALTER COLUMN [Count] float NOT NULL;

DECLARE @var48 sysname;
SELECT @var48 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[PurifiedRecords]') AND [c].[name] = N'RemainingCount');
IF @var48 IS NOT NULL EXEC(N'ALTER TABLE [PurifiedRecords] DROP CONSTRAINT [' + @var48 + '];');
ALTER TABLE [PurifiedRecords] ALTER COLUMN [RemainingCount] float NOT NULL;

DECLARE @var49 sysname;
SELECT @var49 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[PurifiedRecords]') AND [c].[name] = N'Count');
IF @var49 IS NOT NULL EXEC(N'ALTER TABLE [PurifiedRecords] DROP CONSTRAINT [' + @var49 + '];');
ALTER TABLE [PurifiedRecords] ALTER COLUMN [Count] float NOT NULL;

DECLARE @var50 sysname;
SELECT @var50 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[PurificationProcesses]') AND [c].[name] = N'PurifyCount');
IF @var50 IS NOT NULL EXEC(N'ALTER TABLE [PurificationProcesses] DROP CONSTRAINT [' + @var50 + '];');
ALTER TABLE [PurificationProcesses] ALTER COLUMN [PurifyCount] float NOT NULL;

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260603042426_UpdateCountsToDouble', N'9.0.0');

CREATE TABLE [Ledgers] (
    [Id] int NOT NULL IDENTITY,
    [Date] datetime2 NOT NULL,
    [Description] nvarchar(max) NOT NULL,
    [DeleteFlg] int NOT NULL,
    [CreateDate] datetime2 NOT NULL,
    [CreateBy] nvarchar(max) NOT NULL,
    [UpdateDate] datetime2 NOT NULL,
    [UpdateBy] nvarchar(max) NOT NULL,
    [DeleteDate] datetime2 NULL,
    [DeleteBy] nvarchar(max) NULL,
    CONSTRAINT [PK_Ledgers] PRIMARY KEY ([Id])
);

CREATE TABLE [LedgerMarkers] (
    [Id] int NOT NULL IDENTITY,
    [LedgerId] int NOT NULL,
    [MarkerName] nvarchar(max) NOT NULL,
    [DeleteFlg] int NOT NULL,
    [CreateDate] datetime2 NOT NULL,
    [CreateBy] nvarchar(max) NOT NULL,
    [UpdateDate] datetime2 NOT NULL,
    [UpdateBy] nvarchar(max) NOT NULL,
    [DeleteDate] datetime2 NULL,
    [DeleteBy] nvarchar(max) NULL,
    CONSTRAINT [PK_LedgerMarkers] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_LedgerMarkers_Ledgers_LedgerId] FOREIGN KEY ([LedgerId]) REFERENCES [Ledgers] ([Id]) ON DELETE CASCADE
);

CREATE INDEX [IX_LedgerMarkers_LedgerId] ON [LedgerMarkers] ([LedgerId]);

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260603074134_AddLedgerTables', N'9.0.0');

ALTER TABLE [Ledgers] ADD [LedgerName] nvarchar(max) NOT NULL DEFAULT N'';

ALTER TABLE [LedgerMarkers] ADD [ProductId] int NULL;

CREATE INDEX [IX_LedgerMarkers_ProductId] ON [LedgerMarkers] ([ProductId]);

ALTER TABLE [LedgerMarkers] ADD CONSTRAINT [FK_LedgerMarkers_Products_ProductId] FOREIGN KEY ([ProductId]) REFERENCES [Products] ([Id]);

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260603075923_UpdateLedgerTables', N'9.0.0');

ALTER TABLE [RefinementProcesses] DROP CONSTRAINT [FK_RefinementProcesses_Purifiers_PurifierId];

ALTER TABLE [RefinementRecords] DROP CONSTRAINT [FK_RefinementRecords_Purifiers_PurifierId];

EXEC sp_rename N'[RefinementRecords].[PurifierId]', N'RefinementWorkerId', 'COLUMN';

EXEC sp_rename N'[RefinementRecords].[IX_RefinementRecords_PurifierId]', N'IX_RefinementRecords_RefinementWorkerId', 'INDEX';

EXEC sp_rename N'[RefinementProcesses].[PurifierId]', N'RefinementWorkerId', 'COLUMN';

EXEC sp_rename N'[RefinementProcesses].[IX_RefinementProcesses_PurifierId]', N'IX_RefinementProcesses_RefinementWorkerId', 'INDEX';

ALTER TABLE [RefinementProcesses] ADD CONSTRAINT [FK_RefinementProcesses_RefinementWorkers_RefinementWorkerId] FOREIGN KEY ([RefinementWorkerId]) REFERENCES [RefinementWorkers] ([Id]) ON DELETE NO ACTION;

ALTER TABLE [RefinementRecords] ADD CONSTRAINT [FK_RefinementRecords_RefinementWorkers_RefinementWorkerId] FOREIGN KEY ([RefinementWorkerId]) REFERENCES [RefinementWorkers] ([Id]) ON DELETE NO ACTION;

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260603105913_RenameRefinementWorkIdV2', N'9.0.0');

COMMIT;
GO

