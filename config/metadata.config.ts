import { sanityFetch } from "@/sanity/lib/fetch";
import { postQuery, settingsQuery } from "@/sanity/lib/queries";
import { Metadata, ResolvingMetadata } from "next";
import * as demo from "@/sanity/lib/demo";
import { resolveOpenGraphImage } from "@/sanity/lib/utils";
import { toPlainText } from "next-sanity";
import {
  AUTHOR_NAME,
  AUTHOR_SITE_URL,
  getCanonicalUrl,
  getSiteUrl,
} from "@/lib/site";

export async function generateSiteMetadata(): Promise<Metadata> {
  const settings = await sanityFetch({
    query: settingsQuery,
    // Metadata should never contain stega
    stega: false,
  });
  const title = settings?.title || demo.title;
  const description = settings?.description || demo.description;
  const plainDescription = toPlainText(description);

  const ogImage = resolveOpenGraphImage(settings?.ogImage);
  const siteUrl = getSiteUrl();
  const canonicalUrl = getCanonicalUrl("/");

  let metadataBase: URL;
  try {
    const configuredBase = settings?.ogImage?.metadataBase;
    if (configuredBase) {
      metadataBase = new URL(configuredBase);
    } else {
      metadataBase = new URL(siteUrl);
    }
  } catch {
    metadataBase = new URL(siteUrl);
  }

  return {
    metadataBase,
    title: {
      template: `%s | ${title}`,
      default: title,
    },
    description: plainDescription,
    applicationName: title,
    authors: [
      {
        name: AUTHOR_NAME,
        url: AUTHOR_SITE_URL,
      },
    ],
    creator: AUTHOR_NAME,
    publisher: AUTHOR_NAME,
    alternates: {
      canonical: canonicalUrl,
      types: {
        "application/rss+xml": `${canonicalUrl}/feed.xml`,
      },
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: canonicalUrl,
      siteName: title,
      title,
      description: plainDescription,
      images: ogImage ? [ogImage] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: plainDescription,
      images: ogImage ? [ogImage] : [],
      creator: "@agnivon",
    },
    category: "technology",
  };
}

export async function generatePostMetadata(
  params: { slug: string },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const post = await sanityFetch({
    query: postQuery,
    params,
    stega: false,
  });

  if (!post?._id) {
    return {
      title: "Post Not Found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const canonicalUrl = getCanonicalUrl(`/posts/${params.slug}`);
  const previousImages = (await parent).openGraph?.images || [];
  const ogImage = resolveOpenGraphImage(post?.coverImage);
  const images = ogImage ? [ogImage, ...previousImages] : previousImages;
  const title = post?.title || "Untitled";
  const description = post?.excerpt || "";

  return {
    metadataBase: new URL(getSiteUrl()),
    title,
    description,
    authors: [
      {
        name: post?.author?.name || AUTHOR_NAME,
        url: post?.author?.url || AUTHOR_SITE_URL,
      },
    ],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "article",
      title,
      description,
      url: canonicalUrl,
      publishedTime: post?.date || undefined,
      modifiedTime: post?._updatedAt || post?.date || undefined,
      authors: [post?.author?.name || AUTHOR_NAME],
      images,
      section: "Technology",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
      creator: "@agnivon",
    },
    robots: post?.hide
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
  } satisfies Metadata;
}
