"use client";
import LoadingSkeleton from "@/components/Loading";
import { generatePostAction } from "@/redux/slice/generatePost";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { InfinitySpin } from "react-loader-spinner";

const Page = () => {
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
    const commonWords = [
      "the",
      "a",
      "an",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
    ];
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


      const textRes = await fetch("/api/post/generate/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptString }),
      });

      let imageData = { image: "" };
      if (generateImage) {
        const imageRes = await fetch("/api/post/generate/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: `An image that best represents: ${userInput.prompt}`,
          }),
        });

        imageData = await imageRes.json();

        if (!imageRes.ok) {
          throw new Error(imageData.error || "Failed to generate image");
        }
      }

      const textData = await textRes.json();

      if (!textRes.ok) {
        throw new Error(textData.error || "Failed to generate content");
      }

      dispatch(
        generatePostAction.setPost({
          title: userInput.title,
          content: textData.content,
          slug,
          tag: tags,
          image: imageData.image, // May be empty if checkbox is not selected
        })
      );

      setGenerationComplete(true);
      setUserInput({ title: "", prompt: "" });
    } catch (error) {
      console.error("Error generating content or image:", error);
      setError(error.message);
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
    <section className="padding relative min-h-screen px-6 sm:px-16 md:px-20 lg:px-28 py-3 sm:py-4 bg-white dark:bg-dark-100">
      {loading && (
        <div className="absolute w-full flex-col h-full bg-[rgba(0,0,0,0.4)] top-0 left-0 center">
          <div className="bg-white dark:bg-dark-100 p-8 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 text-center text-black dark:text-white">
              {generationComplete
                ? "Generation Complete!"
                : "Generating Your Blog Post"}
            </h3>
            {!generationComplete ? (
              <>
                <div className="mb-6">
                  <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700">
                    <div
                      className="h-2 bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${(generationStep / 5) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <p className="text-center text-gray-700 dark:text-gray-300 mb-4">
                  {getGenerationStepText()}
                </p>
                <div className="flex justify-center">
                  <InfinitySpin
                    visible={true}
                    width="200"
                    color="#4F46E5"
                    ariaLabel="infinity-spin-loading"
                  />
                </div>
              </>
            ) : (
              <div className="text-center">
                <div className="mb-4">
                  <svg
                    className="mx-auto h-12 w-12 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <p className="text-gray-700 dark:text-gray-300">
                  Your blog post has been generated successfully! Redirecting to
                  create page...
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <h2 className="title_heading">Generate Blog Post</h2>
      <p className="para">
        Discover personalized content tailored to your interests with our
        AI-driven blog. Input your preferences below and explore articles on the
        latest AI trends, insights, and innovations. Stay informed, stay
        engaged, and dive into the world of artificial intelligence with us!
      </p>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <form className="flex flex-col" onSubmit={handleSubmit}>
        <label className="form_label" htmlFor="title">
          Title
        </label>
        <input
          placeholder="Write the Title"
          className="form_input"
          type="text"
          id="title"
          value={userInput.title}
          onChange={(e) =>
            setUserInput({ ...userInput, title: e.target.value })
          }
          required
        />

        <label className="form_label" htmlFor="prompt">
          Prompt
        </label>
        <textarea
          className="form_input"
          name="prompt"
          id="prompt"
          value={userInput.prompt}
          onChange={(e) =>
            setUserInput({ ...userInput, prompt: e.target.value })
          }
          placeholder="Write a Prompt"
          cols="30"
          rows="5"
          required
        ></textarea>

        <div className="flex items-start gap-3 mt-4">
          <input
            type="checkbox"
            id="generateImage"
            checked={generateImage}
            onChange={() => setGenerateImage(!generateImage)}
            className="mt-1"
          />
          <label
            htmlFor="generateImage"
            className="text-sm text-gray-700 dark:text-gray-300"
          >
            Generate an AI image for the blog post.{" "}
            <span className="text-red-500 font-medium">
              (Consumes more API credentials)
            </span>
          </label>
        </div>

        <div className="flex items-center my-6 sm:w-[75%] justify-start gap-6 flex-nowrap">
          <Link href="/">
            <button type="button" className="outline_btn">
              Cancel
            </button>
          </Link>
          <button type="submit" className="black_btn" disabled={loading}>
            {loading ? "Generating..." : "Generate"}
          </button>
        </div>
      </form>
    </section>
  );
};

export default Page;
