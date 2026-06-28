import PaginatedStories from "@/components/paginated-stories";
import { Suspense } from "react";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page: string | undefined }>;
}) {
  const page = parseInt((await searchParams).page || "1");
  return (
    <div className="container mx-auto px-5 max-w-6xl">
      <div className="mb-12 mt-6">
        <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">Archives</span>
        <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mt-1">
          All Stories
        </h1>
        <p className="text-muted-foreground text-sm md:text-base mt-2 font-light max-w-lg">
          A curated collection of articles, news grounding, and AI insights.
        </p>
      </div>
      
      <Suspense>
        <PaginatedStories page={page} />
      </Suspense>
    </div>
  );
}
