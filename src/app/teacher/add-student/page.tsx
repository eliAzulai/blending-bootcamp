"use client";

import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function AddStudentPage() {
  const { user } = useAuth();
  const [studentName, setStudentName] = useState("");
  const [studentAge, setStudentAge] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  async function generateInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from("invite_tokens")
      .insert({
        teacher_id: user.id,
        student_name: studentName || null,
        student_age: studentAge ? parseInt(studentAge) : null,
      })
      .select("token")
      .single();

    if (insertError || !data) {
      setError(insertError?.message ?? "Failed to generate invite");
      setLoading(false);
      return;
    }

    const link = `${window.location.origin}/join/${data.token}`;
    setInviteLink(link);
    setLoading(false);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add Student</h1>
        <p className="text-sm text-gray-500">
          Generate an invite link to send to the parent via WhatsApp
        </p>
      </div>

      {!inviteLink ? (
        <form onSubmit={generateInvite} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Student name (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Maya"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-base outline-none focus:border-purple-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Age (optional)
            </label>
            <input
              type="number"
              placeholder="e.g. 7"
              min="3"
              max="18"
              value={studentAge}
              onChange={(e) => setStudentAge(e.target.value)}
              className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-base outline-none focus:border-purple-400"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-purple-600 px-6 py-3 text-lg font-bold text-white shadow-md hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate Invite Link"}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-green-200 bg-green-50 p-4">
            <p className="mb-2 text-sm font-medium text-green-800">
              Invite link ready!
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={inviteLink}
                className="flex-1 rounded-lg border border-green-300 bg-white px-3 py-2 text-sm"
              />
              <button
                onClick={copyLink}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="mt-2 text-xs text-green-600">
              Send this to the parent on WhatsApp. They&apos;ll sign up and their
              child will be linked to your dashboard.
            </p>
          </div>
          <button
            onClick={() => {
              setInviteLink("");
              setStudentName("");
              setStudentAge("");
            }}
            className="w-full rounded-xl border-2 border-gray-200 px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Generate Another Link
          </button>
        </div>
      )}
    </div>
  );
}
