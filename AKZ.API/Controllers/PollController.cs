using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AKZ.API.Services;

namespace AKZ.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class PollController : ControllerBase
{
    private readonly ChangeNotifierService _notifier;

    public PollController(ChangeNotifierService notifier)
    {
        _notifier = notifier;
    }

    /// <summary>
    /// Long-poll endpoint. Client sends the last known version.
    /// The server holds the connection open (up to 25 seconds) until 
    /// the version advances, then returns the new version.
    /// Client should immediately re-poll after receiving a response.
    /// </summary>
    [HttpGet("changes")]
    public async Task<IActionResult> GetChanges([FromQuery] long lastVersion = 0)
    {
        // Use a 25-second timeout combined with request cancellation
        using var cts = CancellationTokenSource.CreateLinkedTokenSource(HttpContext.RequestAborted);
        cts.CancelAfter(TimeSpan.FromSeconds(25));

        var newVersion = await _notifier.WaitForChangeAsync(lastVersion, cts.Token);

        return Ok(new { version = newVersion, changed = newVersion != lastVersion });
    }

    /// <summary>
    /// Simple endpoint to get the current version without waiting.
    /// Used by the client on initial load.
    /// </summary>
    [HttpGet("version")]
    public IActionResult GetVersion()
    {
        return Ok(new { version = _notifier.CurrentVersion });
    }
}
