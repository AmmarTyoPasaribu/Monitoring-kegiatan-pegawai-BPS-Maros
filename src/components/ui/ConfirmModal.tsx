"use client";

import { Modal } from "./Modal";
import { Button } from "./Button";
import { AlertTriangle, CheckCircle2, HelpCircle } from "lucide-react";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary" | "success";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Konfirmasi",
  cancelLabel = "Batal",
  variant = "primary",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title} maxWidth="max-w-sm">
      <div className="flex gap-3">
        <div
          className={
            variant === "danger"
              ? "flex size-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600"
              : variant === "success"
                ? "flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-green/10 text-brand-green"
                : "flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue"
          }
        >
          {variant === "danger" ? (
            <AlertTriangle className="size-5" />
          ) : variant === "success" ? (
            <CheckCircle2 className="size-5" />
          ) : (
            <HelpCircle className="size-5" />
          )}
        </div>
        <p className="text-sm text-slate-600 pt-2">{description}</p>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button variant={variant} onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
