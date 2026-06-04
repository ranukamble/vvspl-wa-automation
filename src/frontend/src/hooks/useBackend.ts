import { createActor } from "@/backend";
import type {
  AnalyticsData,
  AppSettings,
  Campaign,
  Contact,
  ContactList,
  DashboardSummary,
  GroupMember,
  MessageLog,
  WaClient,
} from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

// ─── Polling hook ────────────────────────────────────────────────────────────
export function usePolling(fn: () => void, intervalMs: number) {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fnRef.current();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const id = setInterval(() => {
      if (document.visibilityState === "visible") {
        fnRef.current();
      }
    }, intervalMs);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [intervalMs]);
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
export function useDashboardSummary() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<DashboardSummary>({
    queryKey: ["dashboardSummary"],
    queryFn: async () => {
      if (!actor)
        return {
          activeCampaigns: 0n,
          totalContacts: 0n,
          connectedClients: 0n,
          messagesToday: 0n,
        };
      return actor.getDashboardSummary();
    },
    enabled: !!actor && !isFetching,
    staleTime: 5000,
  });
}

// ─── Clients ─────────────────────────────────────────────────────────────────
export function useClients() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<WaClient[]>({
    queryKey: ["clients"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getClients();
    },
    enabled: !!actor && !isFetching,
    staleTime: 5000,
  });
}

export function useClientQr(clientId: string, enabled: boolean) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<string | null>({
    queryKey: ["clientQr", clientId],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getClientQr(clientId);
    },
    enabled: !!actor && !isFetching && enabled,
    refetchInterval: 3000,
  });
}

export function useConnectClient() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (clientId: string) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.connectClient(clientId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });
}

export function useDisconnectClient() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (clientId: string) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.disconnectClient(clientId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });
}

// ─── Contact Lists ────────────────────────────────────────────────────────────
export function useContactLists() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<ContactList[]>({
    queryKey: ["contactLists"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getContactLists();
    },
    enabled: !!actor && !isFetching,
    staleTime: 10000,
  });
}

export function useCreateContactList() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      description,
    }: { name: string; description: string }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.createContactList(name, description);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contactLists"] }),
  });
}

export function useDeleteContactList() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.deleteContactList(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contactLists"] }),
  });
}

// ─── Contacts ────────────────────────────────────────────────────────────────
export function useContacts(listId: string) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<Contact[]>({
    queryKey: ["contacts", listId],
    queryFn: async () => {
      if (!actor || !listId) return [];
      return actor.getContacts(listId);
    },
    enabled: !!actor && !isFetching && !!listId,
    staleTime: 10000,
  });
}

export function useAddContact() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      listId,
      name,
      phone,
    }: { listId: string; name: string; phone: string }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.addContact(listId, name, phone);
    },
    onSuccess: (_, vars) =>
      qc.invalidateQueries({ queryKey: ["contacts", vars.listId] }),
  });
}

export function useDeleteContact() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      listId: _listId,
    }: { id: string; listId: string }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.deleteContact(id);
    },
    onSuccess: (_, vars) =>
      qc.invalidateQueries({ queryKey: ["contacts", vars.listId] }),
  });
}

export function useImportContacts() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      listId,
      items,
    }: { listId: string; items: Array<{ name: string; phone: string }> }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.importContacts(listId, items);
    },
    onSuccess: (_, vars) =>
      qc.invalidateQueries({ queryKey: ["contacts", vars.listId] }),
  });
}

// ─── Campaigns ───────────────────────────────────────────────────────────────
export function useCampaigns() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<Campaign[]>({
    queryKey: ["campaigns"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCampaigns();
    },
    enabled: !!actor && !isFetching,
    staleTime: 5000,
  });
}

export function useCreateCampaign() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      name: string;
      listId: string;
      message: string;
      mediaUrl: string | null;
      delaySeconds: bigint;
      scheduledAt: bigint | null;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.createCampaign(
        params.name,
        params.listId,
        params.message,
        params.mediaUrl,
        params.delaySeconds,
        params.scheduledAt,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["campaigns"] }),
  });
}

export function useExecuteCampaign() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.executeCampaign(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["campaigns"] }),
  });
}

export function usePauseCampaign() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.pauseCampaign(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["campaigns"] }),
  });
}

export function useCancelCampaign() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.cancelCampaign(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["campaigns"] }),
  });
}

export function useDeleteCampaign() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.deleteCampaign(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["campaigns"] }),
  });
}

// ─── Message Logs ────────────────────────────────────────────────────────────
export function useMessageLogs(
  campaignId: string | null,
  status: string | null,
  limit: bigint,
  offset: bigint,
) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<MessageLog[]>({
    queryKey: [
      "messageLogs",
      campaignId,
      status,
      limit.toString(),
      offset.toString(),
    ],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMessageLogs(campaignId, status, limit, offset);
    },
    enabled: !!actor && !isFetching,
    staleTime: 5000,
  });
}

export function useMessageLogCount(
  campaignId: string | null,
  status: string | null,
) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<bigint>({
    queryKey: ["messageLogCount", campaignId, status],
    queryFn: async () => {
      if (!actor) return 0n;
      return actor.getMessageLogCount(campaignId, status);
    },
    enabled: !!actor && !isFetching,
    staleTime: 5000,
  });
}

// ─── Analytics ───────────────────────────────────────────────────────────────
export function useAnalyticsData() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<AnalyticsData>({
    queryKey: ["analyticsData"],
    queryFn: async () => {
      if (!actor)
        return {
          contactsGrowth: [],
          dailyMessages: [],
          campaignPerformance: [],
        };
      return actor.getAnalyticsData();
    },
    enabled: !!actor && !isFetching,
    staleTime: 15000,
  });
}

// ─── Settings ────────────────────────────────────────────────────────────────
export function useSettings() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<AppSettings>({
    queryKey: ["settings"],
    queryFn: async () => {
      if (!actor)
        return {
          activeHoursEnd: "21:00",
          activeHoursStart: "09:00",
          dailyLimit: 100n,
          delaySeconds: 5n,
          warmupMode: false,
          nodeBackendUrl: "",
        };
      return actor.getSettings();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30000,
  });
}

export function useUpdateSettings() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (settings: AppSettings) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.updateSettings(settings);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  });
}

// ─── Groups ──────────────────────────────────────────────────────────────────
export function useExtractGroupMembers() {
  const { actor } = useActor(createActor);
  return useMutation({
    mutationFn: async (groupId: string): Promise<GroupMember[]> => {
      if (!actor) throw new Error("Actor not ready");
      return actor.extractGroupMembers(groupId);
    },
  });
}
