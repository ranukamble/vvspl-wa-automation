import { Layout } from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCampaigns,
  useMessageLogCount,
  useMessageLogs,
  usePolling,
} from "@/hooks/useBackend";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
import { useState } from "react";

const PAGE_SIZE = 20n;

export default function HistoryPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [campaignFilter, setCampaignFilter] = useState<string | null>(null);
  const [page, setPage] = useState(0n);

  const { data: campaigns = [] } = useCampaigns();
  const { data: logs = [], isLoading } = useMessageLogs(
    campaignFilter,
    statusFilter,
    PAGE_SIZE,
    page * PAGE_SIZE,
  );
  const { data: totalCount = 0n } = useMessageLogCount(
    campaignFilter,
    statusFilter,
  );

  usePolling(() => {
    qc.invalidateQueries({ queryKey: ["messageLogs"] });
    qc.invalidateQueries({ queryKey: ["messageLogCount"] });
  }, 8000);

  const totalPages =
    totalCount > 0n ? (totalCount + PAGE_SIZE - 1n) / PAGE_SIZE : 1n;
  const hasPrev = page > 0n;
  const hasNext = page < totalPages - 1n;

  return (
    <Layout>
      <div className="p-4 lg:p-6 space-y-5" data-ocid="history.page">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-display font-semibold text-foreground flex-1">
            Message History
          </h2>
          <Select
            value={statusFilter ?? "all"}
            onValueChange={(v) => {
              setStatusFilter(v === "all" ? null : v);
              setPage(0n);
            }}
          >
            <SelectTrigger className="w-36" data-ocid="history.status.select">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="queued">Queued</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={campaignFilter ?? "all"}
            onValueChange={(v) => {
              setCampaignFilter(v === "all" ? null : v);
              setPage(0n);
            }}
          >
            <SelectTrigger className="w-44" data-ocid="history.campaign.select">
              <SelectValue placeholder="Campaign" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Campaigns</SelectItem>
              {campaigns.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-2">
                {[
                  "sk-log-1",
                  "sk-log-2",
                  "sk-log-3",
                  "sk-log-4",
                  "sk-log-5",
                  "sk-log-6",
                  "sk-log-7",
                  "sk-log-8",
                ].map((k) => (
                  <Skeleton key={k} className="h-10 w-full" />
                ))}
              </div>
            ) : logs.length === 0 ? (
              <div
                className="text-center py-16 text-muted-foreground text-sm"
                data-ocid="history.empty_state"
              >
                <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
                No messages found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {[
                        "Timestamp",
                        "Recipient",
                        "Phone",
                        "Status",
                        "Campaign",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs font-medium text-muted-foreground"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, idx) => (
                      <tr
                        key={log.id}
                        className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                        data-ocid={`history.item.${idx + 1}`}
                      >
                        <td className="px-4 py-2.5 text-xs text-muted-foreground font-mono whitespace-nowrap">
                          {new Date(
                            Number(log.timestamp) / 1_000_000,
                          ).toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5 font-medium text-foreground">
                          {log.contactName}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                          {log.contactPhone}
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
                        <td className="px-4 py-2.5 text-xs text-muted-foreground truncate max-w-[140px]">
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

        {/* Pagination */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground text-xs">
            {Number(totalCount)} total messages
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8"
              disabled={!hasPrev}
              onClick={() => setPage((p) => p - 1n)}
              data-ocid="history.pagination_prev"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-muted-foreground text-xs font-mono">
              {Number(page) + 1} / {Number(totalPages)}
            </span>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8"
              disabled={!hasNext}
              onClick={() => setPage((p) => p + 1n)}
              data-ocid="history.pagination_next"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
