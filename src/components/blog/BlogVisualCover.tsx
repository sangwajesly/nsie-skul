import React from "react";

interface Props {
  type: "report-card" | "excel-error" | "logbook-inspection" | "fee-collection";
  className?: string;
  isHero?: boolean;
}

export function BlogVisualCover({ type, className = "", isHero = false }: Props) {
  const containerClasses = `relative w-full overflow-hidden flex items-center justify-center select-none ${
    isHero ? "h-64 sm:h-96 md:h-[420px] rounded-[16px]" : "h-48 sm:h-56 rounded-[10px]"
  } ${className}`;

  if (type === "report-card") {
    // 3D-style laptop / tablet mockup displaying MINESEC Report Card
    return (
      <div className={`${containerClasses} bg-gradient-to-br from-[#0D1F0E] via-[#152B17] to-[#1E3F21]`}>
        {/* Soft radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(74,222,128,0.18),transparent_65%)]" />

        {/* Floating 3D Geometric Spheres (Inspiration from reference mockup) */}
        <div className="absolute -top-4 -left-4 w-20 h-20 rounded-full bg-gradient-to-br from-[#4ADE80] to-[#166534] opacity-30 blur-xs" />
        <div className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full bg-gradient-to-br from-[#22C55E] to-[#14532D] opacity-25 blur-sm" />
        <div className="absolute top-1/4 right-8 w-12 h-12 rounded-full bg-gradient-to-tr from-[#86EFAC] to-[#16A34A] opacity-40 shadow-lg" />
        <div className="absolute bottom-6 left-10 w-8 h-8 rounded-full bg-gradient-to-tr from-[#BBF7D0] to-[#22C55E] opacity-50" />

        {/* Central Device Mockup (A4 Sheet on modern display) */}
        <div className={`relative z-10 w-11/12 max-w-[420px] bg-white rounded-[10px] shadow-2xl border border-white/40 overflow-hidden transform transition-transform duration-500 group-hover:scale-[1.03] ${isHero ? "scale-105 sm:scale-110" : ""}`}>
          {/* Browser / Document Header */}
          <div className="px-3 py-2 bg-[#F7F6F0] border-b border-[#E8DFC9] flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
              <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
              <span className="w-2 h-2 rounded-full bg-[#10B981]" />
            </div>
            <span className="text-[9px] font-mono font-bold text-[#555555] uppercase tracking-wider">
              MINESEC Official CBA Bulletin · 2026
            </span>
            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-[#EAF7E4] text-[#166534]">
              20/20 SCALE
            </span>
          </div>

          {/* Document Content Mock */}
          <div className="p-3.5 space-y-2 bg-[#FFFDF8]">
            <div className="flex items-center justify-between pb-2 border-b border-[#F0ECE1]">
              <div>
                <div className="text-[10px] font-extrabold text-[#142010]">REPUBLIC OF CAMEROON</div>
                <div className="text-[8px] text-[#777777]">Peace - Work - Fatherland</div>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-extrabold font-mono text-[#2A7C13] bg-[#EAF7E4] px-1.5 py-0.5 rounded border border-[#BBF7D0]">
                  AVG: 16.45 / 20
                </span>
                <div className="text-[8px] font-bold text-[#166534] mt-0.5">Rang: 1er / 74</div>
              </div>
            </div>

            {/* Competency Row Mockups */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[8.5px] p-1 rounded bg-white border border-[#E8DFC9]">
                <span className="font-bold text-[#142010]">Mathematics (Coef 4)</span>
                <span className="font-mono font-bold text-[#142010]">17.5/20</span>
                <span className="text-[7.5px] px-1 rounded bg-[#F0FDF4] text-[#166534] font-bold">Expert / Acquis</span>
              </div>
              <div className="flex items-center justify-between text-[8.5px] p-1 rounded bg-white border border-[#E8DFC9]">
                <span className="font-bold text-[#142010]">Physics &amp; Chemistry (Coef 3)</span>
                <span className="font-mono font-bold text-[#142010]">15.0/20</span>
                <span className="text-[7.5px] px-1 rounded bg-[#F0FDF4] text-[#166534] font-bold">Compétence Acquise</span>
              </div>
              <div className="flex items-center justify-between text-[8.5px] p-1 rounded bg-white border border-[#E8DFC9]">
                <span className="font-bold text-[#142010]">English Language (Coef 4)</span>
                <span className="font-mono font-bold text-[#142010]">16.0/20</span>
                <span className="text-[7.5px] px-1 rounded bg-[#F0FDF4] text-[#166534] font-bold">Advanced Mastery</span>
              </div>
            </div>

            {/* Bottom Deliberation Stamp */}
            <div className="flex items-center justify-between pt-1 text-[8px] text-[#777777]">
              <span>Conseil de classe: <strong>Tableau d&apos;Honneur</strong></span>
              <span className="font-bold text-[#2A7C13]">✓ Validé MINESEC</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === "excel-error") {
    // Dark modern laptop / code-spreadsheet mockup showing #DIV/0! solved
    return (
      <div className={`${containerClasses} bg-gradient-to-br from-[#0A1628] via-[#112340] to-[#1C3660]`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(56,189,248,0.15),transparent_65%)]" />

        {/* Modern 3D Floating Geometry */}
        <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-gradient-to-br from-[#38BDF8] to-[#0284C7] opacity-25 blur-xs" />
        <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-gradient-to-tr from-[#60A5FA] to-[#1D4ED8] opacity-30" />
        <div className="absolute top-1/3 left-6 w-10 h-10 rounded-full bg-gradient-to-tr from-[#93C5FD] to-[#2563EB] opacity-40 shadow-md" />

        {/* Central Display Mockup */}
        <div className={`relative z-10 w-11/12 max-w-[420px] bg-[#0F172A] rounded-[10px] shadow-2xl border border-slate-700/60 overflow-hidden text-slate-200 transform transition-transform duration-500 group-hover:scale-[1.03] ${isHero ? "scale-105 sm:scale-110" : ""}`}>
          {/* App Titlebar */}
          <div className="px-3 py-2 bg-[#1E293B] border-b border-slate-700 flex items-center justify-between text-[9px] font-mono text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
              <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
              <span className="w-2 h-2 rounded-full bg-[#10B981]" />
            </div>
            <span className="text-slate-300 font-bold">Class_Council_Marks_Form4.xlsx</span>
            <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
              VERIFIED
            </span>
          </div>

          {/* Spreadsheet Grid Mockup */}
          <div className="p-3 text-[9px] font-mono space-y-1.5">
            <div className="flex items-center justify-between px-2 py-1 rounded bg-slate-800/80 text-slate-300 font-bold border border-slate-700">
              <span>Formula: =SUMPRODUCT(...) / SUMIF(...)</span>
              <span className="text-emerald-400 font-extrabold">0 ERRORS</span>
            </div>

            <div className="grid grid-cols-4 gap-1 text-[8px] font-bold text-slate-400 px-1 pt-1 border-b border-slate-800 pb-1">
              <span>MATRICULE</span>
              <span>NAME</span>
              <span>SUM PTS</span>
              <span className="text-right">TERM AVG</span>
            </div>

            <div className="grid grid-cols-4 gap-1 text-[8.5px] items-center px-1 py-0.5 rounded bg-slate-800/40">
              <span className="text-slate-300">CM-2026-001</span>
              <span className="text-white truncate">Abena Marie</span>
              <span className="text-slate-300">328.50</span>
              <span className="text-right font-bold text-emerald-400">14.93 / 20</span>
            </div>

            <div className="grid grid-cols-4 gap-1 text-[8.5px] items-center px-1 py-0.5 rounded bg-rose-950/40 border border-rose-900/50">
              <span className="text-slate-300">CM-2026-002</span>
              <span className="text-white truncate">Bello Hamadou</span>
              <span className="text-slate-400 italic">Absent Med</span>
              <span className="text-right font-bold text-amber-400 line-through">#DIV/0!</span>
            </div>

            <div className="flex items-center justify-between pt-1.5 text-[8px] text-slate-400 border-t border-slate-800">
              <span className="text-emerald-400 font-bold">Fixed with Nsei Sukul Auto-Calculator</span>
              <span>Rank: Automatic</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === "logbook-inspection") {
    // Clean ministerial notebook & official inspection checklist mockup
    return (
      <div className={`${containerClasses} bg-gradient-to-br from-[#1E2E10] via-[#2D4519] to-[#3C5D23]`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(163,230,53,0.18),transparent_65%)]" />

        {/* 3D Floating Elements */}
        <div className="absolute -top-4 -left-4 w-24 h-24 rounded-full bg-gradient-to-br from-[#A3E635] to-[#4D7C0F] opacity-30 blur-xs" />
        <div className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full bg-gradient-to-br from-[#84CC16] to-[#365314] opacity-25" />
        <div className="absolute top-1/4 right-8 w-10 h-10 rounded-full bg-gradient-to-tr from-[#BEF264] to-[#65A30D] opacity-40 shadow-lg" />

        {/* Central Card Mockup */}
        <div className={`relative z-10 w-11/12 max-w-[420px] bg-white rounded-[10px] shadow-2xl border border-white/40 overflow-hidden transform transition-transform duration-500 group-hover:scale-[1.03] ${isHero ? "scale-105 sm:scale-110" : ""}`}>
          <div className="px-3 py-2 bg-[#F7F6EE] border-b border-[#E5E0CE] flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#3F6212]">
              MINESEC Inspection Audit Sheet
            </span>
            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-[#ECFCCB] text-[#3F6212] border border-[#D9F99D]">
              CONFORME
            </span>
          </div>

          <div className="p-3.5 space-y-2 bg-[#FCFBF7]">
            <div className="text-[10px] font-extrabold text-[#142010] flex items-center justify-between">
              <span>Cahier de Texte &amp; Progression Pédagogique</span>
              <span className="text-[#65A30D] font-bold">100% Pacing</span>
            </div>

            <div className="space-y-1 text-[8.5px] text-[#333333]">
              <div className="flex items-center gap-1.5 p-1 rounded bg-white border border-[#E8DFC9]">
                <span className="w-3.5 h-3.5 rounded-full bg-[#ECFCCB] text-[#3F6212] flex items-center justify-center font-bold text-[8px] shrink-0">✓</span>
                <span className="truncate">Syllabus Coverage: Sequence 1 (18%) · Sequence 2 (35%)</span>
              </div>
              <div className="flex items-center gap-1.5 p-1 rounded bg-white border border-[#E8DFC9]">
                <span className="w-3.5 h-3.5 rounded-full bg-[#ECFCCB] text-[#3F6212] flex items-center justify-center font-bold text-[8px] shrink-0">✓</span>
                <span className="truncate">Situation de Vie (Real-Life Problem Formulation) Included</span>
              </div>
              <div className="flex items-center gap-1.5 p-1 rounded bg-white border border-[#E8DFC9]">
                <span className="w-3.5 h-3.5 rounded-full bg-[#ECFCCB] text-[#3F6212] flex items-center justify-center font-bold text-[8px] shrink-0">✓</span>
                <span className="truncate">Class Prefect Countersignature &amp; Hour Timestamps Verified</span>
              </div>
            </div>

            <div className="pt-1 text-[8px] text-[#777777] flex items-center justify-between border-t border-[#F0ECE1]">
              <span>Rapport d&apos;Inspection Régionale</span>
              <span className="font-bold text-[#3F6212]">Mention: Très Bien</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback / Fee collection card mockup (Clean financial card & receipt slip)
  return (
    <div className={`${containerClasses} bg-gradient-to-br from-[#2D1B0E] via-[#452713] to-[#5C3419]`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(251,191,36,0.18),transparent_65%)]" />

      {/* 3D Floating Geometry */}
      <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-gradient-to-br from-[#F59E0B] to-[#B45309] opacity-25 blur-xs" />
      <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-gradient-to-tr from-[#FBBF24] to-[#78350F] opacity-30" />
      <div className="absolute top-1/3 left-6 w-10 h-10 rounded-full bg-gradient-to-tr from-[#FDE68A] to-[#D97706] opacity-40 shadow-lg" />

      {/* Central Receipt / Payment Mockup */}
      <div className={`relative z-10 w-11/12 max-w-[420px] bg-white rounded-[10px] shadow-2xl border border-white/40 overflow-hidden transform transition-transform duration-500 group-hover:scale-[1.03] ${isHero ? "scale-105 sm:scale-110" : ""}`}>
        <div className="px-3 py-2 bg-[#FFFBEB] border-b border-[#FDE68A] flex items-center justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider text-[#92400E]">
            Official School Bursary Receipt Slip
          </span>
          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
            PAID IN FULL
          </span>
        </div>

        <div className="p-3.5 space-y-2 bg-[#FFFDF8]">
          <div className="flex items-center justify-between pb-1 border-b border-[#F5EFE0]">
            <div>
              <div className="text-[10px] font-extrabold text-[#142010]">TUITION INSTALLMENT 2</div>
              <div className="text-[8px] font-mono text-[#777777]">Receipt #REC-2026-7842</div>
            </div>
            <div className="text-right">
              <span className="text-xs font-black font-mono text-[#142010]">
                45,000 FCFA
              </span>
              <div className="text-[8px] text-[#2A7C13] font-bold">MTN MoMo Confirmed</div>
            </div>
          </div>

          <div className="space-y-1 text-[8.5px] text-[#444444]">
            <div className="flex justify-between">
              <span>Student Matricule:</span>
              <strong className="font-mono text-[#142010]">GBHS-2026-0142</strong>
            </div>
            <div className="flex justify-between">
              <span>Annual Tuition Status:</span>
              <strong className="text-[#166534]">95,000 / 95,000 FCFA (Cleared)</strong>
            </div>
            <div className="flex justify-between">
              <span>Exam Clearance Card:</span>
              <strong className="text-[#2A7C13]">Authorized for Sequences 3 &amp; 4</strong>
            </div>
          </div>

          <div className="pt-1.5 flex items-center justify-between text-[8px] text-[#777777] border-t border-[#F5EFE0]">
            <span className="font-mono">Security QR Verified</span>
            <span className="font-bold text-[#142010]">Nsei Sukul Bursary Desk</span>
          </div>
        </div>
      </div>
    </div>
  );
}
