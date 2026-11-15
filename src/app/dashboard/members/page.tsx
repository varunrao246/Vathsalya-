"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Shield,
  KeyRound,
  Copy,
  Check,
  Trash2,
  Clock,
  Loader2,
  XCircle,
} from "lucide-react";

interface Member {
  id: string;
  profile_id: string;
  role: string;
  can_manage_meds: boolean;
  can_manage_appointments: boolean;
  can_confirm_doses: boolean;
  status: string;
  joined_at: string;
  profile?: {
    full_name: string;
    email: string;
    phone: string | null;
  };
}

interface Invitation {
  id: string;
  invitedRole: string;
  canManageMeds: boolean;
  canConfirmDoses: boolean;
  expiresAt: string;
  status: "PENDING" | "REDEEMED" | "EXPIRED" | "REVOKED";
  usedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

export default function MemberManagementPage() {
  const [profileId, setProfileId] = useState<string>("sample-profile-id");
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite Generator Modal State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [invitedRole, setInvitedRole] = useState<"FAMILY_ADMIN" | "FAMILY_VIEWER" | "CARETAKER">("FAMILY_ADMIN");
  const [canManageMeds, setCanManageMeds] = useState(false);
  const [canConfirmDoses, setCanConfirmDoses] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<{ passcode: string; expiresAt: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load active profile and member data
  useEffect(() => {
    async function loadData() {
      try {
        const profileRes = await fetch("/api/healthcare-profiles");
        const profileJson = await profileRes.json();
        let targetId = "sample-profile-id";

        if (profileJson.success && profileJson.data && profileJson.data.length > 0) {
          targetId = profileJson.data[0].healthcare_profile.id;
          setProfileId(targetId);

          // Load members
          const membersRes = await fetch(`/api/profile-access/members?healthcareProfileId=${targetId}`);
          const membersJson = await membersRes.json();
          if (membersJson.success) {
            setMembers(membersJson.data.members || []);
          }

          // Load invitations
          const inviteRes = await fetch(`/api/profile-access/invitations?healthcareProfileId=${targetId}`);
          const inviteJson = await inviteRes.json();
          if (inviteJson.success) {
            setInvitations(inviteJson.data || []);
          }
        }
      } catch (err) {
        console.error("Failed to load members or invitations", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Handle invitation creation
  const handleGenerateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setErrorMessage(null);
    setGeneratedCode(null);

    try {
      const res = await fetch("/api/profile-access/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          healthcareProfileId: profileId,
          invitedRole,
          canManageMeds,
          canConfirmDoses,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to generate invitation.");
      }

      setGeneratedCode({
        passcode: json.data.passcode,
        expiresAt: json.data.expiresAt,
      });

      // Refresh invitations list
      const inviteRes = await fetch(`/api/profile-access/invitations?healthcareProfileId=${profileId}`);
      const inviteJson = await inviteRes.json();
      if (inviteJson.success) {
        setInvitations(inviteJson.data || []);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error generating passcode.");
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode.passcode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Revoke member access
  const handleRevokeMember = async (memberId: string, role: string) => {
    if (role === "ELDERLY") {
      alert("Security Violation: Cannot revoke the elderly profile owner!");
      return;
    }

    if (!confirm("Are you sure you want to revoke this member's access?")) return;

    try {
      const res = await fetch(`/api/profile-access/${memberId}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        alert(json.error?.message || "Failed to revoke member.");
        return;
      }
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch (err) {
      console.error("Revocation error", err);
    }
  };

  // Revoke invitation
  const handleRevokeInvitation = async (invitationId: string) => {
    if (!confirm("Are you sure you want to revoke this pending invitation?")) return;

    try {
      const res = await fetch(`/api/profile-access/invitations/${invitationId}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        alert(json.error?.message || "Failed to revoke invitation.");
        return;
      }
      setInvitations((prev) =>
        prev.map((inv) => (inv.id === invitationId ? { ...inv, status: "REVOKED" } : inv))
      );
    } catch (err) {
      console.error("Invitation revocation error", err);
    }
  };

  // Sample fallback data if offline/demo
  const displayMembers: Member[] =
    members.length > 0
      ? members
      : [
          {
            id: "mem-1",
            profile_id: "user-1",
            role: "ELDERLY",
            can_manage_meds: true,
            can_manage_appointments: true,
            can_confirm_doses: true,
            status: "ACTIVE",
            joined_at: "2026-11-15T09:00:00.000Z",
            profile: {
              full_name: "Appaji Rao",
              email: "appaji@example.com",
              phone: "+91 98765 00000",
            },
          },
          {
            id: "mem-2",
            profile_id: "user-2",
            role: "FAMILY_ADMIN",
            can_manage_meds: true,
            can_manage_appointments: true,
            can_confirm_doses: true,
            status: "ACTIVE",
            joined_at: "2026-11-15T09:15:00.000Z",
            profile: {
              full_name: "Priya Sharma",
              email: "priya@example.com",
              phone: "+91 98765 43210",
            },
          },
          {
            id: "mem-3",
            profile_id: "user-3",
            role: "CARETAKER",
            can_manage_meds: false,
            can_manage_appointments: false,
            can_confirm_doses: true,
            status: "ACTIVE",
            joined_at: "2026-11-15T09:30:00.000Z",
            profile: {
              full_name: "Suresh Kumar",
              email: "suresh.nurse@example.com",
              phone: "+91 98450 11111",
            },
          },
        ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-[#1E3A2F]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#EFECE6]">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider px-3 py-1 rounded-full bg-[#EBF2EE] text-[#1E3A2F]">
            Authorized Access Governance
          </span>
          <h1 className="mt-2 text-3xl font-extrabold text-[#1E3A2F]">
            Member &amp; Passcode Access Management
          </h1>
          <p className="text-sm text-[#5C6460]">
            Manage authorized family members and caretakers. Generate secure, time-limited 6-digit passcodes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowInviteModal(true)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#1E3A2F] hover:bg-[#162E25] text-white font-bold text-sm shadow-xs transition-colors cursor-pointer"
          >
            <KeyRound className="w-4 h-4" />
            Generate Access Passcode
          </button>
        </div>
      </div>

      {/* Security Directives Box */}
      <div className="p-6 rounded-3xl bg-[#EBF2EE] border border-[#D5E2D9] space-y-2">
        <div className="flex items-center gap-2 text-[#1E3A2F] font-bold text-sm">
          <Shield className="w-5 h-5 text-[#1E3A2F]" />
          <span>Passcode Security &amp; RBAC Architecture</span>
        </div>
        <p className="text-xs text-[#5C6460] leading-relaxed">
          • Passcodes are single-use, hashed via HMAC-SHA256, and automatically expire in 48 hours.
          <br />• Roles are resolved from the verified database record upon redemption. Clients cannot self-assign elevated roles.
          <br />• The elderly profile owner cannot be revoked by family administrators.
        </p>
      </div>

      {/* Section 1: Authorized Members List */}
      <div className="p-8 rounded-3xl bg-white border border-[#EFECE6] shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#1E3A2F]" />
            <h2 className="text-xl font-bold text-[#1E3A2F]">Currently Authorized Members</h2>
          </div>
          <span className="text-xs text-[#5C6460]">
            {displayMembers.length} active member{displayMembers.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase bg-[#FDFBF7] text-[#5C6460] border-b border-[#EFECE6]">
              <tr>
                <th className="py-3 px-4">Member Name</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4">Permissions</th>
                <th className="py-3 px-4">Joined Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFECE6]">
              {displayMembers.map((member) => (
                <tr key={member.id} className="hover:bg-[#FDFBF7]/60 transition-colors">
                  <td className="py-4 px-4">
                    <p className="font-bold text-[#1E3A2F]">
                      {member.profile?.full_name || "Authorized User"}
                    </p>
                    <p className="text-xs text-[#5C6460]">
                      {member.profile?.email || "Email verified"} {member.profile?.phone ? `• ${member.profile.phone}` : ""}
                    </p>
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                        member.role === "ELDERLY"
                          ? "bg-[#1E3A2F] text-white"
                          : member.role === "FAMILY_ADMIN"
                          ? "bg-amber-100 text-amber-900"
                          : member.role === "CARETAKER"
                          ? "bg-blue-100 text-blue-900"
                          : "bg-slate-100 text-slate-800"
                      }`}
                    >
                      {member.role === "ELDERLY" && "Elderly Owner"}
                      {member.role === "FAMILY_ADMIN" && "Family Admin"}
                      {member.role === "FAMILY_VIEWER" && "Family Viewer"}
                      {member.role === "CARETAKER" && "Caretaker"}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-xs text-[#5C6460]">
                    <div>Meds: {member.can_manage_meds ? "Manage ✓" : "View Only"}</div>
                    <div>Doses: {member.can_confirm_doses ? "Confirm ✓" : "None"}</div>
                  </td>
                  <td className="py-4 px-4 text-xs text-[#5C6460]">
                    {new Date(member.joined_at).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-4 text-right">
                    {member.role !== "ELDERLY" ? (
                      <button
                        onClick={() => handleRevokeMember(member.id, member.role)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-red-700 hover:text-red-900 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Revoke Access
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-[#607B6E] italic">
                        Owner (Permanent)
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Invitations History */}
      <div className="p-8 rounded-3xl bg-white border border-[#EFECE6] shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#1E3A2F]" />
            <h2 className="text-xl font-bold text-[#1E3A2F]">Invitation Passcode History</h2>
          </div>
          <span className="text-xs text-[#5C6460]">
            {invitations.length} invitation{invitations.length === 1 ? "" : "s"} logged
          </span>
        </div>

        {invitations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase bg-[#FDFBF7] text-[#5C6460] border-b border-[#EFECE6]">
                <tr>
                  <th className="py-3 px-4">Role Invited</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Expiration (48h)</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFECE6]">
                {invitations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#FDFBF7]/60">
                    <td className="py-3.5 px-4 font-semibold text-[#1E3A2F]">
                      {inv.invitedRole}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          inv.status === "PENDING"
                            ? "bg-amber-100 text-amber-900"
                            : inv.status === "REDEEMED"
                            ? "bg-emerald-100 text-emerald-900"
                            : inv.status === "REVOKED"
                            ? "bg-red-100 text-red-900"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#5C6460]">
                      {new Date(inv.expiresAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {inv.status === "PENDING" && (
                        <button
                          onClick={() => handleRevokeInvitation(inv.id)}
                          className="text-xs font-bold text-red-700 hover:underline cursor-pointer"
                        >
                          Revoke Code
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-[#5C6460] italic py-2">
            No active invitation records yet. Click &quot;Generate Access Passcode&quot; above to invite a family member or caretaker.
          </p>
        )}
      </div>

      {/* ============================================================ */}
      {/* MODAL: Generate Passcode */}
      {/* ============================================================ */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-xl border border-[#EFECE6]">
            <div className="flex items-center justify-between pb-4 border-b border-[#EFECE6]">
              <div className="flex items-center gap-2 text-[#1E3A2F]">
                <KeyRound className="w-6 h-6" />
                <h2 className="text-xl font-bold">Generate 6-Digit Passcode</h2>
              </div>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setGeneratedCode(null);
                  setErrorMessage(null);
                }}
                className="text-[#5C6460] hover:text-[#1E3A2F]"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 text-red-800 text-xs font-medium">
                {errorMessage}
              </div>
            )}

            {!generatedCode ? (
              <form onSubmit={handleGenerateInvite} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-[#1F2421] mb-1">
                    Select User-Facing Role
                  </label>
                  <select
                    value={invitedRole}
                    onChange={(e) =>
                      setInvitedRole(e.target.value as "FAMILY_ADMIN" | "FAMILY_VIEWER" | "CARETAKER")
                    }
                    className="w-full px-4 py-3 rounded-xl border border-[#EFECE6] bg-[#FDFBF7] text-sm text-[#1F2421]"
                  >
                    <option value="FAMILY_ADMIN">Family Member (Admin: Manage Schedules &amp; Invites)</option>
                    <option value="FAMILY_VIEWER">Family Member (Viewer: Read-Only Adherence)</option>
                    <option value="CARETAKER">Caretaker (Shift Dose Administration)</option>
                  </select>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#607B6E]">
                    Calibrated Permissions
                  </label>
                  <label className="flex items-center gap-2 text-sm text-[#1F2421] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={canManageMeds}
                      onChange={(e) => setCanManageMeds(e.target.checked)}
                      disabled={invitedRole === "FAMILY_VIEWER"}
                      className="rounded text-[#1E3A2F] focus:ring-[#1E3A2F]"
                    />
                    <span>Allow managing and editing medication schedules</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-[#1F2421] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={canConfirmDoses}
                      onChange={(e) => setCanConfirmDoses(e.target.checked)}
                      disabled={invitedRole === "FAMILY_VIEWER"}
                      className="rounded text-[#1E3A2F] focus:ring-[#1E3A2F]"
                    />
                    <span>Allow confirming medication doses as administered</span>
                  </label>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                  <strong>Expiry Note:</strong> Passcodes expire in 48 hours and can only be used once. The invited individual must register or sign in before entering this passcode on the Join screen.
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-5 py-2.5 rounded-xl border border-[#EFECE6] text-sm font-semibold text-[#5C6460] hover:bg-[#FDFBF7]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={generating}
                    className="px-6 py-2.5 rounded-xl bg-[#1E3A2F] hover:bg-[#162E25] text-white font-bold text-sm shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Create Passcode"
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6 text-center">
                <div className="p-6 rounded-3xl bg-[#EBF2EE] border-2 border-[#1E3A2F] space-y-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#607B6E]">
                    Your 6-Digit Invitation Code
                  </span>
                  <div className="text-4xl font-mono font-extrabold tracking-[0.4em] text-[#1E3A2F]">
                    {generatedCode.passcode}
                  </div>
                  <p className="text-xs text-[#5C6460]">
                    Valid for 48 hours (Expires: {new Date(generatedCode.expiresAt).toLocaleTimeString()})
                  </p>
                </div>

                <button
                  onClick={copyToClipboard}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#1E3A2F] hover:bg-[#162E25] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      Copied to Clipboard!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Passcode
                    </>
                  )}
                </button>

                <p className="text-xs text-[#5C6460] text-left">
                  <strong>Instructions to share:</strong> &quot;Log in to VATSALYA at <code className="bg-slate-100 px-1 py-0.5 rounded">/join</code> and enter passcode <strong>{generatedCode.passcode}</strong> to access this healthcare profile.&quot;
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(false);
                    setGeneratedCode(null);
                  }}
                  className="w-full py-2.5 rounded-xl border border-[#EFECE6] text-xs font-bold text-[#5C6460] hover:bg-[#FDFBF7]"
                >
                  Done &amp; Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
