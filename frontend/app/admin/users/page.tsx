"use client";

import { useEffect, useState } from "react";
import { usersApi } from "@/services/api";

export default function ManageUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await usersApi.findAll();
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await usersApi.remove(id);
      setUsers(users.filter((u) => u._id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete user");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="mb-6 flex justify-between items-center border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Manage Users</h1>
          <p className="text-text-secondary">View and remove merchant accounts</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-text-secondary animate-pulse">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-text-secondary">No users found on the platform.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border text-sm font-semibold text-text-secondary">
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-mono text-sm text-gray-400">{u._id}</td>
                    <td className="px-6 py-4 font-medium text-foreground">{u.Email}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-bold rounded-md">
                        {u.Role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {u.Role !== "ADMIN" && (
                        <button
                          onClick={() => handleDelete(u._id)}
                          className="text-red-500 hover:text-white hover:bg-red-500 px-4 py-2 rounded-xl text-sm font-medium transition"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
