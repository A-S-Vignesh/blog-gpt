export default function PostCard({ post }:{post:any}) {
  return (
    <div className="border-b py-6 hover:bg-gray-50 transition cursor-pointer">
      <div className="flex items-center gap-2 mb-2">
        <img src={post.author.image} className="w-6 h-6 rounded-full" />
        <span className="text-sm font-medium">{post.author.username}</span>
      </div>

      <h2 className="text-xl font-semibold mb-1">{post.title}</h2>
      <p className="text-gray-600 line-clamp-2 mb-2">{post.description}</p>

      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span>{post.readTime} min read</span>
        <span>·</span>
        <span>{post.createdAtFormatted}</span>
      </div>
    </div>
  );
}
