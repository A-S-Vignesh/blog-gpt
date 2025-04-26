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

  // Generate a slug from the title
  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .trim(); // Trim hyphens from start and end
  };

  // Generate tags based on the prompt
  const generateTags = (prompt) => {
    // Extract key words from the prompt
    const words = prompt.toLowerCase().split(/\s+/);
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    
    // Filter out common words and get unique words
    const uniqueWords = [...new Set(words.filter(word => 
      word.length > 3 && !commonWords.includes(word)
    ))];
    
    // Take up to 5 words as tags and format with # symbol
    return uniqueWords.slice(0, 5).map(word => `#${word.charAt(0).toUpperCase() + word.slice(1)}`).join(', ');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setGenerationStep(0);
    setGenerationComplete(false);

    try {
      const promptString = `Write a comprehensive, detailed blog post about ${userInput.prompt}. 

Format the content with these guidelines:
1. Start with a direct opening paragraph (no heading)
2. Use **Section Title** format for headings
3. Each paragraph should be on a new line
4. Structure the post with:
   - A compelling opening (4-5 sentences)
   - 4-5 main sections with bold headings
   - Each section should have 3-4 paragraphs
   - Include statistics and examples
   - End with **Conclusion: Title**

Example format:

Virat Kohli, a name synonymous with aggressive batting, unwavering passion, and relentless pursuit of excellence. He's not just a cricketer; he's a phenomenon that has redefined batting in the modern era. From his early days as a brash youngster to his current status as a seasoned veteran, Kohli's journey has been nothing short of extraordinary.

**The Rise of a Run Machine: Kohli's IPL Journey**
Kohli's association with the Royal Challengers Bangalore (RCB) since the inaugural IPL season in 2008 has been a testament to his loyalty and leadership. While the elusive IPL trophy has remained just out of reach, his individual brilliance has consistently lit up the tournament.

He initially showcased glimpses of his potential, but it was in the 2011 season that Kohli truly announced his arrival as a force to be reckoned with. Scoring over 500 runs, he cemented his place in the RCB lineup and began his ascent to becoming one of the IPL's most dominant batsmen.

**Conclusion: The King's Legacy**
While records and achievements tell one part of the story, Kohli's true legacy lies in his impact on the sport and inspiration to millions of aspiring cricketers worldwide.

Aim for 1200-1500 words. Keep the writing engaging and professional.`;

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

      // Generate slug and tags
      const slug = generateSlug(userInput.title);
      const tags = generateTags(userInput.prompt);

      dispatch(
        generatePostAction.setPost({
          title: userInput.title,
          content: data.content,
          slug: slug,
          tag: tags,
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
