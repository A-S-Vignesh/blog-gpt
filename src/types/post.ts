// types/post.ts

export interface ClientPost {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  image?: string | null;
  imagePublicId?: string;
  tags: string[];
  category?: string;
  status?: "draft" | "published" | "archived";
  views?: number;
  likes?: string[];
  comments?: string[];
  readingTime?: number;
  metaTitle?: string;
  metaDescription?: string;
  scheduledAt?: string;
  date: string;
  createdAt?: string;
  updatedAt?: string;
  creator: string;
}

export interface PopulatedClientPost extends Omit<ClientPost, "creator"> {
  creator: { username: string; _id?: string;name?: string };
}
