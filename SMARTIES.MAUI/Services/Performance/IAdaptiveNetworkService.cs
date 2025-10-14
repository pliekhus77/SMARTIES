namespace SMARTIES.MAUI.Services.Performance;

public enum NetworkQuality
{
    Poor,
    Fair,
    Good,
    Excellent
}

public interface IAdaptiveNetworkService
{
    Task<NetworkQuality> AssessNetworkQualityAsync();
    Task<TimeSpan> GetAdaptiveTimeoutAsync();
    Task QueueRequestAsync(Func<Task> request, int priority = 0);
    Task ProcessQueuedRequestsAsync();
}

public class AdaptiveNetworkService : IAdaptiveNetworkService
{
    private readonly Queue<QueuedRequest> _requestQueue = new();
    private NetworkQuality _currentQuality = NetworkQuality.Good;
    private readonly Dictionary<NetworkQuality, TimeSpan> _timeouts = new()
    {
        { NetworkQuality.Poor, TimeSpan.FromSeconds(30) },
        { NetworkQuality.Fair, TimeSpan.FromSeconds(15) },
        { NetworkQuality.Good, TimeSpan.FromSeconds(10) },
        { NetworkQuality.Excellent, TimeSpan.FromSeconds(5) }
    };

    public async Task<NetworkQuality> AssessNetworkQualityAsync()
    {
        try
        {
            var connectivity = Connectivity.NetworkAccess;
            if (connectivity != NetworkAccess.Internet)
            {
                _currentQuality = NetworkQuality.Poor;
                return _currentQuality;
            }

            // Simulate network quality assessment
            var profiles = Connectivity.ConnectionProfiles;
            if (profiles.Contains(ConnectionProfile.WiFi))
            {
                _currentQuality = NetworkQuality.Excellent;
            }
            else if (profiles.Contains(ConnectionProfile.Cellular))
            {
                _currentQuality = NetworkQuality.Good;
            }
            else
            {
                _currentQuality = NetworkQuality.Fair;
            }

            return _currentQuality;
        }
        catch
        {
            _currentQuality = NetworkQuality.Poor;
            return _currentQuality;
        }
    }

    public Task<TimeSpan> GetAdaptiveTimeoutAsync()
    {
        return Task.FromResult(_timeouts[_currentQuality]);
    }

    public Task QueueRequestAsync(Func<Task> request, int priority = 0)
    {
        _requestQueue.Enqueue(new QueuedRequest { Request = request, Priority = priority });
        return Task.CompletedTask;
    }

    public async Task ProcessQueuedRequestsAsync()
    {
        var quality = await AssessNetworkQualityAsync();
        
        if (quality == NetworkQuality.Poor)
        {
            // Process only high priority requests
            await ProcessHighPriorityRequestsAsync();
        }
        else
        {
            // Process all queued requests
            await ProcessAllRequestsAsync();
        }
    }

    private async Task ProcessHighPriorityRequestsAsync()
    {
        var highPriorityRequests = new Queue<QueuedRequest>();
        
        while (_requestQueue.Count > 0)
        {
            var request = _requestQueue.Dequeue();
            if (request.Priority > 0)
            {
                highPriorityRequests.Enqueue(request);
            }
        }

        while (highPriorityRequests.Count > 0)
        {
            var request = highPriorityRequests.Dequeue();
            await request.Request();
        }
    }

    private async Task ProcessAllRequestsAsync()
    {
        while (_requestQueue.Count > 0)
        {
            var request = _requestQueue.Dequeue();
            await request.Request();
        }
    }

    private class QueuedRequest
    {
        public Func<Task> Request { get; set; } = null!;
        public int Priority { get; set; }
    }
}
