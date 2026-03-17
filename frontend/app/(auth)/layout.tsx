export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--muted)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[var(--primary)] flex items-center justify-center shadow-lg shadow-purple-200 mb-4">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path
                d="M11 2L20 6.5V15.5L11 20L2 15.5V6.5L11 2Z"
                stroke="white"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <circle cx="11" cy="11" r="3" fill="white" />
            </svg>
          </div>
          <span className="font-bold text-xl text-gray-900 tracking-tight">
            BlockWarpRift
          </span>
          <span className="text-sm text-[var(--text-secondary)] mt-1">
            Crypto payment infrastructure
          </span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
