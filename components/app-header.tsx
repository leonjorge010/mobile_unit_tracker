"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useEvents } from "@/lib/events-context";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { Settings, LogOut, User } from "lucide-react";

export function AppHeader() {
  const { user, logout } = useAuth();
  const { events, selectedEvent, selectEvent, loading: eventsLoading } = useEvents();
  const router = useRouter();

  // Logged-out header
  if (!user) {
    return (
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 h-14 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight">TOTEM</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button onClick={() => router.push("/login")}>Sign In</Button>
          </div>
        </div>
      </header>
    );
  }

  // Logged-in header
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4">
        {/* Main header row */}
        <div className="h-14 flex justify-between items-center">
          {/* Left: Logo + Event Selector (desktop) */}
          <div className="flex items-center gap-4">
            <span className="text-xl font-bold tracking-tight">TOTEM</span>
            
            {/* Desktop event selector */}
            <div className="hidden sm:flex items-center gap-2 pl-4 border-l">
              <Select value={selectedEvent?.id || ""} onValueChange={selectEvent}>
                <SelectTrigger className="w-[200px] border-none shadow-none h-8 focus:ring-0">
                  <SelectValue placeholder={eventsLoading ? "Loading..." : "Select Event"} />
                </SelectTrigger>
                <SelectContent>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Right: Actions + User Menu */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="hidden sm:inline text-sm">
                    {user.displayName || user.email?.split("@")[0]}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-sm font-medium">{user.displayName || "User"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/admin" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Admin
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-600 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile event selector - second row */}
        <div className="sm:hidden pb-3 -mt-1">
          <Select value={selectedEvent?.id || ""} onValueChange={selectEvent}>
            <SelectTrigger className="w-full h-9">
              <SelectValue placeholder={eventsLoading ? "Loading..." : "Select Event"} />
            </SelectTrigger>
            <SelectContent>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </header>
  );
}