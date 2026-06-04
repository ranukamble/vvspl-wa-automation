import type { AppSettings } from "@/backend";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useSettings, useUpdateSettings } from "@/hooks/useBackend";
import { Clock, Settings, Shield, Wifi, WifiOff, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();

  const [form, setForm] = useState<AppSettings>({
    activeHoursEnd: "21:00",
    activeHoursStart: "09:00",
    dailyLimit: 100n,
    delaySeconds: 5n,
    warmupMode: false,
    nodeBackendUrl: "",
  });
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  const handleTestConnection = async () => {
    const url = form.nodeBackendUrl?.trim();
    if (!url) {
      toast.error("Please enter a backend URL first");
      return;
    }
    setIsTesting(true);
    try {
      const res = await fetch(`${url}/api/health`, {
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        toast.success("Connected! External backend is reachable.");
      } else {
        toast.error(`Backend responded with status ${res.status}`);
      }
    } catch {
      toast.error(
        "Cannot reach backend — check the URL and ensure the server is running.",
      );
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync(form);
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    }
  };

  return (
    <Layout>
      <div className="p-4 lg:p-6 space-y-6" data-ocid="settings.page">
        <div>
          <h2 className="text-lg font-display font-semibold text-foreground">
            Settings
          </h2>
          <p className="text-sm text-muted-foreground">
            Configure messaging limits and automation behavior
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {["sk-settings-1", "sk-settings-2", "sk-settings-3"].map((k) => (
              <Skeleton key={k} className="h-32 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-5 max-w-2xl">
            {/* Message Limits */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" /> Message Limits
                </CardTitle>
                <CardDescription className="text-xs">
                  Safety limits to prevent account bans
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="daily-limit">Daily Message Limit</Label>
                  <Input
                    id="daily-limit"
                    type="number"
                    min="1"
                    max="500"
                    value={Number(form.dailyLimit)}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        dailyLimit: BigInt(e.target.value || "100"),
                      })
                    }
                    data-ocid="settings.daily_limit.input"
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum messages per client per day
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="delay">
                    Delay Between Messages (seconds)
                  </Label>
                  <Input
                    id="delay"
                    type="number"
                    min="1"
                    max="60"
                    value={Number(form.delaySeconds)}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        delaySeconds: BigInt(e.target.value || "5"),
                      })
                    }
                    data-ocid="settings.delay.input"
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum delay between each outgoing message
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Active Hours */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" /> Active Hours
                </CardTitle>
                <CardDescription className="text-xs">
                  Only send messages during these hours
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="hours-start">Start Time</Label>
                  <Input
                    id="hours-start"
                    type="time"
                    value={form.activeHoursStart}
                    onChange={(e) =>
                      setForm({ ...form, activeHoursStart: e.target.value })
                    }
                    data-ocid="settings.hours_start.input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="hours-end">End Time</Label>
                  <Input
                    id="hours-end"
                    type="time"
                    value={form.activeHoursEnd}
                    onChange={(e) =>
                      setForm({ ...form, activeHoursEnd: e.target.value })
                    }
                    data-ocid="settings.hours_end.input"
                  />
                </div>
              </CardContent>
            </Card>

            {/* External Backend */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Wifi className="h-4 w-4 text-primary" /> External Backend
                </CardTitle>
                <CardDescription className="text-xs">
                  Connect to a real Node.js + whatsapp-web.js server for live
                  WhatsApp sessions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="node-backend-url">External Backend URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="node-backend-url"
                      type="url"
                      placeholder="http://your-server:3001"
                      value={form.nodeBackendUrl ?? ""}
                      onChange={(e) =>
                        setForm({ ...form, nodeBackendUrl: e.target.value })
                      }
                      className="flex-1"
                      data-ocid="settings.node_backend_url.input"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleTestConnection}
                      disabled={isTesting || !form.nodeBackendUrl?.trim()}
                      className="shrink-0 gap-1.5"
                      data-ocid="settings.test_connection.button"
                    >
                      {isTesting ? (
                        <>
                          <WifiOff className="h-3.5 w-3.5 animate-pulse" />
                          Testing…
                        </>
                      ) : (
                        <>
                          <Wifi className="h-3.5 w-3.5" />
                          Test Connection
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    When set, the WhatsApp Clients page will fetch live QR codes
                    and client status from this server instead of simulated
                    data. Leave blank to disable real WhatsApp connections. When
                    set, the WhatsApp Clients page will connect to your Node.js
                    backend.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Warmup Mode */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" /> Warmup Mode
                </CardTitle>
                <CardDescription className="text-xs">
                  Gradually increase sending volume for new accounts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Switch
                    id="warmup"
                    checked={form.warmupMode}
                    onCheckedChange={(checked) =>
                      setForm({ ...form, warmupMode: checked })
                    }
                    data-ocid="settings.warmup.switch"
                  />
                  <Label htmlFor="warmup" className="cursor-pointer">
                    {form.warmupMode
                      ? "Warmup mode enabled"
                      : "Warmup mode disabled"}
                  </Label>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handleSave}
              disabled={updateSettings.isPending}
              className="w-full sm:w-auto"
              data-ocid="settings.save_button"
            >
              {updateSettings.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
