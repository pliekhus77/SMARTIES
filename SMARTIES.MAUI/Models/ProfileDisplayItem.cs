using CommunityToolkit.Mvvm.ComponentModel;

namespace SMARTIES.MAUI.Models;

public partial class ProfileDisplayItem : ObservableObject
{
    [ObservableProperty]
    private int id;

    [ObservableProperty]
    private string name = string.Empty;

    [ObservableProperty]
    private string avatarEmoji = "👤";

    [ObservableProperty]
    private string restrictionsSummary = string.Empty;

    [ObservableProperty]
    private DateTime lastUsedAt;

    [ObservableProperty]
    private int usageCount;

    [ObservableProperty]
    private bool isTemporary;

    [ObservableProperty]
    private bool isActive;

    public string LastUsedDisplay => LastUsedAt == default ? "Never" : 
        LastUsedAt.Date == DateTime.Today ? "Today" :
        LastUsedAt.Date == DateTime.Today.AddDays(-1) ? "Yesterday" :
        LastUsedAt.ToString("MMM dd");

    public string UsageDisplay => UsageCount == 0 ? "New" : $"{UsageCount} scans";

    public static ProfileDisplayItem FromUserProfile(UserProfile profile)
    {
        return new ProfileDisplayItem
        {
            Id = profile.Id,
            Name = profile.Name,
            AvatarEmoji = profile.AvatarEmoji,
            RestrictionsSummary = GenerateRestrictionsSummary(profile),
            LastUsedAt = profile.LastUsedAt,
            UsageCount = profile.UsageCount,
            IsTemporary = profile.IsTemporary,
            IsActive = profile.IsActive
        };
    }

    private static string GenerateRestrictionsSummary(UserProfile profile)
    {
        var restrictions = new List<string>();
        
        // Parse JSON strings and count restrictions
        if (!string.IsNullOrEmpty(profile.Allergies) && profile.Allergies != "[]")
            restrictions.Add("Allergies");
        if (!string.IsNullOrEmpty(profile.ReligiousRestrictions) && profile.ReligiousRestrictions != "[]")
            restrictions.Add("Religious");
        if (!string.IsNullOrEmpty(profile.MedicalRestrictions) && profile.MedicalRestrictions != "[]")
            restrictions.Add("Medical");
        if (!string.IsNullOrEmpty(profile.LifestylePreferences) && profile.LifestylePreferences != "[]")
            restrictions.Add("Lifestyle");

        return restrictions.Count == 0 ? "No restrictions" : string.Join(", ", restrictions);
    }
}
