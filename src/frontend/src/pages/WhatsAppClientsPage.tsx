import { Layout } from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { usePolling, useSettings } from "@/hooks/useBackend";
import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  Loader2,
  QrCode,
  Settings,
  Smartphone,
  Wifi,
  WifiOff,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const CLIENT_IDS = ["client-1", "client-2", "client-3", "client-4"];

type ExternalClientStatus = "connected" | "disconnected" | "connecting" | "qr";

interface ExternalClient {
  clientId: string;
  status: ExternalClientStatus;
  phoneNumber?: string;
  qrCode?: string;
}

// ─── QR Modal ────────────────────────────────────────────────────────────────
function QrModal({
  client,
  open,
  onClose,
}: { client: ExternalClient | null; open: boolean; onClose: () => void }) {
  if (!client) return null;
  const hasQr = client.status === "qr" && !!client.qrCode;
  const waitingForQr = client.status === "qr" && !client.qrCode;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm" data-ocid="whatsapp.qr.dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-4 w-4 text-primary" />
            Scan QR Code — {client.clientId}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center py-4 gap-4">
          {hasQr ? (
            <div className="p-4 bg-white rounded-xl shadow-sm border border-border">
              <QRCodeSVG
                value={client.qrCode!}
                size={220}
                bgColor="#ffffff"
                fgColor="#000000"
                level="M"
              />
            </div>
          ) : waitingForQr ? (
            <div className="flex h-[252px] w-[252px] items-center justify-center rounded-xl border border-dashed border-border bg-muted/30">
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm">Waiting for QR code...</p>
              </div>
            </div>
          ) : (
            <div className="flex h-[252px] w-[252px] items-center justify-center rounded-xl border border-dashed border-border bg-muted/30">
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <QrCode className="h-8 w-8 opacity-30" />
                <p className="text-sm text-center px-4">
                  QR code only available when client status is{" "}
                  <strong>qr</strong>. Click Connect first.
                </p>
              </div>
            </div>
          )}
          {hasQr && (
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-foreground">
                Scan with WhatsApp on your phone
              </p>
              <p className="text-xs text-muted-foreground">
                Open WhatsApp → Linked Devices → Link a Device
              </p>
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          data-ocid="whatsapp.qr.close_button"
        >
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
}

// ─── Client Card ─────────────────────────────────────────────────────────────
function ClientCard({
  clientId,
  client,
  idx,
  connecting,
  disconnecting,
  onConnect,
  onDisconnect,
  onShowQr,
}: {
  clientId: string;
  client: ExternalClient | undefined;
  idx: number;
  connecting: boolean;
  disconnecting: boolean;
  onConnect: (id: string) => void;
  onDisconnect: (id: string) => void;
  onShowQr: (id: string) => void;
}) {
  const status = client?.status ?? "disconnected";
  const isConnected = status === "connected";
  const isConnecting = status === "connecting" || status === "qr";
  const phone = client?.phoneNumber;

  const dotClass = isConnected
    ? "bg-primary animate-pulse"
    : isConnecting
      ? "bg-yellow-500 animate-pulse"
      : "bg-muted-foreground/40";

  const num = clientId.split("-")[1] ?? String(idx + 1);

  return (
    <Card
      className={cn(
        "border transition-smooth",
        isConnected ? "border-primary/40 bg-primary/5" : "border-border",
      )}
      data-ocid={`whatsapp.client.item.${idx + 1}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
            <Smartphone
              className={cn(
                "h-5 w-5",
                isConnected ? "text-primary" : "text-muted-foreground",
              )}
            />
          </div>
          <span className={cn("h-2.5 w-2.5 rounded-full mt-1", dotClass)} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="font-display font-semibold text-foreground">
            Client {num}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {phone ?? (isConnected ? "Phone connected" : "Not connected")}
          </p>
        </div>
        <Badge
          variant={isConnected ? "default" : "secondary"}
          className={cn(
            "text-xs capitalize w-full justify-center",
            isConnected && "bg-primary text-primary-foreground",
          )}
        >
          {status === "qr"
            ? "Scan QR"
            : status === "connecting"
              ? "Connecting..."
              : status}
        </Badge>
        <div className="flex gap-2">
          {!isConnected ? (
            <Button
              type="button"
              size="sm"
              className="flex-1 gap-1 text-xs"
              onClick={() => onConnect(clientId)}
              disabled={connecting || isConnecting}
              data-ocid={`whatsapp.connect_button.${idx + 1}`}
            >
              {connecting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Wifi className="h-3.5 w-3.5" />
              )}
              {connecting
                ? "Connecting"
                : isConnecting
                  ? "Connecting"
                  : "Connect"}
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="flex-1 gap-1 text-xs"
              onClick={() => onDisconnect(clientId)}
              disabled={disconnecting}
              data-ocid={`whatsapp.disconnect_button.${idx + 1}`}
            >
              {disconnecting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <WifiOff className="h-3.5 w-3.5" />
              )}
              Disconnect
            </Button>
          )}
          {(status === "qr" || isConnecting) && (
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="h-8 w-8 shrink-0"
              onClick={() => onShowQr(clientId)}
              data-ocid={`whatsapp.qr_button.${idx + 1}`}
            >
              <QrCode className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function WhatsAppClientsPage() {
  const navigate = useNavigate();
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const nodeBackendUrl = settings?.nodeBackendUrl?.trim() ?? "";

  const [clients, setClients] = useState<ExternalClient[]>([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [connectingIds, setConnectingIds] = useState<Set<string>>(new Set());
  const [disconnectingIds, setDisconnectingIds] = useState<Set<string>>(
    new Set(),
  );
  const [qrClientId, setQrClientId] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    if (!nodeBackendUrl) return;
    try {
      const res = await fetch(`${nodeBackendUrl}/api/clients`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ExternalClient[] = await res.json();
      setClients(data);
      setFetchError(null);
    } catch {
      setFetchError(
        "Cannot reach external backend. Check the URL in Settings or ensure your server is running.",
      );
    } finally {
      setFetchLoading(false);
    }
  }, [nodeBackendUrl]);

  // Initial load
  const initialFetched = useRef(false);
  useEffect(() => {
    if (!nodeBackendUrl) return;
    if (!initialFetched.current) {
      initialFetched.current = true;
      setFetchLoading(true);
    }
    fetchClients();
  }, [nodeBackendUrl, fetchClients]);

  // Reset when URL changes — nodeBackendUrl intentionally drives this side effect
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset on URL change
  useEffect(() => {
    initialFetched.current = false;
    setClients([]);
    setFetchError(null);
  }, [nodeBackendUrl]);

  // Poll every 8 seconds
  usePolling(() => {
    if (nodeBackendUrl) fetchClients();
  }, 8000);

  const handleConnect = async (clientId: string) => {
    setConnectingIds((prev) => new Set(prev).add(clientId));
    try {
      const res = await fetch(
        `${nodeBackendUrl}/api/clients/connect/${clientId}`,
        { method: "POST" },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success(`Connecting ${clientId}...`);
      await fetchClients();
    } catch {
      toast.error(`Failed to connect ${clientId}`);
    } finally {
      setConnectingIds((prev) => {
        const next = new Set(prev);
        next.delete(clientId);
        return next;
      });
    }
  };

  const handleDisconnect = async (clientId: string) => {
    setDisconnectingIds((prev) => new Set(prev).add(clientId));
    try {
      const res = await fetch(
        `${nodeBackendUrl}/api/clients/disconnect/${clientId}`,
        { method: "POST" },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success(`Disconnected ${clientId}`);
      await fetchClients();
    } catch {
      toast.error(`Failed to disconnect ${clientId}`);
    } finally {
      setDisconnectingIds((prev) => {
        const next = new Set(prev);
        next.delete(clientId);
        return next;
      });
    }
  };

  const qrClient = clients.find((c) => c.clientId === qrClientId) ?? null;

  const isUnconfigured = !settingsLoading && !nodeBackendUrl;

  return (
    <Layout>
      <div className="p-4 lg:p-6 space-y-6" data-ocid="whatsapp.page">
        <div>
          <h2 className="text-lg font-display font-semibold text-foreground">
            WhatsApp Clients
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage your connected WhatsApp accounts
          </p>
        </div>

        {/* Setup banner — URL not configured */}
        {isUnconfigured && (
          <div
            className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4"
            data-ocid="whatsapp.setup_banner"
          >
            <Settings className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                Backend server not configured
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Configure your backend server URL in Settings to enable real
                WhatsApp connections.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="shrink-0 gap-1.5 text-xs"
              onClick={() => navigate({ to: "/settings" })}
              data-ocid="whatsapp.go_to_settings_button"
            >
              <Settings className="h-3.5 w-3.5" />
              Open Settings
            </Button>
          </div>
        )}

        {/* Fetch error banner */}
        {fetchError && !isUnconfigured && (
          <div
            className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4"
            data-ocid="whatsapp.error_state"
          >
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                Backend unreachable
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {fetchError}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="shrink-0 gap-1.5 text-xs"
              onClick={() => navigate({ to: "/settings" })}
              data-ocid="whatsapp.settings_link_button"
            >
              <Settings className="h-3.5 w-3.5" />
              Settings
            </Button>
          </div>
        )}

        {/* Loading skeleton (initial fetch) */}
        {settingsLoading || (fetchLoading && clients.length === 0) ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {["sk-1", "sk-2", "sk-3", "sk-4"].map((k) => (
              <Skeleton key={k} className="h-52 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {CLIENT_IDS.map((cid, idx) => {
              const client = clients.find((c) => c.clientId === cid);
              return (
                <ClientCard
                  key={cid}
                  clientId={cid}
                  client={client}
                  idx={idx}
                  connecting={connectingIds.has(cid)}
                  disconnecting={disconnectingIds.has(cid)}
                  onConnect={handleConnect}
                  onDisconnect={handleDisconnect}
                  onShowQr={setQrClientId}
                />
              );
            })}
          </div>
        )}
      </div>

      <QrModal
        client={qrClient}
        open={!!qrClientId}
        onClose={() => setQrClientId(null)}
      />
    </Layout>
  );
}
