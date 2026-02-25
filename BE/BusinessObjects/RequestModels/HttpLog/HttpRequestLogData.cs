using System;

namespace GuEmLaAI.BusinessObjects.RequestModels.HttpLog;

/// <summary>
/// Data transfer object to capture request details before HttpContext is disposed.
/// This prevents ObjectDisposedException when logging asynchronously.
/// </summary>
public class HttpRequestLogData
{
    public DateTime RequestTime { get; set; }
    
    public string Method { get; set; } = string.Empty;
    
    public string Path { get; set; } = string.Empty;
    
    public string QueryString { get; set; } = string.Empty;
    
    public int? UserId { get; set; }
    
    public string IpAddress { get; set; } = string.Empty;
    
    public string UserAgent { get; set; } = string.Empty;
    
    public int StatusCode { get; set; }
    
    public long? ResponseSizeBytes { get; set; }
    
    public long? RequestSizeBytes { get; set; }
    
    public double ElapsedMilliseconds { get; set; }
    
    public string Controller { get; set; } = string.Empty;
    
    public string Action { get; set; } = string.Empty;
    
    public string? RequestBody { get; set; }
    
    public string? ResponseBody { get; set; }
    
    public string? ErrorMessage { get; set; }
}
