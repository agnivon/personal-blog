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
      <div className="mb-32 grid grid-cols-1 gap-y-20 md:grid-cols-2 md:gap-x-16 md:gap-y-32 lg:gap-x-32">
        {paginatedPosts?.map((post) => {
          return <Article key={post._id} post={post} />;
        })}
      </div>
      {page < totalPages && (
        <Link
          href={`/posts?page=${page + 1}`}
          className="mx-auto mb-6 border bg-foreground py-3 px-12 font-bold text-background transition-colors duration-200 hover:bg-background hover:text-foreground lg:px-8 flex w-fit"
          scroll={false}
        >
          <ChevronDownIcon /> See More
        </Link>
      )}
    </>
  );
}
