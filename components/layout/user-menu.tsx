"use client";

import { ChevronDown, LogOut, Settings } from "lucide-react";
import Link from "next/link";

import { useProfile } from "@/components/providers/permission-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/lib/actions/auth";
import { initials } from "@/lib/format";

export function UserMenu({ onDark = false }: { onDark?: boolean }) {
  const profile = useProfile();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={
            onDark
              ? "h-8 gap-2 px-2 text-white hover:bg-white/10 hover:text-white"
              : "h-8 gap-2 px-2"
          }
          aria-label="Account menu"
        >
          <Avatar className="size-6">
            <AvatarFallback className={onDark ? "bg-white text-[10px] text-[#24292f]" : "text-[10px]"}>
              {initials(profile.full_name)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden max-w-32 truncate text-sm font-medium sm:inline">
            {profile.role === "admin" ? "Admin" : profile.full_name.split(" ")[0]}
          </span>
          <ChevronDown className={onDark ? "size-4 text-white/70" : "size-4 text-muted-foreground"} aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <div className="grid gap-1">
            <p className="truncate text-sm font-medium">{profile.full_name}</p>
            <p className="truncate text-xs text-muted-foreground">{profile.email}</p>
            <Badge variant="secondary" className="mt-1 w-fit capitalize">
              {profile.role}
            </Badge>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings aria-hidden />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action={logout}>
          <DropdownMenuItem asChild variant="destructive">
            <button type="submit" className="w-full">
              <LogOut aria-hidden />
              Sign out
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
