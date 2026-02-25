"use client";

import Logo from "@/components/Logo";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";

type Team = {
  id: string;
  name: string;
  ownerId: string;
  isOwner: boolean;
  createdAt: string;
};

type Member = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  teamId: string;
};

const ROLE_LABELS: Record<string, string> = {
  owner: "Propriétaire",
  admin: "Administrateur",
  member: "Membre",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Actif",
  pending: "En attente",
};

export default function TeamPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<Member[]>([]);

  const loadTeams = useCallback(() => {
    setLoading(true);
    fetch("/api/teams")
      .then((r) => r.json())
      .then((data) => {
        setTeams(data.teams ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const loadMembers = useCallback((teamId: string) => {
    setMembersLoading(true);
    fetch(`/api/teams/${teamId}/members`)
      .then((r) => r.json())
      .then((data) => {
        setMembers(data.members ?? []);
        setMembersLoading(false);
      })
      .catch(() => setMembersLoading(false));
  }, []);

  const loadPendingInvites = useCallback(() => {
    fetch("/api/team")
      .then((r) => r.json())
      .then((data) => {
        const pending = (data.members ?? []).filter(
          (m: Member) => m.status === "pending"
        );
        setPendingInvites(pending);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/teams")
      .then((r) => r.json())
      .then((data) => {
        setTeams(data.teams ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch("/api/team")
      .then((r) => r.json())
      .then((data) => {
        const pending = (data.members ?? []).filter(
          (m: Member) => m.status === "pending"
        );
        setPendingInvites(pending);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedTeamId) {
      fetch(`/api/teams/${selectedTeamId}/members`)
        .then((r) => r.json())
        .then((data) => {
          setMembers(data.members ?? []);
          setMembersLoading(false);
        })
        .catch(() => setMembersLoading(false));
    }
  }, [selectedTeamId]);

  async function createTeam() {
    if (!teamName.trim()) return;
    await fetch("/api/teams/create", {
      method: "POST",
      body: JSON.stringify({ name: teamName.trim() }),
      headers: { "Content-Type": "application/json" },
    });
    setTeamName("");
    loadTeams();
  }

  async function inviteMember() {
    if (!inviteEmail || !selectedTeamId) return;
    await fetch("/api/teams/invite", {
      method: "POST",
      body: JSON.stringify({
        teamId: selectedTeamId,
        email: inviteEmail,
        role: inviteRole,
      }),
      headers: { "Content-Type": "application/json" },
    });
    setInviteEmail("");
    setInviteRole("member");
    loadMembers(selectedTeamId);
  }

  async function acceptInvite(memberId: string) {
    await fetch("/api/teams/accept", {
      method: "POST",
      body: JSON.stringify({ memberId }),
      headers: { "Content-Type": "application/json" },
    });
    loadTeams();
    loadPendingInvites();
  }

  async function removeMember(memberId: string) {
    if (!selectedTeamId) return;
    await fetch(`/api/teams/${selectedTeamId}/members`, {
      method: "DELETE",
      body: JSON.stringify({ memberId }),
      headers: { "Content-Type": "application/json" },
    });
    loadMembers(selectedTeamId);
  }

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);

  return (
    <div className="min-h-screen bg-bg text-white flex flex-col">
      {/* Topbar */}
      <div className="flex items-center justify-between px-10 py-6 border-b border-border bg-[#111]/80 backdrop-blur-md">
        <Logo />
        <Link
          href="/dashboard"
          className="text-gray-300 hover:text-white premium-hover"
        >
          Retour au tableau de bord
        </Link>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto mt-16 px-6 fade-in w-full">
        <h1 className="text-3xl font-bold tracking-tight mb-8">
          Gestion d&apos;équipe
        </h1>

        {/* Pending invitations */}
        {pendingInvites.length > 0 && (
          <div className="premium-card p-6 flex flex-col gap-4 mb-10 border border-yellow-600/30">
            <h2 className="text-xl font-semibold text-yellow-400">
              📩 Invitations en attente
            </h2>
            {pendingInvites.map((inv) => (
              <div
                key={inv.id}
                className="flex justify-between items-center border-b border-border pb-3"
              >
                <div>
                  <span className="font-semibold">
                    {teams.find((t) => t.id === inv.teamId)?.name ||
                      `Équipe #${inv.teamId.slice(0, 8)}`}
                  </span>
                  <span className="text-gray-400 text-sm ml-2">
                    ({ROLE_LABELS[inv.role] || inv.role})
                  </span>
                </div>
                <button
                  onClick={() => acceptInvite(inv.id)}
                  className="px-3 py-1 bg-green-600 rounded-smooth text-sm hover:bg-green-500 transition-all"
                >
                  Accepter
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Create Team */}
        <div className="premium-card p-6 flex flex-col gap-4 mb-10">
          <h2 className="text-xl font-semibold">Créer une équipe</h2>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Nom de l'équipe"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="flex-1 bg-surfaceLight border border-border rounded-smooth px-4 py-2 focus:outline-none focus:border-accent"
            />
            <button
              onClick={createTeam}
              className="px-4 py-2 bg-accent rounded-smooth premium-hover shadow-soft"
            >
              Créer
            </button>
          </div>
        </div>

        {/* Team List */}
        <div className="premium-card p-6 flex flex-col gap-4 mb-10">
          <h2 className="text-xl font-semibold">Mes équipes</h2>
          {loading ? (
            <p className="text-gray-400">Chargement des équipes...</p>
          ) : teams.length === 0 ? (
            <p className="text-gray-400">
              Aucune équipe pour le moment. Créez-en une ci-dessus.
            </p>
          ) : (
            teams.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTeamId(t.id)}
                className={`flex justify-between items-center border rounded-smooth px-4 py-3 transition-all text-left ${
                  selectedTeamId === t.id
                    ? "border-accent bg-accent/10"
                    : "border-border hover:bg-white/5"
                }`}
              >
                <div>
                  <span className="font-semibold">{t.name}</span>
                  <span className="text-gray-400 text-sm ml-2">
                    {t.isOwner ? "(Propriétaire)" : "(Membre)"}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Selected Team Details */}
        {selectedTeam && (
          <>
            {/* Members */}
            <div className="premium-card p-6 flex flex-col gap-4 mb-10">
              <h2 className="text-xl font-semibold">
                Membres — {selectedTeam.name}
              </h2>
              {membersLoading ? (
                <p className="text-gray-400">Chargement des membres...</p>
              ) : members.length === 0 ? (
                <p className="text-gray-400">Aucun membre dans cette équipe.</p>
              ) : (
                members.map((m) => (
                  <div
                    key={m.id}
                    className="flex justify-between items-center border-b border-border pb-3"
                  >
                    <div>
                      <span className="font-semibold">
                        {m.name || m.email}
                      </span>
                      <span className="text-gray-400 text-sm ml-2">
                        ({ROLE_LABELS[m.role] || m.role})
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-smooth ${
                          m.status === "active"
                            ? "bg-green-600/20 text-green-400"
                            : "bg-yellow-600/20 text-yellow-400"
                        }`}
                      >
                        {STATUS_LABELS[m.status] || m.status}
                      </span>
                      {m.role !== "owner" && selectedTeam.isOwner && (
                        <button
                          onClick={() => removeMember(m.id)}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          Retirer
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Invite */}
            {selectedTeam.isOwner && (
              <div className="premium-card p-6 flex flex-col gap-4 mb-10">
                <h2 className="text-xl font-semibold">Inviter un membre</h2>
                <div className="flex gap-3">
                  <input
                    type="email"
                    placeholder="email@exemple.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="flex-1 bg-surfaceLight border border-border rounded-smooth px-4 py-2 focus:outline-none focus:border-accent"
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="bg-surfaceLight border border-border rounded-smooth px-4 py-2 focus:outline-none focus:border-accent"
                  >
                    <option value="member">Membre</option>
                    <option value="admin">Administrateur</option>
                  </select>
                  <button
                    onClick={inviteMember}
                    className="px-4 py-2 bg-accent rounded-smooth premium-hover shadow-soft"
                  >
                    Inviter
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto py-10 text-center text-gray-500 text-sm">
        Prestige Build © {new Date().getFullYear()}
      </div>
    </div>
  );
}
