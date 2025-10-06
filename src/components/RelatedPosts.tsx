// components/RelatedPosts.tsx
import Link from "next/link";
import Image from "next/image";
import Date from "@/components/Date";
import Tags from "@/components/Tags";
import { PopulatedClientPost } from "@/types/post";

interface RelatedPost {
  _id: string;
  title: string;
  slug: string;
  image?: string;
  date: string;
  creator: string;
  content: string;
  tags: string[];
}

export default function RelatedPosts({
  posts,
}: {
  posts: PopulatedClientPost[];
}) {
  if (!posts || posts.length === 0) {
    return <p className="text-center text-gray-400">No related posts found.</p>;
  }

  return (
    <div className="mt-10 w-full">
      <h2 className="text-xl font-semibold mb-4">You may also like</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-x-10 lg:gap-x-16 mt-2 md:mt-4">
        {posts.map((post) => (
          <div
            key={post._id}
            className="flex flex-col w-full sm:max-w-[390px] rounded-md gap-2 mb-6"
          >
            <div className="relative overflow-hidden rounded-md h-[250px] w-full">
              <Link href={`/post/${post.slug}`} className="block w-full h-full">
                <Image
                  src={post.image || "/assets/images/laptop.jpg"}
                  alt={post.title}
                  fill
                  className="rounded-md object-cover hover:scale-110 transition ease-linear duration-200"
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 390px"
                />
              </Link>
            </div>

            <div className="content w-full">
              <Date date={post.date} creator={post.creator} />
              <Link
                href={`/post/${post.slug}`}
                className="text-[20px] sm:text-[24px] line-clamp-1 capitalize mb-3 text-black dark:text-white font-semibold"
              >
                {post.title}
              </Link>
              {post.content && (
                <div className="para line-clamp-3 text-md">{post.content}</div>
              )}
              <Tags limit={3} tags={post.tags} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
