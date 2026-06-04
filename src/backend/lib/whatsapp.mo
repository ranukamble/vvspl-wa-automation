import Array "mo:core/Array";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Types "../types/whatsapp";
import Order "mo:core/Order";

module {

  // Helper: simulated phone from seed
  func simPhone(seed : Nat) : Text {
    "628" # (120000000 + seed % 90000000).toText();
  };

  // date string YYYY-MM-DD from Int nanoseconds
  func dateOf(ts : Int) : Text {
    let days = Int.abs(ts / 1_000_000_000 / 86400);
    var n = days;
    let c400 = n / 146097; n -= c400 * 146097;
    let c100 = Nat.min(n / 36524, 3); n -= c100 * 36524;
    let c4 = n / 1461; n -= c4 * 1461;
    let c1 = Nat.min(n / 365, 3); n -= c1 * 365;
    let year = c400 * 400 + c100 * 100 + c4 * 4 + c1 + 1970;
    let leap = (year % 4 == 0 and year % 100 != 0) or year % 400 == 0;
    let md : [Nat] = if leap { [31,29,31,30,31,30,31,31,30,31,30,31] }
                    else     { [31,28,31,30,31,30,31,31,30,31,30,31] };
    var doy = n + 1;
    var month = 1;
    var mi = 0;
    while (mi < 12 and doy > md[mi]) { doy -= md[mi]; month += 1; mi += 1 };
    let p = func(x : Nat) : Text { if (x < 10) "0" # x.toText() else x.toText() };
    year.toText() # "-" # p(month) # "-" # p(doy);
  };

  func statusText(s : Types.MessageStatus) : Text {
    switch s { case (#queued) "queued"; case (#sent) "sent"; case (#failed) "failed" };
  };

  func matchStatus(s : Types.MessageStatus, f : ?Text) : Bool {
    switch f { case null true; case (?t) statusText(s) == t };
  };

  func matchCampaign(cid : Text, f : ?Text) : Bool {
    switch f { case null true; case (?id) cid == id };
  };

  // WhatsApp Clients

  public func getClients(clients : [(Text, Types.WaClient)]) : [Types.WaClient] {
    clients.map(func(pair : (Text, Types.WaClient)) : Types.WaClient { pair.1 });
  };

  public func connectClient(
    clients : [(Text, Types.WaClient)],
    clientId : Text,
  ) : Types.WaClient {
    let found = clients.find(func(pair : (Text, Types.WaClient)) : Bool { pair.0 == clientId });
    switch found {
      case (?(_, c)) {
        if (c.status == #connected) { c }
        else {
          { id = c.id; phone = null; status = #connecting;
            connectedAt = null; displayName = c.displayName };
        };
      };
      case null {
        { id = clientId; phone = null; status = #connecting;
          connectedAt = null; displayName = "Client " # clientId };
      };
    };
  };

  public func disconnectClient(
    clients : [(Text, Types.WaClient)],
    clientId : Text,
  ) : Types.WaClient {
    let found = clients.find(func(pair : (Text, Types.WaClient)) : Bool { pair.0 == clientId });
    switch found {
      case (?(_, c)) {
        { id = c.id; phone = c.phone; status = #disconnected;
          connectedAt = null; displayName = c.displayName };
      };
      case null {
        { id = clientId; phone = null; status = #disconnected;
          connectedAt = null; displayName = "Client " # clientId };
      };
    };
  };

  public func getClientQr(qrCodes : [(Text, Text)], clientId : Text) : ?Text {
    let found = qrCodes.find(func(pair : (Text, Text)) : Bool { pair.0 == clientId });
    switch found { case (?(_, qr)) ?qr; case null null };
  };

  public func finalizeConnect(
    clients : [(Text, Types.WaClient)],
    clientId : Text,
    seed : Nat,
  ) : Types.WaClient {
    let found = clients.find(func(pair : (Text, Types.WaClient)) : Bool { pair.0 == clientId });
    let phone = simPhone(seed);
    switch found {
      case (?(_, c)) {
        { id = c.id; phone = ?phone; status = #connected;
          connectedAt = ?Time.now(); displayName = c.displayName };
      };
      case null {
        { id = clientId; phone = ?phone; status = #connected;
          connectedAt = ?Time.now(); displayName = "Client " # clientId };
      };
    };
  };

  // Contact Lists

  public func getContactLists(lists : [(Text, Types.ContactList)]) : [Types.ContactList] {
    let arr = lists.map(func(pair : (Text, Types.ContactList)) : Types.ContactList { pair.1 });
    arr.sort(func(a : Types.ContactList, b : Types.ContactList) : Order.Order { Int.compare(a.createdAt, b.createdAt) });
  };

  public func createContactList(
    lists : [(Text, Types.ContactList)],
    name : Text,
    description : Text,
    nextId : Nat,
  ) : Types.ContactList {
    ignore lists;
    { id = "cl_" # nextId.toText(); name; description;
      contactCount = 0; createdAt = Time.now() };
  };

  public func deleteContactList(lists : [(Text, Types.ContactList)], id : Text) : Bool {
    let found = lists.find(func(pair : (Text, Types.ContactList)) : Bool { pair.0 == id });
    switch found { case (?(_, _)) true; case null false };
  };

  public func getContacts(contacts : [(Text, Types.Contact)], listId : Text) : [Types.Contact] {
    let filtered = contacts.filter(func(pair : (Text, Types.Contact)) : Bool { pair.1.listId == listId });
    let arr = filtered.map(func(pair : (Text, Types.Contact)) : Types.Contact { pair.1 });
    arr.sort(func(a : Types.Contact, b : Types.Contact) : Order.Order { Int.compare(a.createdAt, b.createdAt) });
  };

  func cleanPhone(raw : Text) : ?Text {
    let s = switch (raw.stripStart(#char '+')) { case (?t) t; case null raw };
    let digitCount = s.foldLeft(0 : Nat, func(acc : Nat, ch : Char) : Nat {
      if (ch >= '0' and ch <= '9') acc + 1 else acc;
    });
    if (digitCount >= 10 and digitCount <= 15) ?s else null;
  };

  public func addContact(
    contacts : [(Text, Types.Contact)],
    listId : Text,
    name : Text,
    phone : Text,
    nextId : Nat,
  ) : ?Types.Contact {
    ignore contacts;
    switch (cleanPhone(phone)) {
      case null null;
      case (?p) {
        ?{ id = "c_" # nextId.toText(); listId; name; phone = p; createdAt = Time.now() };
      };
    };
  };

  public func deleteContact(contacts : [(Text, Types.Contact)], id : Text) : Bool {
    let found = contacts.find(func(pair : (Text, Types.Contact)) : Bool { pair.0 == id });
    switch found { case (?(_, _)) true; case null false };
  };

  public func buildImportContacts(
    listId : Text,
    items : [Types.ContactImportItem],
    startId : Nat,
    now : Int,
  ) : [Types.Contact] {
    var idx = startId;
    items.filterMap(func(item : Types.ContactImportItem) : ?Types.Contact {
      switch (cleanPhone(item.phone)) {
        case null null;
        case (?p) {
          let c : Types.Contact = {
            id = "c_" # idx.toText();
            listId; name = item.name; phone = p; createdAt = now;
          };
          idx += 1;
          ?c;
        };
      };
    });
  };

  // Campaigns

  public func getCampaigns(campaigns : [(Text, Types.Campaign)]) : [Types.Campaign] {
    let arr = campaigns.map(func(pair : (Text, Types.Campaign)) : Types.Campaign { pair.1 });
    arr.sort(func(a : Types.Campaign, b : Types.Campaign) : Order.Order { Int.compare(a.createdAt, b.createdAt) });
  };

  public func createCampaign(
    campaigns : [(Text, Types.Campaign)],
    name : Text,
    listId : Text,
    message : Text,
    mediaUrl : ?Text,
    delaySeconds : Nat,
    scheduledAt : ?Int,
    totalContacts : Nat,
    nextId : Nat,
  ) : Types.Campaign {
    ignore campaigns;
    { id = "cmp_" # nextId.toText(); name; listId; message; mediaUrl;
      delaySeconds; scheduledAt; status = #draft; progress = 0;
      totalContacts; sentCount = 0; failedCount = 0; createdAt = Time.now() };
  };

  public func executeCampaign(
    campaigns : [(Text, Types.Campaign)],
    id : Text,
  ) : ?Types.Campaign {
    let found = campaigns.find(func(pair : (Text, Types.Campaign)) : Bool { pair.0 == id });
    switch found {
      case null null;
      case (?(_, c)) {
        if (c.status == #draft or c.status == #scheduled or c.status == #paused) {
          let updated : Types.Campaign = {
            id = c.id; name = c.name; listId = c.listId; message = c.message;
            mediaUrl = c.mediaUrl; delaySeconds = c.delaySeconds; scheduledAt = c.scheduledAt;
            status = #running; progress = c.progress; totalContacts = c.totalContacts;
            sentCount = c.sentCount; failedCount = c.failedCount; createdAt = c.createdAt;
          };
          ?updated;
        } else ?c;
      };
    };
  };

  public func pauseCampaign(
    campaigns : [(Text, Types.Campaign)],
    id : Text,
  ) : ?Types.Campaign {
    let found = campaigns.find(func(pair : (Text, Types.Campaign)) : Bool { pair.0 == id });
    switch found {
      case null null;
      case (?(_, c)) {
        if (c.status == #running) {
          let updated : Types.Campaign = {
            id = c.id; name = c.name; listId = c.listId; message = c.message;
            mediaUrl = c.mediaUrl; delaySeconds = c.delaySeconds; scheduledAt = c.scheduledAt;
            status = #paused; progress = c.progress; totalContacts = c.totalContacts;
            sentCount = c.sentCount; failedCount = c.failedCount; createdAt = c.createdAt;
          };
          ?updated;
        } else ?c;
      };
    };
  };

  public func cancelCampaign(
    campaigns : [(Text, Types.Campaign)],
    id : Text,
  ) : ?Types.Campaign {
    let found = campaigns.find(func(pair : (Text, Types.Campaign)) : Bool { pair.0 == id });
    switch found {
      case null null;
      case (?(_, c)) {
        if (c.status != #completed and c.status != #cancelled) {
          let updated : Types.Campaign = {
            id = c.id; name = c.name; listId = c.listId; message = c.message;
            mediaUrl = c.mediaUrl; delaySeconds = c.delaySeconds; scheduledAt = c.scheduledAt;
            status = #cancelled; progress = c.progress; totalContacts = c.totalContacts;
            sentCount = c.sentCount; failedCount = c.failedCount; createdAt = c.createdAt;
          };
          ?updated;
        } else ?c;
      };
    };
  };

  public func deleteCampaign(campaigns : [(Text, Types.Campaign)], id : Text) : Bool {
    let found = campaigns.find(func(pair : (Text, Types.Campaign)) : Bool { pair.0 == id });
    switch found { case (?(_, _)) true; case null false };
  };

  public func tickCampaignProgress(
    campaigns : [(Text, Types.Campaign)],
    id : Text,
    logId : Nat,
  ) : ?(Types.Campaign, ?Types.MessageLog) {
    let found = campaigns.find(func(pair : (Text, Types.Campaign)) : Bool { pair.0 == id });
    switch found {
      case null null;
      case (?(_, c)) {
        if (c.status != #running) return ?(c, null);
        let newSent = c.sentCount + 1;
        let progress = if (c.totalContacts == 0) 100
                       else (newSent * 100) / c.totalContacts;
        let isComplete = newSent >= c.totalContacts;
        let newStatus : Types.CampaignStatus = if isComplete #completed else #running;
        let updated : Types.Campaign = {
          id = c.id; name = c.name; listId = c.listId; message = c.message;
          mediaUrl = c.mediaUrl; delaySeconds = c.delaySeconds; scheduledAt = c.scheduledAt;
          status = newStatus; progress = Nat.min(progress, 100); totalContacts = c.totalContacts;
          sentCount = newSent; failedCount = c.failedCount; createdAt = c.createdAt;
        };
        let log : Types.MessageLog = {
          id = "ml_" # logId.toText();
          campaignId = c.id;
          contactId = "c_" # newSent.toText();
          contactName = "Contact " # newSent.toText();
          contactPhone = simPhone(newSent);
          status = #sent; errorMsg = null; timestamp = Time.now();
        };
        ?(updated, ?log);
      };
    };
  };

  // Message Logs

  public func getMessageLogs(
    logs : [(Text, Types.MessageLog)],
    campaignId : ?Text,
    status : ?Text,
    limit : Nat,
    offset : Nat,
  ) : [Types.MessageLog] {
    let filtered = logs.filter(func(pair : (Text, Types.MessageLog)) : Bool {
      matchCampaign(pair.1.campaignId, campaignId) and matchStatus(pair.1.status, status);
    });
    let sorted = filtered.sort(func(p1 : (Text, Types.MessageLog), p2 : (Text, Types.MessageLog)) : Order.Order {
      Int.compare(p2.1.timestamp, p1.1.timestamp);
    });
    let all = sorted.map(func(pair : (Text, Types.MessageLog)) : Types.MessageLog { pair.1 });
    let total = all.size();
    if (offset >= total) return [];
    let endIdx = Nat.min(offset + limit, total);
    all.sliceToArray(offset.toInt(), endIdx.toInt());
  };

  public func getMessageLogCount(
    logs : [(Text, Types.MessageLog)],
    campaignId : ?Text,
    status : ?Text,
  ) : Nat {
    logs.filter(func(pair : (Text, Types.MessageLog)) : Bool {
      matchCampaign(pair.1.campaignId, campaignId) and matchStatus(pair.1.status, status);
    }).size();
  };

  // Dashboard

  public func getDashboardSummary(
    clients : [(Text, Types.WaClient)],
    contacts : [(Text, Types.Contact)],
    campaigns : [(Text, Types.Campaign)],
    logs : [(Text, Types.MessageLog)],
  ) : Types.DashboardSummary {
    let connectedClients = clients.filter(func(pair : (Text, Types.WaClient)) : Bool {
      pair.1.status == #connected;
    }).size();
    let totalContacts = contacts.size();
    let activeCampaigns = campaigns.filter(func(pair : (Text, Types.Campaign)) : Bool {
      pair.1.status == #running or pair.1.status == #paused;
    }).size();
    let todayDate = dateOf(Time.now());
    let messagesToday = logs.filter(func(pair : (Text, Types.MessageLog)) : Bool {
      pair.1.status == #sent and dateOf(pair.1.timestamp) == todayDate;
    }).size();
    { totalContacts; activeCampaigns; messagesToday; connectedClients };
  };

  // Analytics

  public func getAnalyticsData(
    logs : [(Text, Types.MessageLog)],
    campaigns : [(Text, Types.Campaign)],
    contacts : [(Text, Types.Contact)],
  ) : Types.AnalyticsData {
    let nowNs = Time.now();
    let dayNs : Int = 86_400_000_000_000;

    let dailyMessages = Array.tabulate(30, func(i : Nat) : Types.DailyMessageStat {
      let dayOffset : Int = (29 - i).toInt();
      let dayStart = nowNs - dayNs * dayOffset;
      let dayEnd = dayStart + dayNs;
      let count = logs.filter(func(pair : (Text, Types.MessageLog)) : Bool {
        pair.1.status == #sent and pair.1.timestamp >= dayStart and pair.1.timestamp < dayEnd;
      }).size();
      { date = dateOf(dayStart); count };
    });

    let campaignPerformance = campaigns.map(func(pair : (Text, Types.Campaign)) : Types.CampaignPerformanceStat {
      { campaignName = pair.1.name; sent = pair.1.sentCount; failed = pair.1.failedCount };
    });

    let contactsGrowth = Array.tabulate(30, func(i : Nat) : Types.ContactsGrowthStat {
      let dayOffset : Int = (29 - i).toInt();
      let dayEnd = nowNs - dayNs * dayOffset + dayNs;
      let count = contacts.filter(func(pair : (Text, Types.Contact)) : Bool {
        pair.1.createdAt < dayEnd;
      }).size();
      { date = dateOf(nowNs - dayNs * dayOffset); total = count };
    });

    { dailyMessages; campaignPerformance; contactsGrowth };
  };

  // Settings

  func defaultSettings() : Types.AppSettings {
    { dailyLimit = 100; delaySeconds = 5;
      activeHoursStart = "09:00"; activeHoursEnd = "21:00"; warmupMode = false;
      nodeBackendUrl = "" };
  };

  public func getSettings(settings : ?Types.AppSettings) : Types.AppSettings {
    switch settings { case (?s) s; case null defaultSettings() };
  };

  public func updateSettings(
    settings : ?Types.AppSettings,
    newSettings : Types.AppSettings,
  ) : Types.AppSettings {
    ignore settings; newSettings;
  };

  // Groups

  public func extractGroupMembers(groupId : Text) : [Types.GroupMember] {
    let count = 10 + (groupId.size() % 11);
    Array.tabulate(count, func(i : Nat) : Types.GroupMember {
      { name = "Member " # (i + 1).toText(); phone = simPhone(groupId.size() * 100 + i) };
    });
  };
};
