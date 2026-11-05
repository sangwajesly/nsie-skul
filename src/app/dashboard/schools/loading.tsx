import { Loader2 } from "lucide-react";

export default function SchoolsLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-pulse">
      <div className="h-28 bg-[#142010]/20 rounded-[12px] flex items-center justify-center">
        <div className="flex items-center gap-2 text-[#2A7C13] font-semibold text-sm">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading institutions network...</span>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-white border border-[#E8DFC9] rounded-[8px]" />
        ))}
      </div>
      <div className="space-y-3 pt-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-white border border-[#E8DFC9] rounded-[10px]" />
        ))}
      </div>
    </div>
  );
}
