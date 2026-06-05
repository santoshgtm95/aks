using System;
using System.ComponentModel.DataAnnotations;

namespace AKZ.API.DTOs;

public class ExchangeRateDto
{
    public int Id { get; set; }
    public string FromCurrency { get; set; } = null!;
    public string ToCurrency { get; set; } = null!;
    public decimal Rate { get; set; }
    public bool ActiveStatus { get; set; }
    public DateTime CreateDate { get; set; }
    public string CreateBy { get; set; } = null!;
}

public class CreateExchangeRateDto
{
    [Required]
    [MaxLength(10)]
    public string FromCurrency { get; set; } = null!;

    [Required]
    [MaxLength(10)]
    public string ToCurrency { get; set; } = null!;

    [Required]
    public decimal Rate { get; set; }
    
    public bool ActiveStatus { get; set; }
}