using System;
using System.Collections.Generic;

namespace GuEmLaAI.BusinessObjects.Models;

public partial class HttpRequestLog
{
    public int Id { get; set; }

    public DateTime RequestTime { get; set; }

    public string Method { get; set; } = null!;

    public string Path { get; set; } = null!;

    public string? QueryString { get; set; }

    public int? UserId { get; set; }

    public string IpAddress { get; set; } = null!;

    public string? UserAgent { get; set; }

    public int StatusCode { get; set; }

    public long? ResponseSizeBytes { get; set; }

    public long? RequestSizeBytes { get; set; }

    public double ElapsedMilliseconds { get; set; }

    public string? Controller { get; set; }

    public string? Action { get; set; }

    public string? RequestBody { get; set; }

    public string? ResponseBody { get; set; }

    public string? ErrorMessage { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual User? User { get; set; }
}
