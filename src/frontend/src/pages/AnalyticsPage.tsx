import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalyticsData, usePolling } from "@/hooks/useBackend";
import { useQueryClient } from "@tanstack/react-query";
import { Megaphone, MessageSquare, TrendingUp, Users } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function AnalyticsPage() {
  const qc = useQueryClient();
  const { data: analytics, isLoading } = useAnalyticsData();

  usePolling(
    () => qc.invalidateQueries({ queryKey: ["analyticsData"] }),
    15000,
  );

  const dailyMessages = (analytics?.dailyMessages ?? []).map((d) => ({
    date: d.date,
    count: Number(d.count),
  }));

  const campaignPerformance = (analytics?.campaignPerformance ?? []).map(
    (c) => ({
      name: c.campaignName,
      sent: Number(c.sent),
      failed: Number(c.failed),
    }),
  );

  const contactsGrowth = (analytics?.contactsGrowth ?? []).map((c) => ({
    date: c.date,
    total: Number(c.total),
  }));

  return (
    <Layout>
      <div className="p-4 lg:p-6 space-y-6" data-ocid="analytics.page">
        <div>
          <h2 className="text-lg font-display font-semibold text-foreground">
            Analytics
          </h2>
          <p className="text-sm text-muted-foreground">
            Performance insights and messaging statistics
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Messages */}
          <Card data-ocid="analytics.daily_messages_card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" /> Daily
                Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : dailyMessages.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                  No data yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={dailyMessages}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="oklch(0.25 0 0)"
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: "oklch(0.5 0 0)" }}
                    />
                    <YAxis tick={{ fontSize: 10, fill: "oklch(0.5 0 0)" }} />
                    <Tooltip
                      contentStyle={{
                        background: "oklch(0.16 0 0)",
                        border: "1px solid oklch(0.25 0 0)",
                        borderRadius: 4,
                      }}
                      labelStyle={{ color: "oklch(0.9 0 0)" }}
                      itemStyle={{ color: "oklch(0.62 0.22 145)" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="oklch(0.62 0.22 145)"
                      fill="oklch(0.62 0.22 145 / 0.15)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Contacts Growth */}
          <Card data-ocid="analytics.contacts_growth_card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" /> Contacts Growth
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : contactsGrowth.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                  No data yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={contactsGrowth}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="oklch(0.25 0 0)"
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: "oklch(0.5 0 0)" }}
                    />
                    <YAxis tick={{ fontSize: 10, fill: "oklch(0.5 0 0)" }} />
                    <Tooltip
                      contentStyle={{
                        background: "oklch(0.16 0 0)",
                        border: "1px solid oklch(0.25 0 0)",
                        borderRadius: 4,
                      }}
                      labelStyle={{ color: "oklch(0.9 0 0)" }}
                      itemStyle={{ color: "oklch(0.7 0.15 190)" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="oklch(0.7 0.15 190)"
                      fill="oklch(0.7 0.15 190 / 0.15)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Campaign Performance */}
          <Card
            className="lg:col-span-2"
            data-ocid="analytics.campaign_performance_card"
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-primary" /> Campaign
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-56 w-full" />
              ) : campaignPerformance.length === 0 ? (
                <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">
                  No campaign data yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={campaignPerformance}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="oklch(0.25 0 0)"
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: "oklch(0.5 0 0)" }}
                    />
                    <YAxis tick={{ fontSize: 10, fill: "oklch(0.5 0 0)" }} />
                    <Tooltip
                      contentStyle={{
                        background: "oklch(0.16 0 0)",
                        border: "1px solid oklch(0.25 0 0)",
                        borderRadius: 4,
                      }}
                      labelStyle={{ color: "oklch(0.9 0 0)" }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar
                      dataKey="sent"
                      name="Sent"
                      fill="oklch(0.62 0.22 145)"
                      radius={[3, 3, 0, 0]}
                    />
                    <Bar
                      dataKey="failed"
                      name="Failed"
                      fill="oklch(0.55 0.22 25)"
                      radius={[3, 3, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
