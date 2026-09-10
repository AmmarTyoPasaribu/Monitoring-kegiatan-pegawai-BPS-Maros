"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { EmployeeFormModal, type Employee } from "@/components/admin/EmployeeFormModal";

export function KelolaPegawaiClient({ initialEmployees }: { initialEmployees: Employee[] }) {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [formOpen, setFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState(false);

  function openCreate() {
    setEditingEmployee(null);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  }

  function openEdit(emp: Employee) {
    setEditingEmployee(emp);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  }

  function handleSaved(saved: Employee) {
    setEmployees((prev) => {
      const idx = prev.findIndex((e) => e.id === saved.id);
      if (idx === -1) return [...prev, saved].sort((a, b) => a.full_name.localeCompare(b.full_name));
      const next = [...prev];
      next[idx] = saved;
      return next;
    });
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/employees/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal menghapus pegawai");
        return;
      }
      toast.success(`${deleteTarget.full_name} berhasil dihapus`);
      setEmployees((prev) => prev.filter((e) => e.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="size-4" /> Tambah Pegawai
        </Button>
      </div>

      <div className="card-surface overflow-hidden">
        {employees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <UserRound className="size-10 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-500">Belum ada data pegawai</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Nama</th>
                  <th className="px-5 py-3 font-semibold">Username</th>
                  <th className="px-5 py-3 font-semibold">Email</th>
                  <th className="px-5 py-3 font-semibold">Divisi</th>
                  <th className="px-5 py-3 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50">
                    <td className="flex items-center gap-3 px-5 py-3">
                      <Avatar src={emp.photo_url} name={emp.full_name} className="size-9 text-xs" />
                      <span className="font-medium text-slate-900">{emp.full_name}</span>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{emp.username}</td>
                    <td className="px-5 py-3 text-slate-600">{emp.email}</td>
                    <td className="px-5 py-3 text-slate-600">{emp.division || "-"}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(emp)}
                          className="flex size-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600 transition-colors hover:bg-amber-500 hover:text-white"
                          aria-label={`Edit ${emp.full_name}`}
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(emp)}
                          className="flex size-8 items-center justify-center rounded-lg bg-red-100 text-red-600 transition-colors hover:bg-red-600 hover:text-white"
                          aria-label={`Hapus ${emp.full_name}`}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <EmployeeFormModal
        key={formKey}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        employee={editingEmployee}
        onSaved={handleSaved}
      />

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Hapus Pegawai"
        description={`Yakin ingin menghapus ${deleteTarget?.full_name}? Seluruh riwayat laporannya juga akan ikut terhapus dan tidak dapat dikembalikan.`}
        confirmLabel="Ya, Hapus"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
