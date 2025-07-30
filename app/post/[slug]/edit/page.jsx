import EditPostClient from "@/components/EditPostClient";

export default function EditPostPage({ params }) {
  return <EditPostClient slug={params.slug} />;
}
