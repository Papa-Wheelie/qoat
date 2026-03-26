"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

type Props = {
  email: string;
  emailVerified: boolean;
  hasPassword: boolean;
};

function DeleteModal({
  onClose,
  onConfirm,
  loading,
}: {
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  const [input, setInput] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-[16px] p-8 max-w-md w-full space-y-6 shadow-2xl">
        <h2 className="text-xl font-extrabold tracking-tight text-on-surface">Delete account</h2>
        <p className="text-sm text-on-surface-variant leading-relaxed">
          This will permanently delete your account and all your quotes. This cannot be undone.
        </p>
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-on-surface-variant">
            Type <span className="font-bold text-on-surface">DELETE</span> to confirm
          </label>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoComplete="off"
            className="w-full bg-surface border border-outline-variant rounded-[12px] p-4 text-on-surface focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
            placeholder="DELETE"
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-[12px] text-sm font-semibold text-on-surface-variant border border-outline-variant hover:border-primary hover:text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={input !== "DELETE" || loading}
            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-[12px] text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Deleting…" : "Delete my account"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SettingsContent({ email, emailVerified, hasPassword }: Props) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  const [showDelete, setShowDelete] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    setPwSuccess(false);

    if (newPassword !== confirmPassword) {
      setPwError("New passwords do not match");
      return;
    }

    setPwLoading(true);
    const res = await fetch("/api/settings/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    setPwLoading(false);

    if (!res.ok) {
      const d = await res.json();
      setPwError(d.error ?? "Failed to update password");
      return;
    }

    setPwSuccess(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setPwSuccess(false), 4000);
  }

  async function handleDeleteAccount() {
    setDeleteLoading(true);
    const res = await fetch("/api/settings/delete-account", { method: "DELETE" });
    if (res.ok) {
      await signOut({ callbackUrl: "/" });
    } else {
      setDeleteLoading(false);
      setShowDelete(false);
    }
  }

  return (
    <div className="space-y-10">
      {/* Email */}
      <section className="bg-surface-container-lowest rounded-[16px] px-6 py-8 space-y-3">
        <p className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant">Email</p>
        <div className="flex items-center gap-3">
          <p className="text-on-surface font-medium">{email}</p>
          {emailVerified ? (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800">Verified</span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800">Unverified</span>
          )}
        </div>
      </section>

      {/* Change password — email/password users only */}
      {hasPassword && (
        <section className="bg-surface-container-lowest rounded-[16px] px-6 py-8 space-y-6">
          <p className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant">Change password</p>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {[
              { id: "currentPassword", label: "Current password", value: currentPassword, set: setCurrentPassword },
              { id: "newPassword", label: "New password", value: newPassword, set: setNewPassword },
              { id: "confirmPassword", label: "Confirm new password", value: confirmPassword, set: setConfirmPassword },
            ].map(({ id, label, value, set }) => (
              <div key={id} className="space-y-2">
                <label htmlFor={id} className="block text-sm font-semibold tracking-wide text-primary/70 uppercase px-1">
                  {label}
                </label>
                <input
                  id={id}
                  type="password"
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  autoComplete="off"
                  required
                  className="w-full bg-surface border border-outline-variant rounded-[12px] p-4 text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                />
              </div>
            ))}

            {pwError && <p className="text-sm text-error font-medium px-1">{pwError}</p>}

            <div className="flex items-center gap-4 pt-2">
              <button
                type="submit"
                disabled={pwLoading}
                className="px-6 py-3 bg-[#111111] text-white rounded-[12px] text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {pwLoading ? "Updating…" : "Update password"}
              </button>
              {pwSuccess && <p className="text-sm font-medium text-green-700">Password updated</p>}
            </div>
          </form>
        </section>
      )}

      {/* Danger zone */}
      <section className="space-y-4">
        <p className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant">Danger zone</p>
        <div className="rounded-[16px] border border-red-200 px-6 py-6 flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-on-surface">Delete account</p>
            <p className="text-sm text-on-surface-variant mt-0.5">Permanently remove your account and all data.</p>
          </div>
          <button
            onClick={() => setShowDelete(true)}
            className="shrink-0 px-4 py-2.5 rounded-[12px] text-sm font-bold text-red-600 border border-red-300 hover:bg-red-50 transition-colors"
          >
            Delete account
          </button>
        </div>
      </section>

      {showDelete && (
        <DeleteModal
          onClose={() => setShowDelete(false)}
          onConfirm={handleDeleteAccount}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}
