import type { Metadata } from "next";
import {
  FaUsers,
  FaLightbulb,
  FaRocket,
  FaChartLine,
  FaHeart,
} from "react-icons/fa";
import { FaGem, FaCode, FaShieldAlt } from "react-icons/fa";
import Link from "next/link";
import LargeFooter from "@/components/LargeFooter";
import CtaSection from "@/components/CtaSection";

export const metadata: Metadata = {
  title: "About | The Blog GPT",
  description:
    "The Blog GPT is an AI-assisted blogging platform. Describe a topic, get a structured first draft from AI, then edit it in your own voice and publish.",
  alternates: { canonical: "https://thebloggpt.com/about" },
};

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-dark-100">
      {/* Hero Section */}
      <section className="py-16 px-6 sm:px-16 md:px-20 lg:px-28 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 min-h-screen flex flex-col justify-center">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-center">
          <div className="md:w-1/2 mb-10 md:mb-0">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              About{" "}
              <span className="text-blue-600 dark:text-blue-400">
                The Blog GPT
              </span>
            </h1>
            <p className="text-xl text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
              The Blog GPT is an AI-assisted blogging platform. Describe a topic,
              get a structured first draft from AI, then edit it in your own
              voice and publish. The AI handles the blank page; you stay in
              control of the writing.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/post/create"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-300"
              >
                Start Writing Now
              </Link>
            </div>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <div className="relative w-full max-w-md">
              <div className="absolute -top-6 -right-6 w-full h-full bg-blue-200 dark:bg-blue-700 rounded-2xl rotate-6"></div>
              <div className="relative bg-white dark:bg-dark-100 rounded-2xl shadow-xl p-8">
                <div className="flex items-center mb-6">
                  <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full mr-4">
                    <FaGem className="text-blue-600 dark:text-blue-300 text-2xl" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Our Mission
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Make blogging faster without making it generic. We help you
                  skip the blank page and spend your time refining ideas instead
                  of formatting them.
                </p>

                <div className="flex items-center">
                  <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full mr-4">
                    <FaChartLine className="text-blue-600 dark:text-blue-300 text-2xl" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    What We&apos;re Building
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mt-4">
                  A simple, honest place where anyone can turn an idea into a
                  clean, well-structured post, and share it with readers who
                  care.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 px-6 sm:px-16 md:px-20 lg:px-28">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              Our Story
            </h2>
            <div className="w-24 h-1 bg-blue-600 mx-auto mt-4 rounded-full"></div>
          </div>

          <div className="flex flex-col md:flex-row gap-10">
            <div className="md:w-1/2">
              <div className="relative h-80 bg-gray-200 dark:bg-gray-800 rounded-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 opacity-70"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-xl font-bold">Made for writers</h3>
                  <p className="text-blue-100">
                    An independent, open-source project
                  </p>
                </div>
              </div>
            </div>

            <div className="md:w-1/2">
              <div className="space-y-6">
                <div className="flex">
                  <div className="mr-4 mt-1">
                    <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                      <FaLightbulb className="text-blue-600 dark:text-blue-300 text-xl" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      Why it exists
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      The hardest part of blogging is staring at an empty page.
                      The Blog GPT turns a topic and a short brief into a
                      structured first draft, with an introduction, headings,
                      and sections, so you can start editing instead of starting
                      from scratch.
                    </p>
                  </div>
                </div>

                <div className="flex">
                  <div className="mr-4 mt-1">
                    <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                      <FaRocket className="text-blue-600 dark:text-blue-300 text-xl" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      Drafts, not autopilot
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      The AI writes the first version; you make it good. Adjust
                      the tone, add your own images and examples, and publish
                      only when it sounds like you. Your draft is never locked.
                      Everything is editable in a rich editor.
                    </p>
                  </div>
                </div>

                <div className="flex">
                  <div className="mr-4 mt-1">
                    <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                      <FaChartLine className="text-blue-600 dark:text-blue-300 text-xl" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      Where we are
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      We&apos;re focused on the basics done well: fast drafts, a
                      clean editor, and a simple place to publish and be read.
                      The platform is still young and growing, and we improve it
                      based on real feedback.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-16 bg-gray-50 dark:bg-dark-100 px-6 sm:px-16 md:px-20 lg:px-28">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              What We Care About
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              The principles behind how we build
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <FaHeart className="text-red-500 text-2xl" />,
                title: "Built for writers",
                description:
                  "We build for the people who actually write, and improve based on the feedback they send us.",
              },
              {
                icon: <FaGem className="text-blue-500 text-2xl" />,
                title: "Useful drafts",
                description:
                  "A draft is a starting point. We focus on giving you a clean, structured base that's genuinely worth editing.",
              },
              {
                icon: <FaCode className="text-green-500 text-2xl" />,
                title: "Practical AI",
                description:
                  "We use AI to solve one real, boring problem, the blank page, not to replace your judgment.",
              },
              {
                icon: <FaUsers className="text-purple-500 text-2xl" />,
                title: "A reading community",
                description:
                  "Published posts live in a shared feed where readers can follow writers, like posts, and leave comments.",
              },
              {
                icon: <FaShieldAlt className="text-amber-500 text-2xl" />,
                title: "Honesty",
                description:
                  "No fake numbers and no hidden limits. The AI writes drafts; you make them good. We say so plainly.",
              },
              {
                icon: <FaRocket className="text-indigo-500 text-2xl" />,
                title: "Still improving",
                description:
                  "We're early, and we'd rather ship something honest and keep getting better than overpromise.",
              },
            ].map((value, index) => (
              <div
                key={index}
                className="bg-white dark:bg-dark-100 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border-2 border-gray-200 dark:border-gray-700"
              >
                <div className="text-4xl mb-4">{value.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {value.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology */}
      <section className="py-16 px-6 sm:px-16 md:px-20 lg:px-28">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              How It Works Under the Hood
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Modern AI, a clean editor, and a focus on what helps you publish
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-10 items-center">
            <div className="md:w-1/2">
              <div className="bg-gray-200 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl w-full h-80 flex items-center justify-center">
                <div className="text-center p-6">
                  <div className="text-6xl mb-4">🤖</div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Powered by AI
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    The AI that drafts your posts
                  </p>
                </div>
              </div>
            </div>

            <div className="md:w-1/2">
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    Built on AI
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    The Blog GPT uses a capable AI model, guided by prompts
                    designed for blog writing. It drafts an introduction,
                    headings, and sections, a real structure you can refine,
                    not a wall of text.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    Easy to find in search
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Posts are built with search in mind: clear H2/H3 headings,
                    readable formatting, meta-friendly excerpts, clean URLs, and
                    an auto-generated sitemap. Good structure helps, though
                    ranking always depends on your content and your niche.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    Yours to edit
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    You&apos;re never locked into the AI&apos;s draft. Everything
                    is editable in a rich text editor, and we keep refining the
                    prompts and tools based on how people actually use them.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <CtaSection />
      <LargeFooter />
    </div>
  );
};

export default AboutPage;
