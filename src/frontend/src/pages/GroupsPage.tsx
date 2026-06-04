import type { GroupMember } from "@/backend";
import { Layout } from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCreateContactList,
  useExtractGroupMembers,
  useImportContacts,
} from "@/hooks/useBackend";
import { Download, Save, Search, Users2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function GroupsPage() {
  const [groupId, setGroupId] = useState("");
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [listName, setListName] = useState("");
  const [saving, setSaving] = useState(false);

  const extractMembers = useExtractGroupMembers();
  const createList = useCreateContactList();
  const importContacts = useImportContacts();

  const handleExtract = async () => {
    if (!groupId.trim()) {
      toast.error("Enter a group ID");
      return;
    }
    try {
      const result = await extractMembers.mutateAsync(groupId.trim());
      setMembers(result);
      toast.success(`Extracted ${result.length} members`);
    } catch {
      toast.error("Failed to extract group members");
    }
  };

  const handleSaveToList = async () => {
    if (!listName.trim()) {
      toast.error("Enter a list name");
      return;
    }
    if (members.length === 0) {
      toast.error("No members to save");
      return;
    }
    setSaving(true);
    try {
      const list = await createList.mutateAsync({
        name: listName,
        description: `Imported from group ${groupId}`,
      });
      await importContacts.mutateAsync({ listId: list.id, items: members });
      toast.success(`Saved ${members.length} members to "${listName}"`);
      setListName("");
    } catch {
      toast.error("Failed to save members");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="p-4 lg:p-6 space-y-6" data-ocid="groups.page">
        <div>
          <h2 className="text-lg font-display font-semibold text-foreground">
            Groups
          </h2>
          <p className="text-sm text-muted-foreground">
            Extract members from WhatsApp groups by group ID
          </p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Search className="h-4 w-4 text-primary" /> Extract Group Members
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="group-id">Group ID</Label>
                <Input
                  id="group-id"
                  placeholder="e.g. 120363025123456789@g.us"
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  data-ocid="groups.group_id.input"
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleExtract}
                  disabled={extractMembers.isPending}
                  className="gap-2"
                  data-ocid="groups.extract_button"
                >
                  <Users2 className="h-4 w-4" />
                  {extractMembers.isPending ? "Extracting..." : "Extract"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {extractMembers.isPending && (
          <Card data-ocid="groups.loading_state">
            <CardContent className="p-4 space-y-2">
              {[
                "sk-member-1",
                "sk-member-2",
                "sk-member-3",
                "sk-member-4",
                "sk-member-5",
              ].map((k) => (
                <Skeleton key={k} className="h-8 w-full" />
              ))}
            </CardContent>
          </Card>
        )}

        {members.length > 0 && (
          <Card data-ocid="groups.results_card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">
                  Extracted Members
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {members.length}
                  </Badge>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-x-auto max-h-72 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-card">
                    <tr className="border-b border-border">
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                        #
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                        Name
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                        Phone
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m, idx) => (
                      <tr
                        key={`${m.phone}-${idx}`}
                        className="border-b border-border/50"
                        data-ocid={`groups.member.item.${idx + 1}`}
                      >
                        <td className="px-4 py-2 text-xs text-muted-foreground font-mono">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-2 font-medium text-foreground">
                          {m.name}
                        </td>
                        <td className="px-4 py-2 font-mono text-xs text-muted-foreground">
                          {m.phone}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Save to list */}
              <div className="border-t border-border pt-4 flex gap-3">
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="save-list-name">Save to Contact List</Label>
                  <Input
                    id="save-list-name"
                    placeholder="List name"
                    value={listName}
                    onChange={(e) => setListName(e.target.value)}
                    data-ocid="groups.save_list_name.input"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleSaveToList}
                    disabled={saving}
                    variant="outline"
                    className="gap-2"
                    data-ocid="groups.save_button"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? "Saving..." : "Save List"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {members.length === 0 && !extractMembers.isPending && (
          <div
            className="text-center py-12 text-muted-foreground text-sm"
            data-ocid="groups.empty_state"
          >
            <Users2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
            Enter a group ID and click Extract to view members
          </div>
        )}
      </div>
    </Layout>
  );
}
