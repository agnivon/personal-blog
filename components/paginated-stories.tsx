import { sanityFetch } from "@/sanity/lib/fetch";
import { paginatedPostsQuery, totalPostCountQuery } from "@/sanity/lib/queries";
import Article from "./article";
import Link from "next/link";
import { ChevronDownIcon } from "lucide-react";

export default async function PaginatedStories({
  page = 1,
  pageSize = 10,
}: {
  page?: number;
  pageSize?: number;
}) {
  const totalPosts = await sanityFetch({ query: totalPostCountQuery });
  const totalPages = Math.ceil(totalPosts / pageSize);
  if (page > totalPages) {
    page = 1;
  }
  // const offset = (page - 1) * pageSize;
  const paginatedPosts = await sanityFetch({
    query: paginatedPostsQuery,
    params: {
      offset: 0,
      end: page * pageSize,
    },
  });
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mb-12">
        {paginatedPosts?.map((post) => {
          return <Article key={post._id} post={post} />;
        })}
      </div>
      {page < totalPages && (
        <div className="flex justify-center mt-12 mb-16">
          <Link
            href={`/posts?page=${page + 1}`}
            className="inline-flex items-center gap-2 px-6 py-3 border border-border/80 hover:border-foreground bg-card hover:bg-muted text-sm font-semibold rounded-xl transition-all duration-200 shadow-sm cursor-pointer"
            scroll={false}
          >
            <ChevronDownIcon className="w-4 h-4" />
            See More ({totalPosts - page * pageSize})
          </Link>
        </div>
      )}
    </>
  );
}
