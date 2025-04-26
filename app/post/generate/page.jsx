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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generationStep, setGenerationStep] = useState(0);
  const [generationComplete, setGenerationComplete] = useState(false);
  const dispatch = useDispatch();
  const navigate = useRouter();

  // Simulate generation steps for better UX
  useEffect(() => {
    let interval;
    if (loading) {
      // Slower progression to match actual generation time
      interval = setInterval(() => {
        setGenerationStep((prev) => {
          if (prev < 5) return prev + 1;
          return prev;
        });
      }, 4000); // Increased to 4 seconds per step
    } else {
      setGenerationStep(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Redirect after generation is complete
  useEffect(() => {
    if (generationComplete) {
      const timer = setTimeout(() => {
        navigate.push("/post/create");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [generationComplete, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setGenerationStep(0);
    setGenerationComplete(false);

    try {
      const promptString = `Write a comprehensive, detailed blog post about ${userInput.prompt}. 
      
      Format the content as plain text without any Markdown formatting (no asterisks, no bullet points with *, no special formatting).
      
      Structure the post with:
      1. An engaging introduction (4-5 sentences) that hooks readers and mentions the topic's importance
      2. At least 4-5 main sections with descriptive headings
      3. Each section should be substantial (at least 3-4 paragraphs) with detailed explanations
      4. Include 6-8 evidence-backed points with statistics, quotes, or examples
      5. A thorough conclusion (4-5 sentences) that summarizes key takeaways and includes a call to action
      
      Aim for a post length of at least 1200-1500 words. Make it comprehensive and in-depth.
      Keep the writing clear, informative, and conversational. Avoid using any special formatting characters like * or #.`;

      const response = await fetch("/api/post/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: promptString }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || "Failed to generate content");
      }

      if (!data.content) {
        throw new Error("No content received from the API");
      }

      dispatch(
        generatePostAction.setPost({
          title: userInput.title,
          content: data.content,
        })
      );

      setGenerationComplete(true);
      setUserInput({
        title: "",
        prompt: "",
      });
    } catch (error) {
      console.error("Error generating content:", error);
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
        return "Developing the main sections...";
      case 5:
        return "Finalizing the content...";
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
              {generationComplete ? "Generation Complete!" : "Generating Your Blog Post"}
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
                  <svg className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-gray-700 dark:text-gray-300">
                  Your blog post has been generated successfully! Redirecting to create page...
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

        <div className="flex items-center my-4 sm:w-[75%] justify-start gap-6 flex-nowrap">
          <Link href="/">
            <button type="button" className="outline_btn">Cancel</button>
          </Link>
          <button
            type="submit"
            className="black_btn"
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate"}
          </button>
        </div>
      </form>
    </section>
  );
};

export default Page;
