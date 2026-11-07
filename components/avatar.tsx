import { Image } from "next-sanity/image";

import type { Author } from "@/sanity.types";
import { urlForImage } from "@/sanity/lib/utils";
import { AUTHOR_NAME, AUTHOR_SITE_URL } from "@/lib/site";

interface Props {
  name?: string | null;
  picture?: Author["picture"] | null;
  url?: string | null;
}

export default function Avatar({
  name = AUTHOR_NAME,
  picture,
  url = AUTHOR_SITE_URL,
}: Props) {
  const authorName = name || AUTHOR_NAME;
  const targetUrl = url || AUTHOR_SITE_URL;

  const content = (
    <div className="group/avatar flex items-center text-xl">
      {picture?.asset?._ref ? (
        <div className="mr-4 h-12 w-12 overflow-hidden rounded-full border border-border/40 bg-muted shadow-xs">
          <Image
            alt={picture?.alt || authorName}
            className="h-full rounded-full object-cover transition-transform duration-300 group-hover/avatar:scale-105"
            height={48}
            width={48}
            src={
              urlForImage(picture)
                ?.height(96)
                .width(96)
                .fit("crop")
                .url() as string
            }
          />
        </div>
      ) : (
        <div className="mr-1 text-muted-foreground font-light text-base">By </div>
      )}
      <div className="text-pretty text-xl font-bold group-hover/avatar:text-blue-600 dark:group-hover/avatar:text-blue-400 transition-colors">
        {authorName}
      </div>
    </div>
  );

  if (targetUrl) {
    return (
      <a
        href={targetUrl}
        target="_blank"
        rel="noopener noreferrer"
        title={`${authorName} (${targetUrl})`}
        className="inline-flex items-center"
      >
        {content}
      </a>
    );
  }

  return content;
}
