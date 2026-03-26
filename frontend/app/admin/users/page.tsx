/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usersApi } from "@/services/api";
import gsap from "gsap";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Users, X, AlertTriangle } from "lucide-react";

export default function ManageUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await usersApi.findAll();
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => {
    if (isLoading) return;
    const ctx = gsap.context(() => {
      gsap.from(headerRef.current, { y: -16, opacity: 0, duration: 0.45, ease: "power2.out" });
    });
    return () => ctx.revert();
  }, [isLoading]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleDelete = async (id: string) => {
    setDeleteTarget(null);
    try {
      await usersApi.remove(id);
      setUsers((prev) => prev.filter((u) => u._id !== id));
      setToast({ msg: "User deleted successfully", type: "ok" });
    } catch {
      setToast({ msg: "Failed to delete user", type: "err" });
    }
  };

  return (
    <>
      {/* Confirm Dialog */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 backdrop-blur-sm"
            onClick={() => setDeleteTarget(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-xl border border-border p-6 w-full max-w-sm mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Delete User</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Are you sure you want to delete this user? This action cannot be undone.
              </p>
              <div className="flex items-center gap-3 justify-end">
                <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>
                  Cancel
                </Button>
                <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white" onClick={() => handleDelete(deleteTarget)}>
                  Delete
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
              toast.type === "ok" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"
            }`}
          >
            {toast.msg}
            <button onClick={() => setToast(null)} className="cursor-pointer"><X className="h-3.5 w-3.5" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={headerRef} className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Users className="h-5 w-5 text-[var(--primary)]" />
          <h1 className="text-2xl font-bold tracking-tight">Manage Users</h1>
        </div>
        <p className="text-sm text-muted-foreground ml-8">
          {users.length} registered account{users.length !== 1 ? "s" : ""}
        </p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.4 }}>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wide border-b border-border">
                    <th className="px-5 py-4 text-left font-semibold">Email</th>
                    <th className="px-5 py-4 text-left font-semibold">Role</th>
                    <th className="px-5 py-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading ? (
                    <tr><td colSpan={3} className="px-5 py-12 text-center text-muted-foreground">Loading users...</td></tr>
                  ) : users.length === 0 ? (
                    <tr><td colSpan={3} className="px-5 py-12 text-center text-muted-foreground">No users found.</td></tr>
                  ) : (
                    users.map((u: any) => (
                      <tr key={u._id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-4 font-medium text-foreground">{u.Email}</td>
                        <td className="px-5 py-4">
                          <Badge className={u.Role === "ADMIN" ? "bg-purple-50 text-purple-700" : "bg-blue-50 text-blue-700"}>
                            {u.Role}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 text-right">
                          {u.Role !== "ADMIN" && (
                            <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(u._id)} className="text-red-500 hover:bg-red-50 hover:text-red-600">
                              <Trash2 className="h-4 w-4 mr-1" /> Delete
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
}
