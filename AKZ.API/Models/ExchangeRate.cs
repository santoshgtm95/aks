using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AKZ.API.Models;

public class ExchangeRate : BaseEntity
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(10)]
    public string FromCurrency { get; set; } = null!;

    [Required]
    [MaxLength(10)]
    public string ToCurrency { get; set; } = null!;

    [Column(TypeName = "decimal(18,4)")]
    public decimal Rate { get; set; }

    public bool ActiveStatus { get; set; }
}