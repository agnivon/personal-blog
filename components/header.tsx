import Link from "next/link";
import { ModeToggle } from "./mode-toggle";
import { MobileNav } from "./mobile-nav";
import { sanityFetch } from "@/sanity/lib/fetch";
import { settingsQuery } from "@/sanity/lib/queries";
import * as demo from "@/sanity/lib/demo";
import { AUTHOR_SITE_URL } from "@/lib/site";

export default async function Header() {
  const settings = await sanityFetch({ query: settingsQuery });
  const title = settings?.title || demo.title;

  return (
    <header className="glass-nav top-0 w-full select-none">
      <div className="container mx-auto px-5 max-w-6xl">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link 
              href="/" 
              className="font-serif text-2xl font-bold tracking-tight hover:opacity-85 transition-opacity inline-flex items-center py-1 leading-normal"
            >
              <span>{title}</span>
              <span className="text-blue-600 dark:text-blue-400">.</span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link 
              href="/" 
              className="text-muted-foreground hover:text-foreground transition-colors relative py-1 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-foreground after:transition-all hover:after:w-full"
            >
              Home
            </Link>
            <Link 
              href="/posts" 
              className="text-muted-foreground hover:text-foreground transition-colors relative py-1 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-foreground after:transition-all hover:after:w-full"
            >
              Archive
            </Link>
            <a
              href={AUTHOR_SITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors relative py-1 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-foreground after:transition-all hover:after:w-full inline-flex items-center gap-1"
              title="Agnivo Neogi's personal website"
            >
              Author
              <span className="text-[10px] text-muted-foreground">↗</span>
            </a>
            
            <div className="h-4 w-[1px] bg-border/60" />
            
            <ModeToggle />
          </nav>

          {/* Mobile Navigation */}
          <div className="flex md:hidden items-center gap-1.5">
            <ModeToggle />
            <MobileNav />
          </div>
        </div>
      </div>
    </header>
  );
}
