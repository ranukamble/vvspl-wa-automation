import Map "mo:core/Map";

module {
  type OldActor = {};

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

  type AppSettings = {
    dailyLimit : Nat;
    delaySeconds : Nat;
    activeHoursStart : Text;
    activeHoursEnd : Text;
    warmupMode : Bool;
  };

  type NewActor = {
    clients : Map.Map<Text, WaClient>;
    qrCodes : Map.Map<Text, Text>;
    contactLists : Map.Map<Text, ContactList>;
    contacts : Map.Map<Text, Contact>;
    campaigns : Map.Map<Text, Campaign>;
    messageLogs : Map.Map<Text, MessageLog>;
    appSettings : { var value : ?AppSettings };
    counters : { var nextId : Nat };
  };

  public func migration(_ : OldActor) : NewActor {
    {
      clients = Map.empty<Text, WaClient>();
      qrCodes = Map.empty<Text, Text>();
      contactLists = Map.empty<Text, ContactList>();
      contacts = Map.empty<Text, Contact>();
      campaigns = Map.empty<Text, Campaign>();
      messageLogs = Map.empty<Text, MessageLog>();
      appSettings = { var value = null };
      counters = { var nextId = 0 };
    };
  };
};
