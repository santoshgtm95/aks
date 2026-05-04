using System.Security.Claims;

namespace AKZ.API.Services;

public interface ICurrentUserService
{
    string? GetUsername();
}

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public string? GetUsername()
    {
        return _httpContextAccessor.HttpContext?.User?.Identity?.Name;
    }
}
