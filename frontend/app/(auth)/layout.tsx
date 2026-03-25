export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex items-center justify-center py-24 px-6 relative overflow-hidden">
      {/* Background decorations for auth */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -z-10" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl -z-10" />

      <div className="w-full max-w-md bg-white border border-border shadow-xl rounded-2xl overflow-hidden z-10">
        {children}
      </div>
    </div>
  );
}
