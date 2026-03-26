"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import gsap from "gsap"
import { useAuthStore } from "@/store/auth.store"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  BarChart3,
  CreditCard,
  ArrowLeftRight,
  Users,
  Globe,
  LogOut,
  ChevronLeft,
  Menu,
  Wallet,
  Shield,
} from "lucide-react"

import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

const merchantNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/payments", label: "Payments", icon: CreditCard },
  { href: "/dashboard/transactions", label: "Transactions", icon: ArrowLeftRight },
]

const adminNav = [
  { href: "/admin/dashboard", label: "Admin Overview", icon: Shield },
  { href: "/admin/users", label: "Manage Users", icon: Users },
  { href: "/admin/transactions", label: "All Transactions", icon: Globe },
]

function NavItem({
  href,
  label,
  icon: Icon,
  isActive,
  collapsed,
}: {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  isActive: boolean
  collapsed: boolean
}) {
  const content = (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative",
        isActive
          ? "bg-[var(--sidebar-accent)] text-[var(--sidebar-accent-foreground)] shadow-sm"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
      )}
    >
      <Icon
        className={cn(
          "h-[18px] w-[18px] shrink-0 transition-colors duration-200",
          isActive ? "text-[var(--primary)]" : "text-muted-foreground group-hover:text-foreground"
        )}
      />
      {!collapsed && (
        <>
          <span>{label}</span>
          {isActive && (
            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
          )}
        </>
      )}
    </Link>
  )

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger>{content}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {label}
        </TooltipContent>
      </Tooltip>
    )
  }

  return content
}

function SidebarContent({ collapsed, onCollapse }: { collapsed: boolean; onCollapse?: () => void }) {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const isAdmin = user?.role === "ADMIN"

  const navRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!navRef.current) return
    const ctx = gsap.context(() => {
      gsap.from(navRef.current!.querySelectorAll("[data-nav-item]"), {
        x: -16,
        opacity: 0,
        duration: 0.35,
        stagger: 0.05,
        delay: 0.15,
        ease: "power2.out",
      })
    })
    return () => ctx.revert()
  }, [])

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && href !== "/admin/dashboard" && pathname.startsWith(href))

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn(
        "flex items-center ml-6 gap-2.5 px-4 h-16 shrink-0",
        collapsed ? "justify-center" : ""
      )}>
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center shadow-sm shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" />
              <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          {!collapsed && (
            <span className="font-semibold text-base tracking-tight text-foreground">
              Block<span className="text-[var(--primary)]">Warp</span>
            </span>
          )}
        </Link>
        {onCollapse && (
          <button
            onClick={onCollapse}
            className={cn(
              "w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer",
              collapsed ? "" : "ml-auto"
            )}
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform duration-200", collapsed && "rotate-180")} />
          </button>
        )}
      </div>

      <Separator />

      {/* Navigation */}
      <div ref={navRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {!isAdmin && (
          <>
            {!collapsed && (
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-3 mb-2">
                Merchant
              </p>
            )}
            {merchantNav.map((item) => (
              <div key={item.href} data-nav-item>
                <NavItem {...item} isActive={isActive(item.href)} collapsed={collapsed} />
              </div>
            ))}
          </>
        )}

        {isAdmin && (
          <>
            {!collapsed && (
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-3 mb-2">
                Admin
              </p>
            )}
            {adminNav.map((item) => (
              <div key={item.href} data-nav-item>
                <NavItem {...item} isActive={isActive(item.href)} collapsed={collapsed} />
              </div>
            ))}
          </>
        )}
      </div>

      <Separator />

      {/* Footer */}
      <div className={cn("px-3 py-4 space-y-3", collapsed ? "items-center" : "")}>
        {/* Wallet indicator */}
        {user?.walletAddress && !collapsed && (
          <div className="flex items-center gap-2 px-3 py-2 bg-[var(--accent)]/10 rounded-xl">
            <Wallet className="h-3.5 w-3.5 text-[var(--accent-dark)]" />
            <span className="text-xs font-mono text-[var(--accent-dark)] truncate">
              {user.walletAddress.slice(0, 6)}…{user.walletAddress.slice(-4)}
            </span>
          </div>
        )}

        {/* User info */}
        <div className={cn(
          "flex items-center gap-2.5",
          collapsed ? "justify-center" : "px-3"
        )}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] flex items-center justify-center text-white text-xs font-bold shrink-0">
            {user?.email?.[0]?.toUpperCase() ?? "?"}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user?.email}</p>
              <p className="text-[10px] text-muted-foreground">Sepolia Testnet</p>
            </div>
          )}
        </div>

        {/* Logout */}
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger>
              <button
                onClick={logout}
                className="w-full flex items-center justify-center p-2.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Log out</TooltipContent>
          </Tooltip>
        ) : (
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        )}
      </div>
    </div>
  )
}

export default function DashboardSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const sidebarRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!sidebarRef.current) return
    const ctx = gsap.context(() => {
      gsap.from(sidebarRef.current, {
        x: -280,
        opacity: 0,
        duration: 0.5,
        ease: "power3.out",
      })
    })
    return () => ctx.revert()
  }, [])

  return (
    <TooltipProvider delay={0}>
      {/* Desktop Sidebar */}
      <aside
        ref={sidebarRef}
        className={cn(
          "hidden lg:flex flex-col fixed top-0 left-0 h-screen bg-[var(--sidebar)] border-r border-[var(--sidebar-border)] z-40 transition-all duration-300 ease-in-out",
          collapsed ? "w-[68px]" : "w-[260px]"
        )}
      >
        <SidebarContent collapsed={collapsed} onCollapse={() => setCollapsed((c) => !c)} />
      </aside>

      {/* Mobile trigger + sheet */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Sheet>
          <SheetTrigger className="inline-flex items-center justify-center rounded-xl shadow-md bg-white border border-border h-10 w-10 hover:bg-muted transition-colors">
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-[260px] p-0">
            <SidebarContent collapsed={false} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Spacer for main content */}
      <div
        className={cn(
          "hidden lg:block shrink-0 transition-all duration-300",
          collapsed ? "w-[68px]" : "w-[260px]"
        )}
      />
    </TooltipProvider>
  )
}

export { DashboardSidebar }
