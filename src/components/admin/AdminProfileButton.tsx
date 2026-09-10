"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { EditProfileModal } from "@/components/shared/EditProfileModal";

interface AdminUser {
  full_name: string;
  username: string;
  email: string;
  photo_url: string | null;
}

export function AdminProfileButton({ user }: { user: AdminUser }) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(user);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-w-0 items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-slate-100"
        aria-label="Ubah akun saya"
      >
        <Avatar src={current.photo_url} name={current.full_name} className="size-9 shrink-0 text-xs" />
        <span className="hidden min-w-0 leading-tight sm:block">
          <span className="block truncate text-sm font-semibold text-slate-900">
            {current.full_name}
          </span>
          <span className="block text-xs text-slate-400">Administrator</span>
        </span>
      </button>

      <EditProfileModal
        open={open}
        onClose={() => setOpen(false)}
        currentUsername={current.username}
        currentEmail={current.email}
        showProfileFields
        currentFullName={current.full_name}
        currentPhotoUrl={current.photo_url}
        onSaved={(data) =>
          setCurrent((prev) => ({
            full_name: data.full_name ?? prev.full_name,
            username: data.username,
            email: data.email,
            photo_url: data.photo_url ?? prev.photo_url,
          }))
        }
      />
    </>
  );
}
