import PaginatedStories from "@/components/paginated-stories";
import * as demo from "@/sanity/lib/demo";
import { sanityFetch } from "@/sanity/lib/fetch";
import { settingsQuery } from "@/sanity/lib/queries";
import Link from "next/link";
import { Suspense } from "react";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page: string | undefined }>;
}) {
  const page = parseInt((await searchParams).page || "1");
  const settings = await sanityFetch({
    query: settingsQuery,
  });
  return (
    <div className="container mx-auto px-5">
      <h2 className="mb-16 mt-10 text-2xl font-bold leading-tight tracking-tight md:text-4xl md:tracking-tighter">
        <Link href="/" className="hover:underline">
          {settings?.title || demo.title}
        </Link>
      </h2>

      <h2 className="mb-8 text-6xl font-bold leading-tight tracking-tighter md:text-7xl">
        All Stories
      </h2>
      <Suspense>
        <PaginatedStories page={page} />
      </Suspense>
    </div>
  );
}
