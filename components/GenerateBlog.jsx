"use client";

import { redirect } from "next/navigation";
import {
  FaMagic,
  FaImage,
  FaPencilAlt,
  FaCheck,
  FaSpinner,
} from "react-icons/fa";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { generatePostAction } from "@/redux/slice/generatePost";
import commonWords from "@/utils/CommonWords";

export default function GenerateBlog() {
    const [userInput, setUserInput] = useState({
      title: "",
      prompt: "",
    });

    const [generateImage, setGenerateImage] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [generationStep, setGenerationStep] = useState(0);
    const [generationComplete, setGenerationComplete] = useState(false);
    const dispatch = useDispatch();
    const navigate = useRouter();

    useEffect(() => {
      let interval;
      if (loading) {
        interval = setInterval(() => {
          setGenerationStep((prev) => (prev < 5 ? prev + 1 : prev));
        }, 4000);
      } else {
        setGenerationStep(0);
      }
      return () => clearInterval(interval);
    }, [loading]);

    useEffect(() => {
      if (generationComplete) {
        const timer = setTimeout(() => {
          navigate.push("/post/create");
        }, 1500);
        return () => clearTimeout(timer);
      }
    }, [generationComplete, navigate]);

    const generateSlug = (title) => {
      return title
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
    };

    const generateTags = (prompt) => {
      const words = prompt.toLowerCase().split(/\s+/);
      const uniqueWords = [
        ...new Set(
          words.filter((word) => word.length > 3 && !commonWords.includes(word))
        ),
      ];
      return uniqueWords
        .slice(0, 5)
        .map((word) => `#${word.charAt(0).toUpperCase() + word.slice(1)}`)
        .join(", ");
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      setError(null);
      setGenerationStep(0);
      setGenerationComplete(false);

      try {
        const slug = generateSlug(userInput.title);
        const tags = generateTags(userInput.prompt);

        const promptString = `Write a detailed, SEO-friendly blog post about "${userInput.prompt}" suitable for a modern blog website.

Start the blog with a short, engaging 2–3 sentence introductory paragraph **without using any heading**. This intro should clearly explain what the blog is about to hook the reader.

After the intro, continue the article with proper markdown-formatted headings and subheadings. Cover all important aspects of the topic with explanations, examples, and key insights. Keep the tone informative and engaging, and make sure it flows naturally for readers.`;

        // 1️⃣ Generate text first
        const textRes = await fetch("/api/post/generate/text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: promptString }),
        });

        if (!textRes.ok) {
          const err = await textRes.json().catch(() => ({}));
          throw new Error(err.error || "Failed to generate content");
        }
        const textData = await textRes.json();

        // 2️⃣ Optionally generate image
        let imageData = { image: "" };
        if (generateImage) {
          const imageRes = await fetch("/api/post/generate/image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: `An image that best represents: ${userInput.prompt}`,
            }),
          });

          if (!imageRes.ok) {
            const err = await imageRes.json().catch(() => ({}));
            throw new Error(err.error || "Failed to generate image");
          }
          imageData = await imageRes.json();
        }

        // 3️⃣ Update state
        dispatch(
          generatePostAction.setPost({
            title: userInput.title,
            content: textData.content,
            slug,
            tag: tags,
            image: imageData.image,
          })
        );

        setGenerationComplete(true);
        setUserInput({ title: "", prompt: "" });
      } catch (error) {
        console.error("❌ Generation error:", error);
        setError(error.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };


    const getGenerationStepText = () => {
      switch (generationStep) {
        case 0:
          return "Analyzing your prompt...";
        case 1:
          return "Researching the topic...";
        case 2:
          return "Structuring the content...";
        case 3:
          return "Writing the introduction...";
        case 4:
          return "Generating image and content...";
        case 5:
          return "Finalizing everything...";
        default:
          return "Generating your blog post...";
      }
    };

    return (
      <div className="min-h-screen bg-white dark:bg-dark-100">
        {/* Loading overlay */}
        {loading && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-dark-100 rounded-2xl shadow-xl p-8 max-w-md w-full">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 mb-6">
                  <FaMagic className="text-blue-600 dark:text-blue-400 text-2xl" />
                </div>

                <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                  {generationComplete
                    ? "Generation Complete!"
                    : "Generating Your Blog Post"}
                </h3>

                {!generationComplete ? (
                  <>
                    <div className="mb-6">
                      <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500"
                          style={{ width: `${(generationStep / 5) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mb-6">
                      {getGenerationStepText()}
                    </p>
                    <div className="flex justify-center">
                      <div className="animate-spin">
                        <FaSpinner className="text-blue-600 dark:text-blue-400 text-3xl" />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 mx-auto">
                      <FaCheck className="text-green-600 dark:text-green-400 text-2xl" />
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">
                      Your blog post has been generated successfully!
                      Redirecting to create page...
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        <section className="py-16 px-6 sm:px-16 md:px-20 lg:px-28 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Generate Blog Post{" "}
              <span className="text-blue-600 dark:text-blue-400">with AI</span>
            </h1>
            <p className="text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
              Create unique, SEO-optimized content in seconds with our
              AI-powered blog generator
            </p>
          </div>
        </section>
        <div className="px-6 sm:px-16 md:px-20 lg:px-28 py-12">
          <div className="max-w-4xl mx-auto">
            {/* Error message */}
            {error && (
              <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-xl p-4 mb-8">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-600 dark:text-red-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                      Error
                    </h3>
                    <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Form */}
            <div className="space-y-8">
              <form onSubmit={handleSubmit} className="space-y-8">

                <div className="bg-white dark:bg-dark-100 rounded-xl shadow-md p-6 border-2 border-gray-200 dark:border-gray-700">
                  <div className="flex items-center mb-4">
                    <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg mr-3">
                      <FaPencilAlt className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Blog Title
                    </h2>
                  </div>
                  <input
                    placeholder="Enter a compelling title for your blog post"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-dark-100 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    type="text"
                    id="title"
                    value={userInput.title}
                    onChange={(e) =>
                      setUserInput({ ...userInput, title: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="bg-white dark:bg-dark-100 rounded-xl shadow-md p-6 border-2 border-gray-200 dark:border-gray-700">
                  <div className="flex items-center mb-4">
                    <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg mr-3">
                      <FaPencilAlt className="text-green-600 dark:text-green-400" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Content Prompt
                      <span className="block text-sm font-normal text-gray-500 dark:text-gray-400 mt-1">
                        Example: "Write a comprehensive guide about AI in
                        healthcare, covering current applications, benefits,
                        challenges, and future trends."
                      </span>
                    </h2>
                  </div>
                  <textarea
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-dark-100 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="Describe what you want the blog post to cover"
                    id="prompt"
                    value={userInput.prompt}
                    onChange={(e) =>
                      setUserInput({ ...userInput, prompt: e.target.value })
                    }
                    rows={6}
                    required
                  ></textarea>
                </div>

                {/* Image Generation Option */}
                <div className="bg-gray-50 dark:bg-gray-800/30 rounded-xl p-5 border-2 border-gray-200 dark:border-gray-700">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="generateImage"
                        type="checkbox"
                        checked={generateImage}
                        onChange={() => setGenerateImage(!generateImage)}
                        className="w-4 h-4 text-blue-600 dark:text-blue-400 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                      />
                    </div>
                    <div className="ml-3">
                      <label
                        htmlFor="generateImage"
                        className="font-medium text-gray-900 dark:text-white flex items-center"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2 text-blue-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        Generate Featured Image
                      </label>
                      <p className="text-gray-500 dark:text-gray-400 mt-2">
                        Create an AI-generated image for your blog post header.
                        <span className="ml-1 text-red-500 font-medium">
                          (Consumes more AI credits)
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <Link
                    href="/post"
                    className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition flex items-center justify-center"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:opacity-90 transition flex items-center justify-center disabled:opacity-70 shadow-md hover:shadow-lg"
                  >
                    {loading ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Generating...
                      </>
                    ) : (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                        Generate Blog Post
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Features */}
            <div className="mt-16">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Why Use Our AI Generator?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    icon: <FaMagic className="text-blue-500 text-xl" />,
                    title: "Lightning Fast",
                    description:
                      "Generate complete blog posts in under 60 seconds",
                  },
                  {
                    icon: <FaImage className="text-purple-500 text-xl" />,
                    title: "SEO Optimized",
                    description:
                      "AI creates content that ranks well on search engines",
                  },
                  {
                    icon: <div className="text-green-500 text-xl">✏️</div>,
                    title: "Easy Customization",
                    description:
                      "Edit and refine generated content to match your voice",
                  },
                ].map((feature, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-dark-100 rounded-xl p-6 shadow-md border-2 border-gray-200 dark:border-gray-700"
                  >
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-4">
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className="mt-16 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Tips for Best Results
              </h2>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                      <span className="text-white text-sm">1</span>
                    </div>
                  </div>
                  <p className="ml-3 text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Be specific:</span> Provide
                    detailed instructions for more accurate content
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                      <span className="text-white text-sm">2</span>
                    </div>
                  </div>
                  <p className="ml-3 text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Include keywords:</span>{" "}
                    Mention important SEO keywords for better optimization
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                      <span className="text-white text-sm">3</span>
                    </div>
                  </div>
                  <p className="ml-3 text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Define your audience:</span>{" "}
                    Specify who the content is for (beginners, experts, etc.)
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );

}