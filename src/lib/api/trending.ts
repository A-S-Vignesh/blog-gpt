export async function getTrendingPosts() {
  const res = await fetch("/api/post/trending?limit=5", {
    cache: "no-store",
  });

  if (!res.ok) throw new Error("Failed to fetch trending posts");

  return res.json();
}
