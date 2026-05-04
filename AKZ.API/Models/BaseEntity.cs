using System;

namespace AKZ.API.Models;

public abstract class BaseEntity
{
    public int DeleteFlg { get; set; } = 0;
    public DateTime CreateDate { get; set; } = DateTime.UtcNow;
    public string CreateBy { get; set; } = "System";
    public DateTime UpdateDate { get; set; } = DateTime.UtcNow;
    public string UpdateBy { get; set; } = "System";
    public DateTime? DeleteDate { get; set; }
    public string? DeleteBy { get; set; }
}
