using Microsoft.AspNetCore.Mvc;
using AKZ.API.Services;
using AKZ.API.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AKZ.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReportsController : ControllerBase
{
    private readonly ReportService _reportService;

    public ReportsController(ReportService reportService)
    {
        _reportService = reportService;
    }

    /// <summary>
    /// Get all markers that have been exported
    /// </summary>
    [HttpGet("exported-markers")]
    public async Task<ActionResult<List<ExportedMarkerDto>>> GetExportedMarkers()
    {
        try
        {
            var markers = await _reportService.GetExportedMarkersAsync();
            return Ok(markers);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error retrieving exported markers", error = ex.Message });
        }
    }

    /// <summary>
    /// Generate report data for selected markers
    /// </summary>
    [HttpPost("generate-report-data")]
    public async Task<ActionResult<ReportDataResponseDto>> GenerateReportData([FromBody] ReportDataRequestDto request)
    {
        if (request == null || request.MarkerIds == null || request.MarkerIds.Count == 0)
        {
            return BadRequest(new { message = "Please select at least one marker" });
        }

        if (request.ReportTypes == null || request.ReportTypes.Count == 0)
        {
            return BadRequest(new { message = "Please select at least one report type" });
        }

        try
        {
            var reportData = await _reportService.GenerateReportDataAsync(request);
            return Ok(reportData);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error generating report data", error = ex.Message });
        }
    }
}
