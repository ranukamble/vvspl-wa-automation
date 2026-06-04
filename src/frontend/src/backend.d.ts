import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface GroupMember {
    name: string;
    phone: string;
}
export interface Contact {
    id: string;
    name: string;
    createdAt: bigint;
    phone: string;
    listId: string;
}
export interface MessageLog {
    id: string;
    status: MessageStatus;
    contactName: string;
    campaignId: string;
    timestamp: bigint;
    contactId: string;
    errorMsg?: string;
    contactPhone: string;
}
export interface DashboardSummary {
    activeCampaigns: bigint;
    totalContacts: bigint;
    connectedClients: bigint;
    messagesToday: bigint;
}
export interface AppSettings {
    activeHoursEnd: string;
    activeHoursStart: string;
    nodeBackendUrl: string;
    dailyLimit: bigint;
    delaySeconds: bigint;
    warmupMode: boolean;
}
export interface ContactsGrowthStat {
    total: bigint;
    date: string;
}
export interface ContactList {
    id: string;
    name: string;
    createdAt: bigint;
    description: string;
    contactCount: bigint;
}
export interface CampaignPerformanceStat {
    sent: bigint;
    campaignName: string;
    failed: bigint;
}
export interface WaClient {
    id: string;
    status: WaClientStatus;
    displayName: string;
    connectedAt?: bigint;
    phone?: string;
}
export interface Campaign {
    id: string;
    status: CampaignStatus;
    failedCount: bigint;
    name: string;
    createdAt: bigint;
    totalContacts: bigint;
    sentCount: bigint;
    mediaUrl?: string;
    progress: bigint;
    message: string;
    delaySeconds: bigint;
    listId: string;
    scheduledAt?: bigint;
}
export interface DailyMessageStat {
    date: string;
    count: bigint;
}
export interface AnalyticsData {
    contactsGrowth: Array<ContactsGrowthStat>;
    dailyMessages: Array<DailyMessageStat>;
    campaignPerformance: Array<CampaignPerformanceStat>;
}
export enum CampaignStatus {
    scheduled = "scheduled",
    cancelled = "cancelled",
    completed = "completed",
    draft = "draft",
    failed = "failed",
    running = "running",
    paused = "paused"
}
export enum MessageStatus {
    sent = "sent",
    queued = "queued",
    failed = "failed"
}
export enum WaClientStatus {
    disconnected = "disconnected",
    connected = "connected",
    connecting = "connecting"
}
export interface backendInterface {
    addContact(listId: string, name: string, phone: string): Promise<Contact>;
    cancelCampaign(id: string): Promise<Campaign>;
    connectClient(clientId: string): Promise<WaClient>;
    createCampaign(name: string, listId: string, message: string, mediaUrl: string | null, delaySeconds: bigint, scheduledAt: bigint | null): Promise<Campaign>;
    createContactList(name: string, description: string): Promise<ContactList>;
    deleteCampaign(id: string): Promise<boolean>;
    deleteContact(id: string): Promise<boolean>;
    deleteContactList(id: string): Promise<boolean>;
    disconnectClient(clientId: string): Promise<WaClient>;
    executeCampaign(id: string): Promise<Campaign>;
    extractGroupMembers(groupId: string): Promise<Array<GroupMember>>;
    getAnalyticsData(): Promise<AnalyticsData>;
    getCampaigns(): Promise<Array<Campaign>>;
    getClientQr(clientId: string): Promise<string | null>;
    getClients(): Promise<Array<WaClient>>;
    getContactLists(): Promise<Array<ContactList>>;
    getContacts(listId: string): Promise<Array<Contact>>;
    getDashboardSummary(): Promise<DashboardSummary>;
    getMessageLogCount(campaignId: string | null, status: string | null): Promise<bigint>;
    getMessageLogs(campaignId: string | null, status: string | null, limit: bigint, offset: bigint): Promise<Array<MessageLog>>;
    getSettings(): Promise<AppSettings>;
    importContacts(listId: string, items: Array<{
        name: string;
        phone: string;
    }>): Promise<bigint>;
    pauseCampaign(id: string): Promise<Campaign>;
    tickCampaignProgress(id: string): Promise<Campaign>;
    updateSettings(settings: AppSettings): Promise<AppSettings>;
}
