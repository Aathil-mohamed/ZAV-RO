"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/store/auth";
import AuthDialog from "./AuthDialog";

export default function AccountButton() {
  const { user, checked, fetchUser, logout } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!checked) fetchUser();
  }, [checked, fetchUser]);

  return (
    <>
      <div className="pointer-events-auto">
        {user ? (
          <div className="flex items-center gap-2 rounded-full bg-neutral-900/80 px-3 py-1.5 text-xs text-white backdrop-blur-md border border-neutral-700/50">
            <span className="max-w-[100px] truncate">{user.name}</span>
            <button
              type="button"
              onClick={() => logout()}
              className="text-neutral-300 hover:text-white underline"
            >
              Sign out
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-full bg-neutral-900/80 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-md border border-neutral-700/50 hover:bg-neutral-800"
          >
            Sign in
          </button>
        )}
      </div>
      <AuthDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
