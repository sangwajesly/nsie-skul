export default function DashboardLoading() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-pulse p-1 sm:p-2">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E5DF]">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-[#EAEAEA] rounded-[4px]" />
          <div className="h-4 w-72 bg-[#F2F2EE] rounded-[4px]" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-28 bg-[#EAEAEA] rounded-[6px]" />
          <div className="h-8 w-24 bg-[#EAEAEA] rounded-[6px]" />
        </div>
      </div>

      {/* KPI Metric Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-4 rounded-[8px] bg-white border border-[#E8DFC9] space-y-3 shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 bg-[#F0F0EA] rounded-[3px]" />
              <div className="w-6 h-6 rounded-[4px] bg-[#F4F4EE]" />
            </div>
            <div className="h-7 w-16 bg-[#E8E8E0] rounded-[4px]" />
            <div className="h-3 w-32 bg-[#F6F6F2] rounded-[3px]" />
          </div>
        ))}
      </div>

      {/* Main Roster / Content Area Skeleton */}
      <div className="p-6 rounded-[8px] bg-white border border-[#E8DFC9] space-y-4 shadow-2xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#F0EFEA]">
          <div className="h-5 w-40 bg-[#E8E8E0] rounded-[4px]" />
          <div className="h-7 w-32 bg-[#F4F4EE] rounded-[6px]" />
        </div>
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2.5 border-b border-[#F7F7F4] last:border-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#EAEAEA]" />
                <div className="space-y-1.5">
                  <div className="h-4 w-36 bg-[#E8E8E0] rounded-[3px]" />
                  <div className="h-3 w-24 bg-[#F2F2EE] rounded-[3px]" />
                </div>
              </div>
              <div className="h-6 w-20 bg-[#F4F4EE] rounded-[4px]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
