import { Author, MoreStoriesQueryResult, Post } from "@/sanity.types";
import Link from "next/link";

import Avatar from "./avatar";
import CoverImage from "./cover-image";
import DateComponent from "./date";

const Article = ({ post }: { post: MoreStoriesQueryResult[number] }) => {
  const { _id, title, slug, coverImage, excerpt, author } = post;
  return (
    <article key={_id} className="group flex flex-col justify-between">
      <div>
        <Link href={`/posts/${slug}`} className="block mb-4 overflow-hidden rounded-xl border border-border/40 bg-muted aspect-[16/10]">
          <div className="w-full h-full scale-100 group-hover:scale-[1.03] transition-transform duration-500 ease-out">
            <CoverImage image={coverImage} priority={false} />
          </div>
        </Link>
        
        <div className="flex items-center gap-2 mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <DateComponent dateString={post.date} />
        </div>
        
        <h3 className="font-serif text-2xl font-bold leading-tight mb-3 tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          <Link href={`/posts/${slug}`}>
            {title}
          </Link>
        </h3>
        
        {excerpt && (
          <p className="text-muted-foreground text-sm leading-relaxed mb-4 font-light line-clamp-3">
            {excerpt}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border/20 pt-4 mt-auto">
        {author && <Avatar name={author.name} picture={author.picture} />}
        <Link 
          href={`/posts/${slug}`}
          className="text-xs font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition-colors inline-flex items-center gap-0.5"
        >
          Read
          <span className="inline-block transform transition-transform group-hover:translate-x-0.5 duration-200">→</span>
        </Link>
      </div>
    </article>
  );
};

export default Article;
