"use client";
import {
  FaUpload,
  FaTimes,
  FaSave,
  FaTag,
  FaLink,
  FaImage,
  FaPencilAlt,
} from "react-icons/fa";
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import MarkdownPreview from "@uiw/react-markdown-preview";
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

interface FormPropsType{
  name: string;
  submitting: boolean;
  post: {
    title: string;
    content: string;
    slug: string;
    image?: string | null |ArrayBuffer | undefined;
    tags: string[],
  };
  setPost: (post: any) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  handleCancel: () => void;
}



const Form:React.FC<FormPropsType> = ({
  name,
  submitting,
  post,
  setPost,
  handleSubmit,
  handleCancel,
}) => {
  const [imageUrl, setImageUrl] = useState<string | ArrayBuffer | undefined | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");

  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    let file = e.target.files?.[0];
    if (!file) return;

    //base64
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      const result = reader.result;
      if (result) {
        setImageUrl(result);
        setPost({ ...post, image: result });
      }
    };
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;

    //base64
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      const result = reader.result;
      if (result) {
        setImageUrl(result);
        setPost({ ...post, image: result });
      }
    };
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim() !== "") {
      e.preventDefault();

      if (!post.tags.includes(inputValue.trim())) {
        setPost({
          ...post,
          tags: [...post.tags, inputValue.trim()],
        });
      }

      setInputValue("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setPost({
      ...post,
      tags: post.tags.filter((tag) => tag !== tagToRemove),
    });
  };


  useEffect(() => {
    setImageUrl(post?.image);
  }, [post]);

  return (
    <>
      <section className="py-16 px-6 sm:px-16 md:px-20 lg:px-28 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            {name === "Create" ? "Craft Your" : "Refine Your"}{" "}
            <span className="text-blue-600 dark:text-blue-400">
              {name === "Create" ? "Masterpiece" : "Creation"}
            </span>
          </h1>
          <p className="text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
            {name === "Create"
              ? "Share your insights with the world. Create something amazing!"
              : "Perfect your post and make it shine."}
          </p>
        </div>
      </section>
      <section className="px-6 sm:px-16 md:px-20 lg:px-28 py-8 sm:py-10 bg-white dark:bg-dark-100">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Title Section */}
            <div className="bg-white dark:bg-dark-100 border-2 border-gray-200 dark:border-gray-700 rounded-xl shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg mr-3">
                  <FaPencilAlt className="text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Blog Title
                </h2>
              </div>
              <input
                placeholder="Craft a compelling title that captures attention..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-dark-100 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                type="text"
                value={post?.title}
                onChange={(e) => setPost({ ...post, title: e.target.value })}
                required
              />
            </div>

            {/* Content Editor */}
            <div className="bg-white dark:bg-dark-100 border-2 border-gray-200 dark:border-gray-700 rounded-xl shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-lg mr-3">
                  <FaPencilAlt className="text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Content
                </h2>
              </div>
              <div className="border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-dark-100 text-black dark:text-white p-2">
                <MDEditor
                  value={post.content}
                  onChange={(val) => setPost({ ...post, content: val || "" })}
                  height={500}
                  className="rounded-lg"
                />

                {/* Optional: Separate preview */}
                <div className="mt-4 p-3 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-dark-200">
                  <MarkdownPreview source={post.content} />
                </div>
              </div>
            </div>

            {/* Slug Section */}
            <div className="bg-white dark:bg-dark-100 border-2 border-gray-200 dark:border-gray-700 rounded-xl shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg mr-3">
                  <FaLink className="text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  URL Slug
                  <span className="block text-sm font-normal text-gray-500 dark:text-gray-400 mt-1">
                    (Ex: your-blog-post-title)
                  </span>
                </h2>
              </div>
              <input
                type="text"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-dark-100 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Enter a unique URL slug for your post"
                name="slug"
                value={post?.slug}
                onChange={(e) => setPost({ ...post, slug: e.target.value })}
                required
              ></input>
            </div>

            {/* Image Upload */}
            <div className="bg-white dark:bg-dark-100 border-2 border-gray-200 dark:border-gray-700 rounded-xl shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="bg-amber-100 dark:bg-amber-900 p-2 rounded-lg mr-3">
                  <FaImage className="text-amber-600 dark:text-amber-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Featured Image
                </h2>
              </div>

              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className={`relative group border-2 border-dashed rounded-xl overflow-hidden transition-all duration-300
                ${
                  imageUrl
                    ? "border-gray-300 dark:border-gray-600 h-80"
                    : "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 h-64 cursor-pointer"
                }`}
              >
                {imageUrl ? (
                  <div
                    className="w-full h-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${imageUrl})` }}
                  >
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <label
                        htmlFor="image"
                        className="bg-white dark:bg-dark-100 px-4 py-2 rounded-lg text-gray-900 dark:text-white flex items-center cursor-pointer"
                      >
                        <FaUpload className="mr-2" />
                        Change Image
                      </label>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor="image"
                    className="w-full h-full flex flex-col items-center justify-center p-6 text-center cursor-pointer"
                  >
                    <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-full mb-4">
                      <FaUpload className="text-blue-600 dark:text-blue-400 text-2xl" />
                    </div>
                    <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Drag & Drop or Click to Upload
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Recommended size: 1200x630 pixels
                    </p>
                    <span className="block text-sm text-gray-500 dark:text-gray-400 mt-4">
                      Supports JPG, PNG, WEBP (Max 5MB)
                    </span>
                  </label>
                )}

                <input
                  onChange={handleUploadImage}
                  type="file"
                  accept="image/*"
                  id="image"
                  className="hidden"
                />
              </div>
            </div>

            {/* Tags Section */}
            <div className="bg-white dark:bg-dark-100 border-2 border-gray-200 dark:border-gray-700 rounded-xl shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="bg-indigo-100 dark:bg-indigo-900 p-2 rounded-lg mr-3">
                  <FaTag className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Tags
                  <span className="block text-sm font-normal text-gray-500 dark:text-gray-400 mt-1">
                    (Press Enter after each tag)
                  </span>
                </h2>
              </div>

              {/* Tags list */}
              <div className="flex flex-wrap gap-2 mb-3">
                {post.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full flex items-center gap-2"
                  >
                    #{tag}
                    <FaTimes
                      className="cursor-pointer hover:text-red-500"
                      onClick={() => removeTag(tag)}
                    />
                  </span>
                ))}
              </div>

              {/* Input */}
              <input
                placeholder="Type a tag and press Enter"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-dark-100 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition flex items-center justify-center"
              >
                <FaTimes className="mr-2" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:opacity-90 transition flex items-center justify-center disabled:opacity-70"
              >
                <FaSave className="mr-2" />
                {submitting ? `${name}...` : name}
              </button>
            </div>
          </form>
          <div className="mt-6 text-center text-gray-500 dark:text-gray-400">
            {name === "Create"
              ? "Your post make take time around 10 to 15 min to get visible to the user"
              : "Your changes will be saved and visible to users shortly."}
          </div>
        </div>
      </section>
    </>
  );
};

export default Form;
