"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Home, Archive, User, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AUTHOR_SITE_URL } from "@/lib/site";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-9 text-muted-foreground hover:text-foreground"
          aria-label="Toggle navigation menu"
        >
          {open ? (
            <X className="size-5 transition-transform duration-200" />
          ) : (
            <Menu className="size-5 transition-transform duration-200" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-48 p-1.5 shadow-lg border border-border/60 bg-background/95 backdrop-blur-md rounded-xl"
      >
        <DropdownMenuItem asChild>
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer",
              pathname === "/"
                ? "bg-accent text-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Home className="size-4" />
            <span>Home</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link
            href="/posts"
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer",
              pathname.startsWith("/posts")
                ? "bg-accent text-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Archive className="size-4" />
            <span>Archive</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-1 border-border/40" />

        <DropdownMenuItem asChild>
          <a
            href={AUTHOR_SITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="flex items-center justify-between px-3 py-2 text-sm rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Agnivo Neogi's personal website"
          >
            <span className="flex items-center gap-2.5">
              <User className="size-4" />
              <span>Author</span>
            </span>
            <ArrowUpRight className="size-3.5 text-muted-foreground/70" />
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
