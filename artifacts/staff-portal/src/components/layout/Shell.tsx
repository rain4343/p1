import React from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, Building2, Shield, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const navItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/" },
  { icon: Users, label: "Staff", href: "/staff" },
  { icon: Building2, label: "Departments", href: "/departments" },
  { icon: Shield, label: "Roles", href: "/roles" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const SidebarContent = () => (
    <div className="flex h-full flex-col gap-4 py-6">
      <div className="px-6">
        <h2 className="text-lg font-bold text-sidebar-primary flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-sidebar-primary/20 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-sidebar-primary" />
          </div>
          Staff Portal
        </h2>
      </div>
      <div className="px-3">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'}`}>
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden border-r border-sidebar-border bg-sidebar md:block md:w-64">
        <SidebarContent />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-muted-foreground hover:text-foreground">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 bg-sidebar border-sidebar-border">
              <SidebarContent />
            </SheetContent>
          </Sheet>
          <div className="font-semibold">Staff Portal</div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
