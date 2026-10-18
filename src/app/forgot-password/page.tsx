import Link from "next/link";
import { GraduationCap, ArrowLeft, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFDF5] p-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-[10px] bg-[#142010] text-white mb-4">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#142010]">
            Reset Password
          </h1>
          <p className="text-xs text-[#666666] mt-1">
            Enter your institutional email address to receive password reset instructions.
          </p>
        </div>

        <div className="bg-white border border-[#E8DFC9] rounded-[10px] shadow-sm p-7 space-y-5">
          <form className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-[#444444] mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#AAAAAA]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="admin@school.cm"
                  className="w-full pl-9 pr-4 py-2.5 text-sm rounded-[6px] border border-[#D5CBB2] bg-white text-[#142010] placeholder-[#BBBBBB] focus:outline-none focus:border-[#2A7C13] focus:ring-1 focus:ring-[#2A7C13] transition-all"
                />
              </div>
            </div>

            <button
              type="button"
              className="w-full mt-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#142010] hover:bg-[#1e3318] text-white font-semibold text-sm rounded-[6px] shadow-sm transition-all"
            >
              Send Reset Instructions
            </button>
          </form>

          <div className="p-3 bg-[#FFF8CF] border border-[#FBE6C2] rounded-[6px] text-[11px] text-[#7A5B00] leading-relaxed">
            Note: For school safety, password resets must be authorized or you can ask your school Principal / System Administrator directly.
          </div>
        </div>

        <p className="text-center text-xs text-[#777777] mt-5">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 font-semibold text-[#2A7C13] hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Sign In
          </Link>
        </p>

        <p className="text-center text-[10px] text-[#AAAAAA] mt-4">
          © {new Date().getFullYear()} Nsei Skul · Built for Cameroon Secondary Education
        </p>
      </div>
    </div>
  );
}
