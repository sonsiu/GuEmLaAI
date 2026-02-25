using Amazon.Runtime;
using Amazon.S3;
using GuEmLaAI.BusinessObjects.Models;
using GuEmLaAI.Extensions;
using GuEmLaAI.Helper;
using GuEmLaAI.Hubs;
using GuEmLaAI.Middleware;
using GuEmLaAI.Services;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// Add CORS configuration - Allow all origins
builder.Services.AddCors(options =>
{
    options.AddPolicy(name: "AllowFrontend",
        policy =>
        {
            policy
                .WithOrigins(
                    "http://localhost:3000",
                    "http://localhost:9977",  
                    "https://guemlaai.site"     
                )
                .AllowAnyHeader()          
                .AllowAnyMethod()          
                .AllowCredentials(); 

        });
});

// Add SignalR for real-time notifications
builder.Services.AddSignalR();

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGenWithAuth();
builder.Services.AddHttpClient<GeminiHelper>();
builder.Services.AddHttpClient<FashnHelper>();
builder.Services.AddHttpClient<ReplicateService>();
builder.Services.AddMemoryCache();

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });

//add Database
builder.Services.AddDbContext<GuEmLaAiContext>(options =>
    options.UseMySql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        new MySqlServerVersion(new Version(8, 0, 33)) // Replace with your MySQL version
       ));

// Configure AWS S3 client
var accessKey = builder.Configuration["Wasabi:AccessKey"];
var secretKey = builder.Configuration["Wasabi:SecretKey"];
var credentials = new BasicAWSCredentials(accessKey, secretKey);

builder.Services.AddSingleton<IAmazonS3>(sp => new AmazonS3Client(
    credentials,
    new AmazonS3Config
    {
        ServiceURL = "https://s3.ap-southeast-1.wasabisys.com",
        ForcePathStyle = true,
        UseHttp = false
    }
));

builder.Services.AddAuthorization();
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddCookie()
    .AddGoogle(opt =>
    {
        var clientId = builder.Configuration["Authentication:Google:ClientId"];
        if (clientId == null)
        {
            throw new ArgumentNullException(nameof(clientId));
        }

        var clientSecret = builder.Configuration["Authentication:Google:ClientSecret"];
        if (clientSecret == null)
        {
            throw new ArgumentNullException(nameof(clientSecret));
        }

        opt.ClientId = clientId;
        opt.ClientSecret = clientSecret;
        opt.SignInScheme = CookieAuthenticationDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(o =>
    {
        o.RequireHttpsMetadata = false;
        o.TokenValidationParameters = new TokenValidationParameters
        {
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Secret"]!)),
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            ClockSkew = TimeSpan.Zero,
        };

        // Allow SignalR to authenticate via query string (for WebSocket connections)
        o.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;

                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs/notifications"))
                {
                    context.Token = accessToken;
                }

                return Task.CompletedTask;
            }
        };
    });

// Add profile to AutoMapper
builder.Services.AddAutoMapper(typeof(Services.Mapper.MappingProfile));

//add FluentEmail service
builder.Services.AddFluentEmailServices(builder.Configuration);

builder.Services.AddScoped<WasabiS3Service>();
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<AuthenService>();
builder.Services.AddScoped<EmailService>();
builder.Services.AddScoped<PaymentService>();
builder.Services.AddScoped<CreditService>();
builder.Services.AddScoped<ItemService>();
builder.Services.AddScoped<OutfitService>();
builder.Services.AddScoped<ReferralService>();
builder.Services.AddScoped<CollectionService>();
builder.Services.AddScoped<NotificationService>();  // Add NotificationService
builder.Services.AddHttpClient<AccuWeatherService>();
builder.Services.AddScoped<AccuWeatherService>();
builder.Services.AddScoped<CalendarService>();
builder.Services.AddScoped<AnalyticsService>();
builder.Services.AddScoped<PublicCollectionService>();
builder.Services.AddScoped<OutfitSuggestService>();
builder.Services.AddScoped<HttpRequestLoggingService>();
builder.Services.AddHttpContextAccessor();

// Add Distributed Memory Cache for OAuth state storage (CSRF protection)
builder.Services.AddDistributedMemoryCache();
builder.Services.AddScoped<OAuthStateService>();

// Add the Midnight Calendar Check Service
builder.Services.AddHostedService<CalendarCheckService>();

// Add the Scheduled Task Service (for resetting daily counts at midnight UTC+7)
builder.Services.AddHostedService<ScheduledTaskService>();

// Add the HTTP Request Log Cleanup Service (runs daily to prevent database bloat)
builder.Services.AddHostedService<HttpRequestLogCleanupService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Use single CORS policy
app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.UseMiddleware<HttpRequestLoggingMiddleware>();

app.MapControllers();

// Map SignalR Hub
app.MapHub<NotificationHub>("/hubs/notifications");

app.Run();
