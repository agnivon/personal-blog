import { sanityFetch } from "@/sanity/lib/fetch";
import { settingsQuery } from "@/sanity/lib/queries";
import React from "react";
import PortableText from "./portable-text";
import { PortableTextBlock } from "next-sanity";
import * as demo from "@/sanity/lib/demo";
import { AUTHOR_NAME, AUTHOR_SITE_URL } from "@/lib/site";

const Footer = async () => {
  const data = await sanityFetch({ query: settingsQuery });
  const title = data?.title || demo.title;
  const footer = data?.footer || [];

  return (
    <footer className="border-t border-border/40 bg-background/50 py-12 select-none">
      <div className="container mx-auto px-5 max-w-6xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <span className="font-serif text-lg font-bold tracking-tight">
              {title}
              <span className="text-blue-600 dark:text-blue-400">.</span>
            </span>
            <p className="text-xs text-muted-foreground mt-1 font-light">
              &copy; {new Date().getFullYear()}{" "}
              <a
                href={AUTHOR_SITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors underline decoration-border/60 hover:decoration-foreground"
              >
                {AUTHOR_NAME}
              </a>
              . All rights reserved.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-muted-foreground">
            <a
              href={AUTHOR_SITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors font-semibold text-foreground/90"
            >
              agnivon.dev
            </a>
            <a href="/feed.xml" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
              RSS Feed
            </a>
            <a href="https://nextjs.org" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
              Next.js
            </a>
            <a href="https://sanity.io" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
              Sanity CMS
            </a>
            <a href="https://convex.dev" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
              Convex
            </a>
            <a href="https://github.com/agnivon" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
              GitHub
            </a>
          </div>
        </div>
        
        {footer.length > 0 && (
          <div className="mt-8 border-t border-border/20 pt-8 flex justify-center w-full">
            <PortableText
              className="prose-xs text-pretty text-center prose-p:text-center text-muted-foreground max-w-none font-light mx-auto"
              value={footer as PortableTextBlock[]}
            />
          </div>
        )}
      </div>
    </footer>
  );
};

export default Footer;
