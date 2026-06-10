namespace AKZ.API.DTOs;

public class MessLabourWorkerDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int WarehouseId { get; set; }
    public string WarehouseName { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

public class CreateMessLabourWorkerDto
{
    public string Name { get; set; } = string.Empty;
    public int WarehouseId { get; set; }
}

public class UpdateMessLabourWorkerDto
{
    public string Name { get; set; } = string.Empty;
    public int WarehouseId { get; set; }
    public bool IsActive { get; set; }
}