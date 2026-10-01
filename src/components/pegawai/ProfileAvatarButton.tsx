"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { EditProfileModal } from "@/components/shared/EditProfileModal";

export function ProfileAvatarButton({
  photoUrl,
  fullName,
  username,
  email,
}: {
  photoUrl: string | null | undefined;
  fullName: string;
  username: string;
  email: string;
}) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState({
    username,
    email,
    photoUrl: photoUrl ?? null,
  });

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-blue/20"
        aria-label="Ubah akun saya"
      >
        <Avatar src={current.photoUrl} name={fullName} className="size-12" />
        <span className="absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-brand-blue text-white shadow ring-2 ring-surface transition-transform group-hover:scale-110">
          <Pencil className="size-2.5" />
        </span>
      </button>

      <EditProfileModal
        open={open}
        onClose={() => setOpen(false)}
        currentUsername={current.username}
        currentEmail={current.email}
        showPhotoField
        currentPhotoUrl={current.photoUrl}
        onSaved={({ username: u, email: e, photo_url }) =>
          setCurrent((prev) => ({
            username: u,
            email: e,
            photoUrl: photo_url !== undefined ? photo_url : prev.photoUrl,
          }))
        }
      />
    </>
  );
}
