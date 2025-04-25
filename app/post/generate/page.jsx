"use client";
import LoadingSkeleton from "@/components/Loading";
import { generatePostAction } from "@/redux/slice/generatePost";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useDispatch } from "react-redux";

const Page = () => {
  const [userInput, setUserInput] = useState({
    title: "",
    prompt: "",
  });
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useRouter();
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const promptString = `write blog post about  ${userInput.prompt}.Craft a   Hook readers with a short intro (4-5 sentences) mentioning the topic's importance and what you'll cover (story, fact, question?). Divide your post into clear sections with subheadings, using 4-6 evidence-backed points (stats, quotes) and visuals to engage readers. Wrap it up (4-5 sentences) by summarizing key takeaways and leaving a lasting impression with a call to action or a thought-provoking question. Bonus: sprinkle in relevant keywords naturally, link to related content, and write a compelling meta description (around 200 characters). Now write - keep it clear, informative, and in your own voice!`;
      // const promptString = `write blog post about dog with minimum of 500 charectors content, return a jsx div with tailwind csss styled format with content formatting `;
      const response = await fetch("/api/post/generate", {
        method: "POST",
        body: JSON.stringify({ prompt: promptString }),
      });
      const data = await response.json();
      dispatch(
        generatePostAction.setPost({ title: userInput.title, content: data })
      );
      navigate.push("/post/create");
      setUserInput({
        title: "",
        prompt: "",
      });
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="padding relative min-h-screen px-6 sm:px-16 md:px-20 lg:px-28 py-3 sm:py-4 bg-white dark:bg-dark-100">
      {loading && (
        <div className="absolute w-full flex-col h-full bg-[rgba(0,0,0,0.4)] top-0 left-0 center">
          <LoadingSkeleton />
        </div>
      )}
      <h2 className="title_heading">Generate Blog Post</h2>
      <p className="para">
        Discover personalized content tailored to your interests with our
        AI-driven blog. Input your preferences below and explore articles on the
        latest AI trends, insights, and innovations. Stay informed, stay
        engaged, and dive into the world of artificial intelligence with us!
      </p>

      <form className="flex flex-col" onSubmit={handleSubmit}>
        <label className="form_label" htmlFor="titile">
          Title
        </label>
        <input
          placeholder="Write the Title"
          className="form_input"
          type="text"
          value={userInput.title}
          onChange={(e) =>
            setUserInput({ ...userInput, title: e.target.value })
          }
          required
        />
        <label className="form_label" htmlFor="content">
          Prompt
        </label>
        <textarea
          className="form_input"
          name="prompt"
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
            {" "}
            <button className="outline_btn">cancel</button>
          </Link>
          <input
            type="submit"
            className="black_btn"
            value="Generate"
            required
          />
        </div>
      </form>
    </section>
  );
};

export default Page;
