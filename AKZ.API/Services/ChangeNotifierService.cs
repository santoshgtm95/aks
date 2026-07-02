namespace AKZ.API.Services;

/// <summary>
/// Singleton service that manages long-poll change notifications.
/// When any data mutation occurs, call NotifyChange() — all waiting
/// long-poll clients will be unblocked and the current version returned.
/// </summary>
public class ChangeNotifierService
{
    // Monotonically increasing version number, incremented on every change.
    private long _currentVersion = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

    // A SemaphoreSlim with count 0 is used as an async signal. 
    // Each Release() call unblocks one waiting WaitAsync() caller.
    // We release ALL waiters at once by releasing many times.
    private readonly object _lock = new();
    private readonly List<TaskCompletionSource<long>> _waiters = new();

    /// <summary>
    /// Returns the current data version number (Unix milliseconds at startup, 
    /// incremented by 1 on every mutation).
    /// </summary>
    public long CurrentVersion => Interlocked.Read(ref _currentVersion);

    /// <summary>
    /// Called by any controller that mutates data. 
    /// Bumps the version and signals all waiting clients.
    /// </summary>
    public void NotifyChange()
    {
        var newVersion = Interlocked.Increment(ref _currentVersion);

        List<TaskCompletionSource<long>> toSignal;
        lock (_lock)
        {
            toSignal = new List<TaskCompletionSource<long>>(_waiters);
            _waiters.Clear();
        }

        foreach (var tcs in toSignal)
        {
            tcs.TrySetResult(newVersion);
        }
    }

    /// <summary>
    /// Waits asynchronously until the version advances beyond
    /// <paramref name="knownVersion"/>, or until <paramref name="ct"/> is cancelled.
    /// Returns the new version (or <paramref name="knownVersion"/> on timeout/cancel).
    /// </summary>
    public async Task<long> WaitForChangeAsync(long knownVersion, CancellationToken ct)
    {
        // If data already changed since the client last saw it, return immediately.
        var current = Interlocked.Read(ref _currentVersion);
        if (current != knownVersion)
            return current;

        var tcs = new TaskCompletionSource<long>(TaskCreationOptions.RunContinuationsAsynchronously);

        lock (_lock)
        {
            // Double-check inside lock
            current = Interlocked.Read(ref _currentVersion);
            if (current != knownVersion)
            {
                return current;
            }
            _waiters.Add(tcs);
        }

        // Register cancellation so the TCS is cancelled when the request is aborted
        using var reg = ct.Register(() => tcs.TrySetCanceled(ct));

        try
        {
            return await tcs.Task;
        }
        catch (OperationCanceledException)
        {
            // Cleanup: remove from waiters list if still there
            lock (_lock) { _waiters.Remove(tcs); }
            return Interlocked.Read(ref _currentVersion);
        }
    }
}
