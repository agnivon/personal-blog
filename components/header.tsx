import Link from "next/link";
import { ModeToggle } from "./mode-toggle";
import { sanityFetch } from "@/sanity/lib/fetch";
import { settingsQuery } from "@/sanity/lib/queries";
import * as demo from "@/sanity/lib/demo";

export default async function Header() {
  const settings = await sanityFetch({ query: settingsQuery });
  const title = settings?.title || demo.title;

  return (
    <header className="glass-nav top-0 w-full select-none">
      <div className="container mx-auto px-5">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link 
              href="/" 
              className="font-serif text-2xl font-bold tracking-tight hover:opacity-85 transition-opacity"
            >
              {title}
              <span className="text-blue-600 dark:text-blue-400">.</span>
            </Link>
          </div>
          
          <nav className="flex items-center gap-6 text-sm font-medium">
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
            
            <div className="h-4 w-[1px] bg-border/60" />
            
            <ModeToggle />
          </nav>
        </div>
      </div>
    </header>
  );
}
