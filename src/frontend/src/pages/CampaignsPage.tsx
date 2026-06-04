import { CampaignStatus } from "@/backend";
import { Layout } from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  useCampaigns,
  useCancelCampaign,
  useContactLists,
  useCreateCampaign,
  useDeleteCampaign,
  useExecuteCampaign,
  usePauseCampaign,
  usePolling,
} from "@/hooks/useBackend";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { Megaphone, Pause, Play, Plus, Square, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  draft: "secondary",
  scheduled: "secondary",
  running: "default",
  paused: "secondary",
  completed: "default",
  failed: "destructive",
  cancelled: "secondary",
};

function CampaignStatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant={
        (statusColors[status] ?? "secondary") as
          | "default"
          | "secondary"
          | "destructive"
      }
      className={cn(
        "text-xs capitalize",
        status === "running" && "bg-primary text-primary-foreground",
        status === "completed" && "bg-muted text-muted-foreground",
      )}
    >
      {status}
    </Badge>
  );
}

export default function CampaignsPage() {
  const qc = useQueryClient();
  const { data: campaigns = [], isLoading } = useCampaigns();
  const { data: contactLists = [] } = useContactLists();
  const createCampaign = useCreateCampaign();
  const executeCampaign = useExecuteCampaign();
  const pauseCampaign = usePauseCampaign();
  const cancelCampaign = useCancelCampaign();
  const deleteCampaign = useDeleteCampaign();

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: "",
    listId: "",
    message: "",
    delaySeconds: "5",
  });

  usePolling(() => qc.invalidateQueries({ queryKey: ["campaigns"] }), 7000);

  const handleCreate = async () => {
    if (!form.name || !form.listId || !form.message) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      await createCampaign.mutateAsync({
        name: form.name,
        listId: form.listId,
        message: form.message,
        mediaUrl: null,
        delaySeconds: BigInt(form.delaySeconds || "5"),
        scheduledAt: null,
      });
      toast.success("Campaign created");
      setShowCreate(false);
      setForm({ name: "", listId: "", message: "", delaySeconds: "5" });
    } catch {
      toast.error("Failed to create campaign");
    }
  };

  const handleExecute = async (id: string) => {
    try {
      await executeCampaign.mutateAsync(id);
      toast.success("Campaign started");
    } catch {
      toast.error("Failed to execute campaign");
    }
  };

  const handlePause = async (id: string) => {
    try {
      await pauseCampaign.mutateAsync(id);
      toast.success("Campaign paused");
    } catch {
      toast.error("Failed to pause campaign");
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await cancelCampaign.mutateAsync(id);
      toast.success("Campaign cancelled");
    } catch {
      toast.error("Failed to cancel campaign");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCampaign.mutateAsync(id);
      toast.success("Campaign deleted");
    } catch {
      toast.error("Failed to delete campaign");
    }
  };

  return (
    <Layout>
      <div className="p-4 lg:p-6 space-y-6" data-ocid="campaigns.page">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-display font-semibold text-foreground">
              Campaigns
            </h2>
            <p className="text-sm text-muted-foreground">
              Create and manage messaging campaigns
            </p>
          </div>
          <Button
            onClick={() => setShowCreate(true)}
            data-ocid="campaigns.add_button"
            className="gap-2"
          >
            <Plus className="h-4 w-4" /> New Campaign
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {["sk-camp-1", "sk-camp-2", "sk-camp-3", "sk-camp-4"].map(
                  (k) => (
                    <Skeleton key={k} className="h-16 w-full" />
                  ),
                )}
              </div>
            ) : campaigns.length === 0 ? (
              <div
                className="text-center py-16 space-y-3"
                data-ocid="campaigns.empty_state"
              >
                <Megaphone className="h-12 w-12 text-muted-foreground/40 mx-auto" />
                <p className="text-muted-foreground">No campaigns yet</p>
                <Button
                  size="sm"
                  onClick={() => setShowCreate(true)}
                  data-ocid="campaigns.empty.add_button"
                >
                  Create your first campaign
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {[
                        "Name",
                        "Status",
                        "Progress",
                        "Sent",
                        "Failed",
                        "Actions",
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
                    {campaigns.map((campaign, idx) => (
                      <tr
                        key={campaign.id}
                        className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                        data-ocid={`campaigns.item.${idx + 1}`}
                      >
                        <td className="px-4 py-3 font-medium text-foreground">
                          {campaign.name}
                        </td>
                        <td className="px-4 py-3">
                          <CampaignStatusBadge
                            status={campaign.status as string}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-20 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{
                                  width: `${Number(campaign.progress)}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground font-mono">
                              {Number(campaign.progress)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs">
                          {Number(campaign.sentCount)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs text-destructive">
                          {Number(campaign.failedCount)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {(campaign.status === CampaignStatus.draft ||
                              campaign.status === CampaignStatus.scheduled) && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => handleExecute(campaign.id)}
                                data-ocid={`campaigns.execute_button.${idx + 1}`}
                              >
                                <Play className="h-3.5 w-3.5 text-primary" />
                              </Button>
                            )}
                            {campaign.status === CampaignStatus.running && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => handlePause(campaign.id)}
                                data-ocid={`campaigns.pause_button.${idx + 1}`}
                              >
                                <Pause className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {(campaign.status === CampaignStatus.running ||
                              campaign.status === CampaignStatus.paused) && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => handleCancel(campaign.id)}
                                data-ocid={`campaigns.cancel_button.${idx + 1}`}
                              >
                                <Square className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            )}
                            {(campaign.status === CampaignStatus.completed ||
                              campaign.status === CampaignStatus.cancelled ||
                              campaign.status === CampaignStatus.failed) && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => handleDelete(campaign.id)}
                                data-ocid={`campaigns.delete_button.${idx + 1}`}
                              >
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create dialog */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="sm:max-w-lg" data-ocid="campaigns.dialog">
            <DialogHeader>
              <DialogTitle>New Campaign</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="camp-name">Campaign Name *</Label>
                <Input
                  id="camp-name"
                  placeholder="e.g. Summer Promo"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  data-ocid="campaigns.name.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="camp-list">Contact List *</Label>
                <Select
                  value={form.listId}
                  onValueChange={(v) => setForm({ ...form, listId: v })}
                >
                  <SelectTrigger
                    id="camp-list"
                    data-ocid="campaigns.list.select"
                  >
                    <SelectValue placeholder="Select a contact list" />
                  </SelectTrigger>
                  <SelectContent>
                    {contactLists.map((list) => (
                      <SelectItem key={list.id} value={list.id}>
                        {list.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="camp-msg">Message *</Label>
                <Textarea
                  id="camp-msg"
                  placeholder="Hello {name}, ..."
                  value={form.message}
                  onChange={(e) =>
                    setForm({ ...form, message: e.target.value })
                  }
                  rows={4}
                  data-ocid="campaigns.message.textarea"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="camp-delay">
                  Delay Between Messages (seconds)
                </Label>
                <Input
                  id="camp-delay"
                  type="number"
                  min="1"
                  value={form.delaySeconds}
                  onChange={(e) =>
                    setForm({ ...form, delaySeconds: e.target.value })
                  }
                  data-ocid="campaigns.delay.input"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCreate(false)}
                data-ocid="campaigns.cancel_button"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={createCampaign.isPending}
                data-ocid="campaigns.submit_button"
              >
                {createCampaign.isPending ? "Creating..." : "Create Campaign"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
