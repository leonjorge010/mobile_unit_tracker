"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronRight, Home, User, LogOut } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface AdminHeaderProps {
  breadcrumbs?: BreadcrumbItem[];
}

export function AdminHeader({ breadcrumbs = [] }: AdminHeaderProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const defaultBreadcrumbs: BreadcrumbItem[] = [
    { label: "Admin", href: "/admin" },
    ...breadcrumbs,
  ];

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-6 h-14 flex justify-between items-center">
        {/* Left: Logo + Breadcrumbs */}
        <div className="flex items-center gap-3">
          <Link href="/" className="text-xl font-bold tracking-tight hover:opacity-80 transition-opacity">
            TOTEM
          </Link>
          
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            {defaultBreadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center gap-1">
                <ChevronRight className="h-4 w-4" />
                {crumb.href && index < defaultBreadcrumbs.length - 1 ? (
                  <Link 
                    href={crumb.href} 
                    className="hover:text-foreground transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-foreground font-medium">{crumb.label}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Link>
          </Button>
          
          <ThemeToggle />

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-sm font-medium">{user.displayName || "User"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-600 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}