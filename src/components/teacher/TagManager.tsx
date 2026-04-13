"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import type { Tag } from "@/types/database";

interface TagManagerProps {
  studentId: string;
  currentTags: Tag[];
  allTags: Tag[];
  onUpdate: () => void;
}

export default function TagManager({
  studentId,
  currentTags,
  allTags,
  onUpdate,
}: TagManagerProps) {
  const { user } = useAuth();
  const [newTag, setNewTag] = useState("");
  const [saving, setSaving] = useState(false);

  const currentTagIds = new Set(currentTags.map((t) => t.id));

  async function addTag(tagId: string) {
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("student_tags")
      .insert({ student_id: studentId, tag_id: tagId });
    setSaving(false);
    onUpdate();
  }

  async function removeTag(tagId: string) {
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("student_tags")
      .delete()
      .eq("student_id", studentId)
      .eq("tag_id", tagId);
    setSaving(false);
    onUpdate();
  }

  async function createAndAddTag() {
    if (!newTag.trim() || !user) return;
    setSaving(true);
    const supabase = createClient();

    const { data: existing } = await supabase
      .from("tags")
      .select("id")
      .eq("teacher_id", user.id)
      .eq("name", newTag.trim())
      .maybeSingle();

    let tagId: string;

    if (existing) {
      tagId = existing.id;
    } else {
      const { data: created } = await supabase
        .from("tags")
        .insert({ teacher_id: user.id, name: newTag.trim() })
        .select("id")
        .single();
      if (!created) {
        setSaving(false);
        return;
      }
      tagId = created.id;
    }

    await supabase
      .from("student_tags")
      .insert({ student_id: studentId, tag_id: tagId });
    setNewTag("");
    setSaving(false);
    onUpdate();
  }

  return (
    <div className={`space-y-2 ${saving ? "opacity-60" : ""}`}>
      <h3 className="text-sm font-semibold text-gray-700">Tags</h3>

      <div className="flex flex-wrap gap-1">
        {currentTags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-700"
          >
            {tag.name}
            <button
              onClick={() => removeTag(tag.id)}
              className="ml-0.5 text-purple-400 hover:text-purple-700"
            >
              ×
            </button>
          </span>
        ))}
      </div>

      {allTags.filter((t) => !currentTagIds.has(t.id)).length > 0 && (
        <div className="flex flex-wrap gap-1">
          {allTags
            .filter((t) => !currentTagIds.has(t.id))
            .map((tag) => (
              <button
                key={tag.id}
                onClick={() => addTag(tag.id)}
                className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-500 hover:bg-gray-200"
              >
                + {tag.name}
              </button>
            ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="New tag..."
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && createAndAddTag()}
          maxLength={30}
          className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs outline-none focus:border-purple-400"
        />
        <button
          onClick={createAndAddTag}
          disabled={!newTag.trim()}
          className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 disabled:opacity-40"
        >
          Add
        </button>
      </div>
    </div>
  );
}
