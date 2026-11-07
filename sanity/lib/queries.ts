import { defineQuery } from "next-sanity";

export const settingsQuery = defineQuery(`*[_type == "settings"][0]`);

const postFields = /* groq */ `
  _id,
  _updatedAt,
  hide,
  "status": select(_originalId in path("drafts.**") => "draft", "published"),
  "title": coalesce(title, "Untitled"),
  "slug": slug.current,
  excerpt,
  coverImage,
  "date": coalesce(date, _updatedAt),
  "author": author->{"name": coalesce(name, "Agnivo Neogi"), "url": coalesce(url, "https://agnivon.dev"), picture},
`;

export const heroQuery = defineQuery(`
  *[_type == "post" && defined(slug.current) && hide != true] | order(date desc, _updatedAt desc) [0] {
    content,
    ${postFields}
  }
`);

export const moreStoriesQuery = defineQuery(`
  *[_type == "post" && _id != $skip && defined(slug.current) && hide != true] | order(date desc, _updatedAt desc) [0...$limit] {
    ${postFields}
  }
`);

export const postByIdQuery = defineQuery(`
  *[_type == "post" && _id == $id][0] {
    content,
    sources,
    ${postFields}
  }
`);

export const postQuery = defineQuery(`
  *[_type == "post" && slug.current == $slug && hide != true] [0] {
    content,
    sources,
    ${postFields}
  }
`);

export const postsCreatedTodayQuery = defineQuery(`
  *[_type == "post" && dateTime(date) >= dateTime(now()) - 24*60*60 && dateTime(date) < dateTime(now()) + 1 && hide != true] | order(date desc, _updatedAt desc) {
    ${postFields}
  }
`);

export const paginatedPostsQuery = defineQuery(`
  *[_type == "post" && defined(slug.current) && hide != true] 
    | order(date desc, _updatedAt desc) 
    [$offset...$end] {
      ${postFields}
    }
`);

export const totalPostCountQuery = defineQuery(`
  count(*[_type == "post" && defined(slug.current) && hide != true])
`);

export const sitemapPostsQuery = defineQuery(`
  *[_type == "post" && defined(slug.current) && hide != true] {
    "slug": slug.current,
    "date": coalesce(date, _updatedAt),
    _updatedAt
  }
`);

export const feedQuery = defineQuery(`
  *[_type == "post" && defined(slug.current) && hide != true] | order(date desc, _updatedAt desc) [0...50] {
    title,
    "slug": slug.current,
    excerpt,
    "date": coalesce(date, _updatedAt),
    "author": coalesce(author->name, "Agnivo Neogi")
  }
`);
