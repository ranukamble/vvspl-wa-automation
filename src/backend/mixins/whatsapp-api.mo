import Map "mo:core/Map";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Types "../types/whatsapp";
import Lib "../lib/whatsapp";

mixin (
  clients : Map.Map<Text, Types.WaClient>,
  qrCodes : Map.Map<Text, Text>,
  contactLists : Map.Map<Text, Types.ContactList>,
  contacts : Map.Map<Text, Types.Contact>,
  campaigns : Map.Map<Text, Types.Campaign>,
  messageLogs : Map.Map<Text, Types.MessageLog>,
  appSettings : { var value : ?Types.AppSettings },
  counters : { var nextId : Nat },
) {

  func nextId() : Nat {
    let id = counters.nextId;
    counters.nextId += 1;
    id;
  };

  // ── WhatsApp Clients ───────────────────────────────────────────────────────

  public query func getClients() : async [Types.WaClient] {
    Lib.getClients(clients.toArray());
  };

  public func connectClient(clientId : Text) : async Types.WaClient {
    let updated = Lib.connectClient(clients.toArray(), clientId);
    clients.add(clientId, updated);
    // Store a simulated QR code while connecting
    if (updated.status == #connecting) {
      qrCodes.add(clientId, "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==");
    };
    updated;
  };

  public func disconnectClient(clientId : Text) : async Types.WaClient {
    let updated = Lib.disconnectClient(clients.toArray(), clientId);
    clients.add(clientId, updated);
    qrCodes.remove(clientId);
    updated;
  };

  public query func getClientQr(clientId : Text) : async ?Text {
    Lib.getClientQr(qrCodes.toArray(), clientId);
  };

  // ── Contact Lists ──────────────────────────────────────────────────────────

  public query func getContactLists() : async [Types.ContactList] {
    Lib.getContactLists(contactLists.toArray());
  };

  public func createContactList(name : Text, description : Text) : async Types.ContactList {
    let newList = Lib.createContactList(contactLists.toArray(), name, description, nextId());
    contactLists.add(newList.id, newList);
    newList;
  };

  public func deleteContactList(id : Text) : async Bool {
    let found = Lib.deleteContactList(contactLists.toArray(), id);
    if (found) {
      contactLists.remove(id);
      // Cascade: remove all contacts in this list
      let toRemove = contacts.toArray();
      for ((k, c) in toRemove.values()) {
        if (c.listId == id) { contacts.remove(k) };
      };
    };
    found;
  };

  public query func getContacts(listId : Text) : async [Types.Contact] {
    Lib.getContacts(contacts.toArray(), listId);
  };

  public func addContact(listId : Text, name : Text, phone : Text) : async Types.Contact {
    switch (Lib.addContact(contacts.toArray(), listId, name, phone, nextId())) {
      case null Runtime.trap("Invalid phone number");
      case (?c) {
        contacts.add(c.id, c);
        // Update list's contactCount
        switch (contactLists.get(listId)) {
          case (?lst) {
            contactLists.add(listId, { lst with contactCount = lst.contactCount + 1 });
          };
          case null {};
        };
        c;
      };
    };
  };

  public func deleteContact(id : Text) : async Bool {
    let found = Lib.deleteContact(contacts.toArray(), id);
    if (found) {
      switch (contacts.get(id)) {
        case (?c) {
          contacts.remove(id);
          // Update list's contactCount
          switch (contactLists.get(c.listId)) {
            case (?lst) {
              let newCount = if (lst.contactCount > 0) { lst.contactCount - 1 } else { 0 };
              contactLists.add(c.listId, { lst with contactCount = newCount });
            };
            case null {};
          };
        };
        case null {};
      };
    };
    found;
  };

  public func importContacts(listId : Text, items : [{ name : Text; phone : Text }]) : async Nat {
    let startId = counters.nextId;
    let typedItems : [Types.ContactImportItem] = items;
    let newContacts = Lib.buildImportContacts(listId, typedItems, startId, Time.now());
    for (c in newContacts.values()) {
      contacts.add(c.id, c);
      counters.nextId += 1;
    };
    // Update list's contactCount
    let inserted = newContacts.size();
    switch (contactLists.get(listId)) {
      case (?lst) {
        contactLists.add(listId, { lst with contactCount = lst.contactCount + inserted });
      };
      case null {};
    };
    inserted;
  };

  // ── Campaigns ──────────────────────────────────────────────────────────────

  public query func getCampaigns() : async [Types.Campaign] {
    Lib.getCampaigns(campaigns.toArray());
  };

  public func createCampaign(
    name : Text,
    listId : Text,
    message : Text,
    mediaUrl : ?Text,
    delaySeconds : Nat,
    scheduledAt : ?Int,
  ) : async Types.Campaign {
    // Count contacts in list
    let contactCount = contacts.toArray()
      .filter(func(pair : (Text, Types.Contact)) : Bool { pair.1.listId == listId })
      .size();
    let newCampaign = Lib.createCampaign(
      campaigns.toArray(), name, listId, message, mediaUrl,
      delaySeconds, scheduledAt, contactCount, nextId(),
    );
    campaigns.add(newCampaign.id, newCampaign);
    newCampaign;
  };

  public func executeCampaign(id : Text) : async Types.Campaign {
    switch (Lib.executeCampaign(campaigns.toArray(), id)) {
      case null Runtime.trap("Campaign not found");
      case (?c) { campaigns.add(id, c); c };
    };
  };

  public func pauseCampaign(id : Text) : async Types.Campaign {
    switch (Lib.pauseCampaign(campaigns.toArray(), id)) {
      case null Runtime.trap("Campaign not found");
      case (?c) { campaigns.add(id, c); c };
    };
  };

  public func cancelCampaign(id : Text) : async Types.Campaign {
    switch (Lib.cancelCampaign(campaigns.toArray(), id)) {
      case null Runtime.trap("Campaign not found");
      case (?c) { campaigns.add(id, c); c };
    };
  };

  public func deleteCampaign(id : Text) : async Bool {
    let found = Lib.deleteCampaign(campaigns.toArray(), id);
    if (found) { campaigns.remove(id) };
    found;
  };

  public func tickCampaignProgress(id : Text) : async Types.Campaign {
    let logId = nextId();
    switch (Lib.tickCampaignProgress(campaigns.toArray(), id, logId)) {
      case null Runtime.trap("Campaign not found");
      case (?(updated, maybeLog)) {
        campaigns.add(id, updated);
        switch maybeLog {
          case (?log) { messageLogs.add(log.id, log) };
          case null {};
        };
        updated;
      };
    };
  };

  // ── Message Logs ───────────────────────────────────────────────────────────

  public query func getMessageLogs(campaignId : ?Text, status : ?Text, limit : Nat, offset : Nat) : async [Types.MessageLog] {
    Lib.getMessageLogs(messageLogs.toArray(), campaignId, status, limit, offset);
  };

  public query func getMessageLogCount(campaignId : ?Text, status : ?Text) : async Nat {
    Lib.getMessageLogCount(messageLogs.toArray(), campaignId, status);
  };

  // ── Dashboard ──────────────────────────────────────────────────────────────

  public query func getDashboardSummary() : async Types.DashboardSummary {
    Lib.getDashboardSummary(
      clients.toArray(),
      contacts.toArray(),
      campaigns.toArray(),
      messageLogs.toArray(),
    );
  };

  // ── Analytics ──────────────────────────────────────────────────────────────

  public query func getAnalyticsData() : async Types.AnalyticsData {
    Lib.getAnalyticsData(
      messageLogs.toArray(),
      campaigns.toArray(),
      contacts.toArray(),
    );
  };

  // ── Settings ───────────────────────────────────────────────────────────────

  public query func getSettings() : async Types.AppSettings {
    Lib.getSettings(appSettings.value);
  };

  public func updateSettings(settings : Types.AppSettings) : async Types.AppSettings {
    let updated = Lib.updateSettings(appSettings.value, settings);
    appSettings.value := ?updated;
    updated;
  };

  // ── Groups ─────────────────────────────────────────────────────────────────

  public query func extractGroupMembers(groupId : Text) : async [Types.GroupMember] {
    Lib.extractGroupMembers(groupId);
  };
};
