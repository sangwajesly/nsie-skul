"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Loader2, UploadCloud } from "lucide-react";

type StreamOption = {
  id: string;
  name: string;
};

type PreviewRow = {
  rowNumber: number;
  errors: string[];
  student: {
    matricule: string;
    firstName: string;
    lastName: string;
    gender: string;
    residenceStatus: string;
  };
};

export default function StudentImportClient({ allStreams }: { allStreams: StreamOption[] }) {
  const router = useRouter();
  const [classStreamId, setClassStreamId] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{
    rowCount: number;
    errorCount: number;
    rows: PreviewRow[];
    truncated: boolean;
  } | null>(null);
  const [message, setMessage] = useState<{ type: "error" | "success" | "info"; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const submitImport = async (mode: "preview" | "import") => {
    if (!selectedFile) {
      setMessage({ type: "error", text: "Choose a CSV or Excel file before previewing or importing." });
      return;
    }

    if (!classStreamId) {
      setMessage({ type: "error", text: "Select a class group before importing students." });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    const formData = new FormData();
    formData.set("mode", mode);
    formData.set("classStreamId", classStreamId);
    formData.set("file", selectedFile);

    try {
      const response = await fetch("/api/dashboard/students/import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setPreview(null);
        setMessage({ type: "error", text: data.error || "The batch import could not be processed." });
        setIsLoading(false);
        return;
      }

      if (mode === "preview") {
        setPreview(data);
        setMessage({
          type: "success",
          text: `Preview ready: ${data.rowCount} rows found with ${data.errorCount} validation issue${data.errorCount === 1 ? "" : "s"}.`,
        });
      } else {
        setMessage({ type: "success", text: `${data.importedCount} students were imported successfully.` });
        setPreview(null);
        setSelectedFile(null);
        router.refresh();
      }
    } catch (error) {
      setPreview(null);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "A network error prevented the import.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-5 rounded-[8px] border border-[#E5E5DF] shadow-2xs space-y-4">
      <div className="flex items-center gap-2.5 pb-3 border-b border-[#EEEEEC]">
        <UploadCloud className="w-4 h-4 text-[#555555]" />
        <div>
          <h2 className="text-[14px] font-bold text-[#191919]">Batch Upload Students</h2>
          <p className="text-[11px] text-[#777777]">Import a CSV or .xlsx file into the selected class group</p>
        </div>
      </div>

      <div className="space-y-3 text-[12px]">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#777777] mb-1">
            Class Group *
          </label>
          <select
            value={classStreamId}
            onChange={(event) => setClassStreamId(event.target.value)}
            className="w-full px-3 py-1.5 rounded-[5px] border border-[#D5D5CF] bg-white focus:outline-none focus:border-[#191919]"
          >
            <option value="">Choose a class group</option>
            {allStreams.map((stream) => (
              <option key={stream.id} value={stream.id}>
                {stream.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#777777] mb-1">
            Student file *
          </label>
          <input
            type="file"
            accept=".csv,.xlsx"
            onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
            className="block w-full text-[12px] text-[#444444] file:mr-3 file:rounded-[5px] file:border-0 file:bg-[#F3F4F6] file:px-3 file:py-1.5 file:text-[12px] file:font-semibold file:text-[#191919]"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <a
            href="/api/dashboard/students/import"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-[5px] border border-[#D5D5CF] bg-white text-[#191919] font-semibold text-[12px]"
          >
            <Download className="w-3.5 h-3.5" />
            Download template
          </a>

          <button
            type="button"
            onClick={() => submitImport("preview")}
            disabled={!selectedFile || !classStreamId || isLoading}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-[5px] bg-[#191919] text-white font-semibold text-[12px] disabled:opacity-60"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
            Preview import
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`rounded-[6px] border px-3 py-2 text-[12px] ${
            message.type === "error"
              ? "border-[#FECACA] bg-[#FEF2F2] text-[#991B1B]"
              : message.type === "success"
                ? "border-[#BBF7D0] bg-[#F0FDF4] text-[#166534]"
                : "border-[#E5E7EB] bg-[#F9FAFB] text-[#374151]"
          }`}
        >
          <div className="flex items-start gap-2">
            {message.type === "error" ? (
              <AlertTriangle className="w-4 h-4 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 mt-0.5" />
            )}
            <span>{message.text}</span>
          </div>
        </div>
      )}

      {preview && (
        <div className="space-y-3 border-t border-[#EEEEEC] pt-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-[13px] font-bold text-[#191919]">Import preview</h3>
              <p className="text-[11px] text-[#777777]">
                {preview.rowCount} rows · {preview.errorCount} invalid rows
                {preview.truncated ? " · preview truncated" : ""}
              </p>
            </div>

            <button
              type="button"
              onClick={() => submitImport("import")}
              disabled={isLoading || preview.errorCount > 0}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-[5px] bg-[#166534] text-white font-semibold text-[12px] disabled:opacity-60"
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
              Import now
            </button>
          </div>

          <div className="max-h-80 overflow-auto border border-[#E5E5DF] rounded-[6px]">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead className="bg-[#FAFAF8] text-[#666666] uppercase tracking-wider">
                <tr>
                  <th className="px-2 py-2">Row</th>
                  <th className="px-2 py-2">Matricule</th>
                  <th className="px-2 py-2">Name</th>
                  <th className="px-2 py-2">Issues</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row) => (
                  <tr key={`${row.rowNumber}-${row.student.matricule || "empty"}`} className="border-t border-[#F1F1ED] align-top">
                    <td className="px-2 py-2 font-medium text-[#555555]">{row.rowNumber}</td>
                    <td className="px-2 py-2 font-mono text-[#191919]">{row.student.matricule || "—"}</td>
                    <td className="px-2 py-2">
                      {row.student.firstName || row.student.lastName
                        ? `${row.student.firstName || ""} ${row.student.lastName || ""}`.trim()
                        : "—"}
                    </td>
                    <td className="px-2 py-2 text-[#991B1B]">
                      {row.errors.length > 0 ? row.errors.join("; ") : "Valid"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
