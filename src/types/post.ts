// types/post.ts
export interface ClientPost {
  _id: string;
  title: string;
  slug: string;
  content: string;
  tags?: string[];
  image?: string|null;
  date: string;
  creator: string | { username: string, _id?:string }; // whatever you populate
}
