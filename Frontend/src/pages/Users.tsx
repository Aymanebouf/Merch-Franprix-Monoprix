import React, { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import type { Role, UserCreateInput, UserUpdateInput } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Shield } from "lucide-react";

const Users: React.FC = () => {
  const me = useAuthStore((s) => s.user);
  const users = useAuthStore((s) => s.users);
  const loadUsers = useAuthStore((s) => s.loadUsers);
  const createUser = useAuthStore((s) => s.createUser);
  const updateUser = useAuthStore((s) => s.updateUser);
  const deleteUser = useAuthStore((s) => s.deleteUser);

  // Charger la liste au montage
  useEffect(() => {
    loadUsers().catch(() => {/* noop */});
  }, [loadUsers]);

  // Formulaire création
  const [openCreate, setOpenCreate] = useState(false);
  const [cEmail, setCEmail] = useState("");
  const [cUsername, setCUsername] = useState("");
  const [cFullName, setCFullName] = useState("");
  const [cPassword, setCPassword] = useState("");
  const [cRole, setCRole] = useState<Role>("user");
  const [cErr, setCErr] = useState("");

  // Edition
  const [openEditId, setOpenEditId] = useState<number | null>(null);
  const editing = useMemo(
    () => users.find((u) => u.id === openEditId),
    [users, openEditId]
  );
  const [eUsername, setEUsername] = useState("");
  const [eFullName, setEFullName] = useState("");
  const [ePassword, setEPassword] = useState("");
  const [eRole, setERole] = useState<Role>("user");
  const [eErr, setEErr] = useState("");

  const onCreate = async () => {
    setCErr("");
    const payload: UserCreateInput = {
      email: cEmail.trim(),
      username: cUsername.trim() || undefined,
      fullName: cFullName.trim() || undefined,
      password: cPassword,
      role: cRole,
    };
    const res = await createUser(payload);
    if (!res.ok) {
      setCErr(res.error);
      return;
    }
    setOpenCreate(false);
    setCEmail(""); setCUsername(""); setCFullName(""); setCPassword(""); setCRole("user");
  };

  const onOpenEdit = (id: number) => {
    const u = users.find((x) => x.id === id);
    if (!u) return;
    setOpenEditId(id);
    setEUsername(u.username || "");
    setEFullName(u.fullName || "");
    setERole(u.role);
    setEPassword(""); // vide → inchangé
    setEErr("");
  };

  const onSaveEdit = async () => {
    if (!openEditId) return;
    setEErr("");
    const patch: UserUpdateInput = {
      username: eUsername.trim() || undefined,
      fullName: eFullName.trim() || undefined,
      role: eRole,
      ...(ePassword ? { password: ePassword } : {}),
    };
    const res = await updateUser(openEditId, patch);
    if (!res.ok) { setEErr(res.error); return; }
    setOpenEditId(null);
  };

  const onDelete = async (id: number) => {
    const ok = confirm("Supprimer cet utilisateur ?");
    if (!ok) return;
    const res = await deleteUser(id);
    if (!res.ok) alert(res.error);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight">Utilisateurs</h2>

        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
          <DialogTrigger asChild>
            <Button className="rounded-xl gap-2">
              <Plus className="h-4 w-4" />
              Nouvel utilisateur
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>Créer un utilisateur</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input value={cEmail} onChange={(e) => setCEmail(e.target.value)} placeholder="ex: user@acme.com" />
              </div>
              <div className="space-y-2">
                <Label>Nom d’utilisateur</Label>
                <Input value={cUsername} onChange={(e) => setCUsername(e.target.value)} placeholder="(optionnel)" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Nom complet</Label>
                <Input value={cFullName} onChange={(e) => setCFullName(e.target.value)} placeholder="(optionnel)" />
              </div>
              <div className="space-y-2">
                <Label>Mot de passe *</Label>
                <Input type="password" value={cPassword} onChange={(e) => setCPassword(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Rôle</Label>
                <Select value={cRole} onValueChange={(v: Role) => setCRole(v)}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Choisir un rôle" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Utilisateur</SelectItem>
                    <SelectItem value="admin">Administrateur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {cErr && <p className="text-sm text-destructive">{cErr}</p>}
            <DialogFooter>
              <Button onClick={onCreate} className="rounded-xl">Créer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="rounded-2xl shadow-card">
        <CardHeader>
          <CardTitle>Liste des utilisateurs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Nom complet</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Membre depuis</TableHead>
                  <TableHead className="w-36 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.username}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.fullName || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={u.role === "admin" ? "default" : "secondary"} className="rounded-xl gap-1">
                        <Shield className="h-3.5 w-3.5" />
                        {u.role === "admin" ? "Admin" : "User"}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(u.joinedAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Dialog open={openEditId === u.id} onOpenChange={(o) => !o && setOpenEditId(null)}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl mr-2"
                            onClick={() => onOpenEdit(u.id)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-2xl">
                          <DialogHeader>
                            <DialogTitle>Modifier l’utilisateur</DialogTitle>
                          </DialogHeader>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Nom d’utilisateur</Label>
                              <Input value={eUsername} onChange={(e) => setEUsername(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                              <Label>Nom complet</Label>
                              <Input value={eFullName} onChange={(e) => setEFullName(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                              <Label>Nouveau mot de passe</Label>
                              <Input type="password" value={ePassword} onChange={(e) => setEPassword(e.target.value)} placeholder="(laisser vide = inchangé)" />
                            </div>
                            <div className="space-y-2">
                              <Label>Rôle</Label>
                              <Select value={eRole} onValueChange={(v: Role) => setERole(v)}>
                                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="user">Utilisateur</SelectItem>
                                  <SelectItem value="admin">Administrateur</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          {eErr && <p className="text-sm text-destructive">{eErr}</p>}
                          <DialogFooter>
                            <Button onClick={onSaveEdit} className="rounded-xl">Enregistrer</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => onDelete(u.id)}
                        disabled={me?.id === u.id}
                        title={me?.id === u.id ? "Impossible de supprimer votre propre compte pendant la session" : "Supprimer"}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                      Aucun utilisateur.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Users;
