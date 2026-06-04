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
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  useAddContact,
  useContactLists,
  useContacts,
  useCreateContactList,
  useDeleteContact,
  useDeleteContactList,
  useImportContacts,
} from "@/hooks/useBackend";
import { ChevronRight, Plus, Trash2, Upload, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ContactsPage() {
  const { data: lists = [], isLoading: listsLoading } = useContactLists();
  const createList = useCreateContactList();
  const deleteList = useDeleteContactList();
  const addContact = useAddContact();
  const deleteContact = useDeleteContact();
  const importContacts = useImportContacts();

  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const { data: contacts = [], isLoading: contactsLoading } = useContacts(
    selectedListId ?? "",
  );

  const [showCreateList, setShowCreateList] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [listForm, setListForm] = useState({ name: "", description: "" });
  const [contactForm, setContactForm] = useState({ name: "", phone: "" });
  const [importText, setImportText] = useState("");

  const selectedList = lists.find((l) => l.id === selectedListId);

  const handleCreateList = async () => {
    if (!listForm.name) {
      toast.error("List name required");
      return;
    }
    try {
      await createList.mutateAsync(listForm);
      toast.success("Contact list created");
      setShowCreateList(false);
      setListForm({ name: "", description: "" });
    } catch {
      toast.error("Failed to create list");
    }
  };

  const handleAddContact = async () => {
    if (!selectedListId || !contactForm.name || !contactForm.phone) {
      toast.error("All fields required");
      return;
    }
    try {
      await addContact.mutateAsync({ listId: selectedListId, ...contactForm });
      toast.success("Contact added");
      setShowAddContact(false);
      setContactForm({ name: "", phone: "" });
    } catch {
      toast.error("Failed to add contact");
    }
  };

  const handleImport = async () => {
    if (!selectedListId || !importText.trim()) {
      toast.error("Paste contacts in name,phone format");
      return;
    }
    const lines = importText.trim().split("\n");
    const items = lines
      .map((line) => line.split(",").map((s) => s.trim()))
      .filter((parts) => parts.length >= 2)
      .map(([name, phone]) => ({ name, phone }));
    if (items.length === 0) {
      toast.error("No valid contacts found");
      return;
    }
    try {
      await importContacts.mutateAsync({ listId: selectedListId, items });
      toast.success(`Imported ${items.length} contacts`);
      setShowImport(false);
      setImportText("");
    } catch {
      toast.error("Import failed");
    }
  };

  return (
    <Layout>
      <div className="p-4 lg:p-6" data-ocid="contacts.page">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lists column */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                Contact Lists
              </h2>
              <Button
                size="sm"
                onClick={() => setShowCreateList(true)}
                data-ocid="contacts.add_list_button"
                className="gap-1 h-7 text-xs"
              >
                <Plus className="h-3 w-3" /> New List
              </Button>
            </div>
            <div className="space-y-2">
              {listsLoading ? (
                ["sk-list-1", "sk-list-2", "sk-list-3"].map((k) => (
                  <Skeleton key={k} className="h-16 w-full" />
                ))
              ) : lists.length === 0 ? (
                <div
                  className="text-center py-10 text-muted-foreground text-sm"
                  data-ocid="contacts.lists.empty_state"
                >
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  No lists yet
                </div>
              ) : (
                lists.map((list, idx) => (
                  <button
                    type="button"
                    key={list.id}
                    onClick={() =>
                      setSelectedListId(
                        list.id === selectedListId ? null : list.id,
                      )
                    }
                    data-ocid={`contacts.list.item.${idx + 1}`}
                    className={`w-full text-left p-3 rounded-lg border transition-smooth ${
                      selectedListId === list.id
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground truncate">
                        {list.name}
                      </span>
                      <div className="flex items-center gap-1">
                        <Badge variant="secondary" className="text-xs">
                          {Number(list.contactCount)}
                        </Badge>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    </div>
                    {list.description && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {list.description}
                      </p>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Contacts column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                {selectedList
                  ? `${selectedList.name} — Contacts`
                  : "Select a list"}
              </h2>
              {selectedListId && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowImport(true)}
                    data-ocid="contacts.import_button"
                    className="gap-1 h-7 text-xs"
                  >
                    <Upload className="h-3 w-3" /> Import
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setShowAddContact(true)}
                    data-ocid="contacts.add_contact_button"
                    className="gap-1 h-7 text-xs"
                  >
                    <Plus className="h-3 w-3" /> Add
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (selectedListId) {
                        deleteList.mutate(selectedListId);
                        setSelectedListId(null);
                      }
                    }}
                    data-ocid="contacts.delete_list_button"
                    className="gap-1 h-7 text-xs"
                  >
                    <Trash2 className="h-3 w-3" /> Delete List
                  </Button>
                </div>
              )}
            </div>
            <Card>
              <CardContent className="p-0">
                {!selectedListId ? (
                  <div
                    className="text-center py-16 text-muted-foreground text-sm"
                    data-ocid="contacts.contacts.empty_state"
                  >
                    <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    Select a contact list to view contacts
                  </div>
                ) : contactsLoading ? (
                  <div className="p-4 space-y-2">
                    {[
                      "sk-contact-1",
                      "sk-contact-2",
                      "sk-contact-3",
                      "sk-contact-4",
                      "sk-contact-5",
                    ].map((k) => (
                      <Skeleton key={k} className="h-10 w-full" />
                    ))}
                  </div>
                ) : contacts.length === 0 ? (
                  <div
                    className="text-center py-12 text-muted-foreground text-sm"
                    data-ocid="contacts.contacts_list.empty_state"
                  >
                    No contacts in this list
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          {["Name", "Phone", "Actions"].map((h) => (
                            <th
                              key={h}
                              className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {contacts.map((contact, idx) => (
                          <tr
                            key={contact.id}
                            className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                            data-ocid={`contacts.contact.item.${idx + 1}`}
                          >
                            <td className="px-4 py-2.5 font-medium text-foreground">
                              {contact.name}
                            </td>
                            <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                              {contact.phone}
                            </td>
                            <td className="px-4 py-2.5">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() =>
                                  deleteContact.mutate({
                                    id: contact.id,
                                    listId: contact.listId,
                                  })
                                }
                                data-ocid={`contacts.delete_button.${idx + 1}`}
                              >
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              </Button>
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
        </div>

        {/* Create List Dialog */}
        <Dialog open={showCreateList} onOpenChange={setShowCreateList}>
          <DialogContent data-ocid="contacts.create_list.dialog">
            <DialogHeader>
              <DialogTitle>New Contact List</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="list-name">List Name *</Label>
                <Input
                  id="list-name"
                  value={listForm.name}
                  onChange={(e) =>
                    setListForm({ ...listForm, name: e.target.value })
                  }
                  data-ocid="contacts.list_name.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="list-desc">Description</Label>
                <Input
                  id="list-desc"
                  value={listForm.description}
                  onChange={(e) =>
                    setListForm({ ...listForm, description: e.target.value })
                  }
                  data-ocid="contacts.list_description.input"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCreateList(false)}
                data-ocid="contacts.create_list.cancel_button"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateList}
                disabled={createList.isPending}
                data-ocid="contacts.create_list.submit_button"
              >
                {createList.isPending ? "Creating..." : "Create List"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Contact Dialog */}
        <Dialog open={showAddContact} onOpenChange={setShowAddContact}>
          <DialogContent data-ocid="contacts.add_contact.dialog">
            <DialogHeader>
              <DialogTitle>Add Contact</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="contact-name">Name *</Label>
                <Input
                  id="contact-name"
                  value={contactForm.name}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, name: e.target.value })
                  }
                  data-ocid="contacts.contact_name.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact-phone">Phone *</Label>
                <Input
                  id="contact-phone"
                  placeholder="e.g. 919876543210"
                  value={contactForm.phone}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, phone: e.target.value })
                  }
                  data-ocid="contacts.contact_phone.input"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowAddContact(false)}
                data-ocid="contacts.add_contact.cancel_button"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddContact}
                disabled={addContact.isPending}
                data-ocid="contacts.add_contact.submit_button"
              >
                {addContact.isPending ? "Adding..." : "Add Contact"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Import Dialog */}
        <Dialog open={showImport} onOpenChange={setShowImport}>
          <DialogContent data-ocid="contacts.import.dialog">
            <DialogHeader>
              <DialogTitle>Import Contacts</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <p className="text-sm text-muted-foreground">
                Paste contacts one per line in{" "}
                <code className="bg-muted px-1 rounded">name,phone</code>{" "}
                format:
              </p>
              <Textarea
                placeholder={
                  "Rajesh Kumar,919876543210\nPriya Sharma,919123456789"
                }
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                rows={8}
                className="font-mono text-xs"
                data-ocid="contacts.import.textarea"
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowImport(false)}
                data-ocid="contacts.import.cancel_button"
              >
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={importContacts.isPending}
                data-ocid="contacts.import.submit_button"
              >
                {importContacts.isPending ? "Importing..." : "Import"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
