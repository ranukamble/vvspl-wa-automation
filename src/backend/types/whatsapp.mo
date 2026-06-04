module {
  // WhatsApp Client
  public type WaClientStatus = { #connected; #disconnected; #connecting };

  public type WaClient = {
    id : Text;
    phone : ?Text;
    status : WaClientStatus;
    connectedAt : ?Int;
    displayName : Text;
  };

  // Contact Lists & Contacts
  public type ContactList = {
    id : Text;
    name : Text;
    description : Text;
    contactCount : Nat;
    createdAt : Int;
  };

  public type Contact = {
    id : Text;
    listId : Text;
    name : Text;
    phone : Text;
    createdAt : Int;
  };

  // Campaigns
  public type CampaignStatus = {
    #draft;
    #scheduled;
    #running;
    #paused;
    #completed;
    #failed;
    #cancelled;
  };

  public type Campaign = {
    id : Text;
    name : Text;
    listId : Text;
    message : Text;
    mediaUrl : ?Text;
    delaySeconds : Nat;
    scheduledAt : ?Int;
    status : CampaignStatus;
    progress : Nat;
    totalContacts : Nat;
    sentCount : Nat;
    failedCount : Nat;
    createdAt : Int;
  };

  // Message Logs
  public type MessageStatus = { #queued; #sent; #failed };

  public type MessageLog = {
    id : Text;
    campaignId : Text;
    contactId : Text;
    contactName : Text;
    contactPhone : Text;
    status : MessageStatus;
    errorMsg : ?Text;
    timestamp : Int;
  };

  // Dashboard & Analytics
  public type DashboardSummary = {
    totalContacts : Nat;
    activeCampaigns : Nat;
    messagesToday : Nat;
    connectedClients : Nat;
  };

  public type DailyMessageStat = { date : Text; count : Nat };
  public type CampaignPerformanceStat = { campaignName : Text; sent : Nat; failed : Nat };
  public type ContactsGrowthStat = { date : Text; total : Nat };

  public type AnalyticsData = {
    dailyMessages : [DailyMessageStat];
    campaignPerformance : [CampaignPerformanceStat];
    contactsGrowth : [ContactsGrowthStat];
  };

  // Settings
  public type AppSettings = {
    dailyLimit : Nat;
    delaySeconds : Nat;
    activeHoursStart : Text;
    activeHoursEnd : Text;
    warmupMode : Bool;
    nodeBackendUrl : Text;
  };

  // Groups
  public type GroupMember = { name : Text; phone : Text };

  // Import helper
  public type ContactImportItem = { name : Text; phone : Text };
};
