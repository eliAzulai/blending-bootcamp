"use client";

import { useState, useTransition } from "react";
import {
  addTagAction,
  removeTagAction,
  createAndAddTagAction,
} from "@/app/teacher/students/[id]/actions";
import type { Tag } from "@/types/database";

interface TagManagerProps {
  studentId: string;
  currentTags: Tag[];
  allTags: Tag[];
}

export default function TagManager({
  studentId,
  currentTags,
  allTags,
}: TagManagerProps) {
  const [newTag, setNewTag] = useState("");
  const [pending, startTransition] = useTransition();

  const currentTagIds = new Set(currentTags.map((t) => t.id));

  function handleAdd(tagId: string) {
    startTransition(() => addTagAction(studentId, tagId));
  }

  function handleRemove(tagId: string) {
    startTransition(() => removeTagAction(studentId, tagId));
  }

  function handleCreate() {
    if (!newTag.trim()) return;
    const value = newTag.trim();
    setNewTag("");
    startTransition(async () => {
      await createAndAddTagAction(studentId, value);
    });
  }

  return (
    <div className={`space-y-2 ${pending ? "opacity-60" : ""}`}>
      <h3 className="text-sm font-semibold text-gray-700">Tags</h3>

      <div className="flex flex-wrap gap-1">
        {currentTags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-700"
          >
            {tag.name}
            <button
              onClick={() => handleRemove(tag.id)}
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
                onClick={() => handleAdd(tag.id)}
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
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          maxLength={30}
          className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs outline-none focus:border-purple-400"
        />
        <button
          onClick={handleCreate}
          disabled={!newTag.trim() || pending}
          className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 disabled:opacity-40"
        >
          Add
        </button>
      </div>
    </div>
  );
}
