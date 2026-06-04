import Map "mo:core/Map";

module {
  type WaClientStatus = { #connected; #disconnected; #connecting };

  type WaClient = {
    id : Text;
    phone : ?Text;
    status : WaClientStatus;
    connectedAt : ?Int;
    displayName : Text;
  };

  type ContactList = {
    id : Text;
    name : Text;
    description : Text;
    contactCount : Nat;
    createdAt : Int;
  };

  type Contact = {
    id : Text;
    listId : Text;
    name : Text;
    phone : Text;
    createdAt : Int;
  };

  type CampaignStatus = {
    #draft;
    #scheduled;
    #running;
    #paused;
    #completed;
    #failed;
    #cancelled;
  };

  type Campaign = {
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

  type MessageStatus = { #queued; #sent; #failed };

  type MessageLog = {
    id : Text;
    campaignId : Text;
    contactId : Text;
    contactName : Text;
    contactPhone : Text;
    status : MessageStatus;
    errorMsg : ?Text;
    timestamp : Int;
  };

  type OldAppSettings = {
    dailyLimit : Nat;
    delaySeconds : Nat;
    activeHoursStart : Text;
    activeHoursEnd : Text;
    warmupMode : Bool;
  };

  type NewAppSettings = {
    dailyLimit : Nat;
    delaySeconds : Nat;
    activeHoursStart : Text;
    activeHoursEnd : Text;
    warmupMode : Bool;
    nodeBackendUrl : Text;
  };

  type OldActor = {
    clients : Map.Map<Text, WaClient>;
    qrCodes : Map.Map<Text, Text>;
    contactLists : Map.Map<Text, ContactList>;
    contacts : Map.Map<Text, Contact>;
    campaigns : Map.Map<Text, Campaign>;
    messageLogs : Map.Map<Text, MessageLog>;
    appSettings : { var value : ?OldAppSettings };
    counters : { var nextId : Nat };
  };

  type NewActor = {
    clients : Map.Map<Text, WaClient>;
    qrCodes : Map.Map<Text, Text>;
    contactLists : Map.Map<Text, ContactList>;
    contacts : Map.Map<Text, Contact>;
    campaigns : Map.Map<Text, Campaign>;
    messageLogs : Map.Map<Text, MessageLog>;
    appSettings : { var value : ?NewAppSettings };
    counters : { var nextId : Nat };
  };

  public func migration(old : OldActor) : NewActor {
    let newSettings : ?NewAppSettings = switch (old.appSettings.value) {
      case null null;
      case (?s) ?({
        dailyLimit = s.dailyLimit;
        delaySeconds = s.delaySeconds;
        activeHoursStart = s.activeHoursStart;
        activeHoursEnd = s.activeHoursEnd;
        warmupMode = s.warmupMode;
        nodeBackendUrl = "";
      });
    };
    {
      clients = old.clients;
      qrCodes = old.qrCodes;
      contactLists = old.contactLists;
      contacts = old.contacts;
      campaigns = old.campaigns;
      messageLogs = old.messageLogs;
      appSettings = { var value = newSettings };
      counters = old.counters;
    };
  };
};
