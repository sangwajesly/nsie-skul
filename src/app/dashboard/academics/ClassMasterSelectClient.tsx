"use client";

import { useState, useTransition } from "react";
import { assignClassMasterAction } from "@/app/academics/actions";
import { UserCheck, Loader2 } from "lucide-react";

interface Props {
  classStreamId: string;
  streamName: string;
  currentClassMasterId?: string | null;
  teachers: Array<{ id: string; name: string }>;
}

export function ClassMasterSelectClient({
  classStreamId,
  streamName,
  currentClassMasterId,
  teachers,
}: Props) {
  const [selectedId, setSelectedId] = useState(currentClassMasterId || "");
  const [isPending, startTransition] = useTransition();
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleChange = (newId: string) => {
    setSelectedId(newId);
    setStatusMsg(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("classStreamId", classStreamId);
      formData.set("classMasterUserId", newId);

      const res = await assignClassMasterAction(formData);
      if (res?.error) {
        setStatusMsg(res.error);
      } else {
        setStatusMsg("Saved");
        setTimeout(() => setStatusMsg(null), 2500);
      }
    });
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <label htmlFor={`cm-${classStreamId}`} className="text-[10px] text-[#777777] font-medium shrink-0">
          Class Master:
        </label>
        <div className="relative flex-1">
          <select
            id={`cm-${classStreamId}`}
            aria-label={`Assign Class Master for ${streamName}`}
            value={selectedId}
            disabled={isPending}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full px-2 py-0.5 text-[11px] rounded-[4px] border border-[#D5D5CF] bg-white text-[#191919] focus:outline-none focus:border-[#2A7C13] disabled:opacity-60 truncate font-medium"
          >
            <option value="">(None / Unassigned)</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        {isPending ? (
          <Loader2 className="w-3 h-3 text-[#777777] animate-spin shrink-0" />
        ) : statusMsg === "Saved" ? (
          <span title="Class Master saved">
            <UserCheck className="w-3 h-3 text-[#2A7C13] shrink-0" />
          </span>
        ) : null}
      </div>
      {statusMsg && statusMsg !== "Saved" && (
        <span className="text-[10px] text-red-600 truncate">{statusMsg}</span>
      )}
    </div>
  );
}
