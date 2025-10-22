import React from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Profil: React.FC = () => {
  const me = useAuthStore((s) => s.user);

  if (!me) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card className="rounded-2xl shadow-card">
          <CardHeader>
            <CardTitle>Profil utilisateur</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Aucun utilisateur connecté.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="rounded-2xl shadow-card">
        <CardHeader>
          <CardTitle>Profil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Nom d’utilisateur</p>
              <p className="text-lg font-medium">{me.username}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="text-lg font-medium">{me.email}</p>
            </div>
            {me.fullName && (
              <div>
                <p className="text-sm text-muted-foreground">Nom complet</p>
                <p className="text-lg font-medium">{me.fullName}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Rôle</p>
              <Badge variant="secondary" className="text-base px-3 py-1 rounded-xl">
                {me.role === "admin" ? "Administrateur" : "Utilisateur"}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Membre depuis</p>
              <p className="text-lg font-medium">
                {new Date(me.joinedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profil;
