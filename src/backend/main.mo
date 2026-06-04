import Map "mo:core/Map";
import Types "types/whatsapp";
import WhatsAppMixin "mixins/whatsapp-api";

actor {
  let clients : Map.Map<Text, Types.WaClient>;
  let qrCodes : Map.Map<Text, Text>;
  let contactLists : Map.Map<Text, Types.ContactList>;
  let contacts : Map.Map<Text, Types.Contact>;
  let campaigns : Map.Map<Text, Types.Campaign>;
  let messageLogs : Map.Map<Text, Types.MessageLog>;
  let appSettings : { var value : ?Types.AppSettings };
  let counters : { var nextId : Nat };

  include WhatsAppMixin(clients, qrCodes, contactLists, contacts, campaigns, messageLogs, appSettings, counters);
};

