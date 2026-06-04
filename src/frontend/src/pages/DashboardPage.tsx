import { CampaignStatus, WaClientStatus } from "@/backend";
import { Layout } from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCampaigns,
  useClients,
  useDashboardSummary,
  useMessageLogs,
  usePolling,
} from "@/hooks/useBackend";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import {
  Megaphone,
  MessageSquare,
  Smartphone,
  TrendingUp,
  Users,
} from "lucide-react";

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent?: boolean;
}) {
  return (
    <Card
      className={cn(
        "border-border",
        accent && "border-primary/30 bg-primary/5",
      )}
    >
      <CardContent className="p-4 flex items-center gap-4">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            accent ? "bg-primary" : "bg-muted",
          )}
        >
          <Icon
            className={cn(
              "h-5 w-5",
              accent ? "text-primary-foreground" : "text-muted-foreground",
            )}
          />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-display font-bold text-foreground tabular-nums">
            {value}
          </p>
          <p className="text-xs text-muted-foreground truncate">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ClientStatusDot({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-2 w-2 rounded-full",
        status === WaClientStatus.connected
          ? "bg-primary animate-pulse"
          : status === WaClientStatus.connecting
            ? "bg-yellow-500 animate-pulse"
            : "bg-muted-foreground",
      )}
    />
  );
}

export default function DashboardPage() {
  const qc = useQueryClient();
  const { data: summary, isLoading: summaryLoading } = useDashboardSummary();
  const { data: clients = [], isLoading: clientsLoading } = useClients();
  const { data: campaigns = [] } = useCampaigns();
  const { data: recentLogs = [] } = useMessageLogs(null, null, 8n, 0n);

  usePolling(() => {
    qc.invalidateQueries({ queryKey: ["dashboardSummary"] });
    qc.invalidateQueries({ queryKey: ["clients"] });
    qc.invalidateQueries({ queryKey: ["campaigns"] });
    qc.invalidateQueries({ queryKey: ["messageLogs"] });
  }, 8000);

  const activeCampaigns = campaigns.filter(
    (c) => c.status === CampaignStatus.running,
  );

  return (
    <Layout>
      <div className="p-4 lg:p-6 space-y-6" data-ocid="dashboard.page">
        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryLoading ? (
            ["sk-stat-1", "sk-stat-2", "sk-stat-3", "sk-stat-4"].map((k) => (
              <Card key={k}>
                <CardContent className="p-4">
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <StatCard
                label="Total Contacts"
                value={Number(summary?.totalContacts ?? 0)}
                icon={Users}
              />
              <StatCard
                label="Messages Today"
                value={Number(summary?.messagesToday ?? 0)}
                icon={MessageSquare}
                accent
              />
              <StatCard
                label="Active Campaigns"
                value={Number(summary?.activeCampaigns ?? 0)}
                icon={Megaphone}
              />
              <StatCard
                label="Connected Clients"
                value={Number(summary?.connectedClients ?? 0)}
                icon={Smartphone}
              />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* WhatsApp Clients */}
          <Card data-ocid="dashboard.clients_card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-primary" />
                WhatsApp Clients
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {clientsLoading ? (
                ["sk-client-1", "sk-client-2", "sk-client-3"].map((k) => (
                  <Skeleton key={k} className="h-14 w-full" />
                ))
              ) : clients.length === 0 ? (
                <div
                  className="text-center py-6 text-muted-foreground text-sm"
                  data-ocid="dashboard.clients_card.empty_state"
                >
                  No clients configured yet
                </div>
              ) : (
                clients.map((client, idx) => (
                  <div
                    key={client.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border"
                    data-ocid={`dashboard.client.item.${idx + 1}`}
                  >
                    <ClientStatusDot status={client.status as string} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {client.displayName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {client.phone ?? "Not connected"}
                      </p>
                    </div>
                    <Badge
                      variant={
                        client.status === WaClientStatus.connected
                          ? "default"
                          : "secondary"
                      }
                      className={cn(
                        "text-xs capitalize",
                        client.status === WaClientStatus.connected &&
                          "bg-primary text-primary-foreground",
                      )}
                    >
                      {client.status as string}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Campaign Execution */}
          <Card data-ocid="dashboard.campaigns_card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Campaign Execution
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeCampaigns.length === 0 ? (
                <div
                  className="text-center py-6 text-muted-foreground text-sm"
                  data-ocid="dashboard.campaigns_card.empty_state"
                >
                  No active campaigns
                </div>
              ) : (
                activeCampaigns.map((campaign, idx) => (
                  <div
                    key={campaign.id}
                    className="space-y-1.5"
                    data-ocid={`dashboard.campaign.item.${idx + 1}`}
                  >
                    <div className="flex justify-between text-xs">
                      <span className="text-foreground font-medium truncate">
                        {campaign.name}
                      </span>
                      <span className="text-primary font-mono ml-2 shrink-0">
                        {Number(campaign.progress)}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${Number(campaign.progress)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{Number(campaign.sentCount)} sent</span>
                      <span>{Number(campaign.failedCount)} failed</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent message history */}
        <Card data-ocid="dashboard.history_card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              Recent Message History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentLogs.length === 0 ? (
              <div
                className="text-center py-8 text-muted-foreground text-sm"
                data-ocid="dashboard.history_card.empty_state"
              >
                No messages sent yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {["Timestamp", "Recipient", "Status", "Campaign"].map(
                        (h) => (
                          <th
                            key={h}
                            className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground"
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {recentLogs.map((log, idx) => (
                      <tr
                        key={log.id}
                        className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                        data-ocid={`dashboard.history.item.${idx + 1}`}
                      >
                        <td className="px-4 py-2.5 text-xs text-muted-foreground font-mono whitespace-nowrap">
                          {new Date(
                            Number(log.timestamp) / 1_000_000,
                          ).toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5 font-medium text-foreground">
                          {log.contactName}
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge
                            variant={
                              log.status === "sent"
                                ? "default"
                                : log.status === "failed"
                                  ? "destructive"
                                  : "secondary"
                            }
                            className={cn(
                              "text-xs capitalize",
                              log.status === "sent" &&
                                "bg-primary text-primary-foreground",
                            )}
                          >
                            {log.status as string}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground truncate max-w-[160px]">
                          {log.campaignId}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
