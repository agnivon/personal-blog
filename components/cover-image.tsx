import { Image } from "next-sanity/image";

import { urlForImage } from "@/sanity/lib/utils";

interface CoverImageProps {
  image: any;
  priority?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
}

export default function CoverImage(props: CoverImageProps) {
  const {
    image: source,
    priority,
    width = 1200,
    height = 675,
    sizes = priority
      ? "(max-width: 768px) 100vw, 1200px"
      : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px",
  } = props;
  const image = source?.asset?._ref ? (
    <Image
      className="w-full h-full object-cover"
      width={width}
      height={height}
      alt={source?.alt || ""}
      src={urlForImage(source)?.width(width).height(height).url() as string}
      sizes={sizes}
      priority={priority}
    />
  ) : (
    <div className="bg-muted w-full h-full" />
  );

  return (
    <div className="w-full h-full shadow-md transition-shadow duration-200 group-hover:shadow-lg sm:mx-0">
      {image}
    </div>
  );
}
