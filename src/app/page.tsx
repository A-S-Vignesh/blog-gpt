import LargeFooter from "@/components/LargeFooter";
import PwaSection from "@/components/PwaSection";
import { authOptions } from "@/lib/authOptions";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SITE_NAME, SITE_URL, SITE_ALTERNATE_NAMES } from "@/lib/seo";
import {
  FaGoogle,
  FaRobot,
  FaEdit,
  FaShareAlt,
  FaSave,
  FaSearch,
  FaCloudUploadAlt,
  FaChevronRight,
} from "react-icons/fa";

/**
 * `/` is the public marketing landing page for anonymous visitors — and for
 * search crawlers, which are always logged-out, so SEO is unaffected.
 * Authenticated users are redirected to their personalized `/feed` (the
 * standard pattern used by X, Reddit, LinkedIn, etc.). Because the redirect is
 * conditional on the session, the crawlable marketing page and its metadata
 * are still served to everyone who isn't signed in.
 */
const SIGNUP_HREF = "/auth/signin?callbackUrl=%2Ffeed";

export const metadata: Metadata = {
  title: "The Blog GPT | AI-Powered Blog Platform",
  description:
    "Turn any topic into a structured blog draft with AI: intro, headings, and sections. Edit it in your own voice, add images, and publish in minutes.",
  keywords: [
    "AI blog generator",
    "AI blogging platform",
    "The Blog GPT",
    "write blog posts with AI",
    "AI writing assistant",
    "AI content generation",
    "modern blog platform",
  ],
  authors: [
    {
      name: "Vignesh A S",
      url: "https://a-s-vignesh-portfolio.vercel.app",
    },
  ],
  openGraph: {
    title: "The Blog GPT",
    description:
      "Explore AI-generated blogs. Read posts, follow writers, and draft your own with AI.",
    url: "https://thebloggpt.com",
    siteName: "The Blog GPT",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "https://thebloggpt.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "The Blog GPT",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Blog GPT",
    description:
      "Smart AI-powered blog content with a modern and responsive design.",
    images: [
      {
        url: "https://thebloggpt.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "The Blog GPT",
      },
    ],
  },
  metadataBase: new URL("https://thebloggpt.com"),
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://thebloggpt.com",
  },
};

export default async function Home() {
  const session = await getServerSession(authOptions);
  const isLoggedIn = Boolean(session?.user);

  // Signed-in users belong in their personalized workspace, not on the
  // marketing page. Anonymous visitors (and crawlers) fall through to it.
  if (isLoggedIn) {
    redirect("/feed");
  }

  return (
    <>
      {/*
        Google picks the site name it prints under the URL in search results
        from the WebSite schema on the HOME PAGE specifically (plus
        og:site_name). Without it, it infers one, which is how "BlogGPT" and
        "Blog-GPT" ended up competing with the real brand. `alternateName`
        tells it the run-together spellings refer to the same site without us
        displaying them anywhere.
      */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: SITE_NAME,
              alternateName: SITE_ALTERNATE_NAMES,
              url: `${SITE_URL}/`,
            },
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              name: SITE_NAME,
              alternateName: SITE_ALTERNATE_NAMES,
              url: `${SITE_URL}/`,
              logo: `${SITE_URL}/web-app-manifest-512x512.png`,
            },
          ]),
        }}
      />

      {/* Hero Section */}
      <section className="min-h-screen px-6 sm:px-16 md:px-20 lg:px-28 py-12 bg-white dark:bg-dark-100 flex flex-col md:flex-row items-center justify-between">
        <div className="w-full md:w-1/2 mb-10 md:mb-0">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight text-gray-900 dark:text-white">
            Write SEO Blog Posts Faster with AI
          </h1>
          <p className="text-xl mt-6 text-gray-700 dark:text-gray-300">
            Describe a topic and our AI writes a structured first draft, with an
            intro, headings, and sections. Edit it in your own voice, add images,
            and publish.
          </p>
          <div className="flex flex-wrap gap-4 mt-8">
            <Link
              href="/post"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-300 flex items-center"
            >
              See Blogs <FaChevronRight className="ml-2" />
            </Link>
            {isLoggedIn ? (
              <Link
                href="/feed"
                className="border-2 border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 font-semibold py-3 px-8 rounded-lg hover:bg-blue-50 dark:hover:bg-dark-100 transition duration-300"
              >
                Open your feed
              </Link>
            ) : (
              <Link
                href={SIGNUP_HREF}
                className="border-2 border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 font-semibold py-3 px-8 rounded-lg hover:bg-blue-50 dark:hover:bg-dark-100 transition duration-300"
              >
                Free Signup
              </Link>
            )}
          </div>
        </div>
        <div className="w-full md:w-1/2 flex justify-center">
          <div className="relative w-full max-w-lg h-80 md:h-96">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl shadow-2xl transform rotate-3"></div>
            <div className="relative w-full h-full bg-white dark:bg-dark-100 rounded-xl shadow-xl p-4 flex flex-col border-2 border-gray-200 dark:border-gray-700 transition-shadow">
              <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              <div className="mt-4 flex-1 bg-gray-50 dark:bg-dark-100 rounded-lg p-4 border-2 border-gray-200 dark:border-gray-700 shadow-md transition-shadow">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-3"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mb-3"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              </div>
              <div className="mt-4 flex justify-between">
                <div className="h-6 w-20 bg-blue-500 rounded"></div>
                <div className="h-6 w-6 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-gray-50 dark:bg-dark-100 px-6 sm:px-16 md:px-20 lg:px-28">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            How The Blog GPT Works
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Create professional blog content in three simple steps
          </p>
        </div>

        <div className="flex flex-col md:flex-row justify-between gap-10 max-w-5xl mx-auto">
          {[
            {
              icon: <FaGoogle className="text-blue-500" />,
              title: "Login using Google",
              desc: "Securely sign in with your Google account in seconds",
            },
            {
              icon: <FaRobot className="text-purple-500" />,
              title: "Generate a draft with AI",
              desc: "Let AI turn your topic into a structured first draft",
            },
            {
              icon: <FaEdit className="text-green-500" />,
              title: "Customize & Publish",
              desc: "Edit, add images, and publish directly to your blog",
            },
          ].map((step, index) => (
            <div
              key={index}
              className="flex-1 bg-white dark:bg-dark-100 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="text-4xl mb-4 flex justify-center">
                {step.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 text-center">
                {step.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-center">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-6 sm:px-16 md:px-20 lg:px-28">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            What You Can Do
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Everything you need to draft, edit, and publish a blog post
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            {
              icon: <FaRobot className="text-indigo-500" />,
              title: "AI-Powered Blog Generator",
              desc: "Generate a full blog draft from just a topic",
            },
            {
              icon: <FaSearch className="text-blue-500" />,
              title: "Clean, structured posts",
              desc: "Drafts come with clear headings and readable formatting, easy to read and easy for search engines to crawl",
            },
            {
              icon: <FaCloudUploadAlt className="text-teal-500" />,
              title: "Add Your Own Images",
              desc: "Upload and manage images to make each post your own",
            },
            {
              icon: <FaEdit className="text-green-500" />,
              title: "Easy Post Editing",
              desc: "A rich text editor for refining your draft",
            },
            {
              icon: <FaShareAlt className="text-orange-500" />,
              title: "Shareable Post Links",
              desc: "Instantly share your posts with anyone",
            },
            {
              icon: <FaSave className="text-amber-500" />,
              title: "Save and Manage Posts",
              desc: "Keep all your posts together and edit them anytime",
            },
          ].map((feature, index) => (
            <div
              key={index}
              className="bg-white dark:bg-dark-100 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="text-3xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Who is The Blog GPT for? */}
      <section className="py-16 bg-gray-50 dark:bg-dark-100 px-6 sm:px-16 md:px-20 lg:px-28">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            Who is The Blog GPT for?
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Whether you blog solo or run a content team, The Blog GPT helps you
            create quality posts faster.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {[
            {
              title: "Solo bloggers",
              desc: "Publish consistently without burning out. Generate drafts in seconds, then edit and publish under your own voice.",
              icon: "✍️",
            },
            {
              title: "Marketing teams",
              desc: "Scale content production for campaigns, newsletters, and SEO. One tool for ideation, drafting, and publishing.",
              icon: "📈",
            },
            {
              title: "Agencies & freelancers",
              desc: "Deliver more client content without hiring. Use AI for first drafts, then refine and ship on time.",
              icon: "🎯",
            },
            {
              title: "Developers & founders",
              desc: "Keep your blog updated without context switching. Turn ideas into SEO-friendly posts in minutes.",
              icon: "⚡",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="bg-white dark:bg-dark-100 rounded-xl p-6 shadow-md border-2 border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-800 transition-all"
            >
              <span className="text-3xl mb-4 block">{item.icon}</span>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                {item.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href={isLoggedIn ? "/post/generate" : SIGNUP_HREF}
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-300"
          >
            {isLoggedIn ? "Generate your next post" : "Start creating free"}
          </Link>
        </div>
      </section>

      {/* Why The Blog GPT Section */}
      <section className="py-16 px-6 sm:px-16 md:px-20 lg:px-28">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            Why Choose The Blog GPT
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            A faster way to go from idea to a published blog post
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            {
              title: "Draft in seconds",
              desc: "Turn a topic and short brief into a structured first draft, so you spend your time refining instead of starting from a blank page.",
            },
            {
              title: "Easy to find",
              desc: "Posts use clear headings, clean URLs, and an auto-generated sitemap, so readers and search engines can find them.",
            },
            {
              title: "You stay in control",
              desc: "Every draft is fully editable. Adjust the tone, add your own images, and publish only when it sounds like you.",
            },
          ].map((item, index) => (
            <div
              key={index}
              className="bg-white dark:bg-dark-100 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-shadow"
            >
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                {item.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Screenshots Section */}
      <section className="py-16 bg-gray-50 dark:bg-dark-100 px-6 sm:px-16 md:px-20 lg:px-28">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            A Look at the Interface
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            The editor, your dashboard, and a published post, at a glance
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8 justify-center items-center max-w-6xl mx-auto">
          <div className="w-full md:w-1/3 shadow-2xl rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 h-64 md:h-80 flex items-center justify-center">
              <div className="bg-white dark:bg-dark-100 w-4/5 h-4/5 rounded-md shadow-inner p-4">
                <div className="flex space-x-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-blue-200 dark:bg-blue-700 rounded w-full"></div>
                  <div className="h-3 bg-blue-200 dark:bg-blue-700 rounded w-3/4"></div>
                  <div className="h-3 bg-blue-200 dark:bg-blue-700 rounded w-5/6"></div>
                </div>
              </div>
            </div>
            <div className="p-4 bg-white dark:bg-dark-100">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                AI Editor Interface
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Create content with AI assistance
              </p>
            </div>
          </div>

          <div className="w-full md:w-1/3 shadow-2xl rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 transform md:translate-y-6">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 h-64 md:h-80 flex items-center justify-center">
              <div className="bg-white dark:bg-dark-100 w-4/5 h-4/5 rounded-md shadow-inner p-4 overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-900 dark:text-white">
                    My Blogs
                  </h3>
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                </div>
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                    >
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded mr-3"></div>
                      <div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-4 bg-white dark:bg-dark-100">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Blog Management
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Organize all your posts
              </p>
            </div>
          </div>

          <div className="w-full md:w-1/3 shadow-2xl rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 h-64 md:h-80 flex items-center justify-center">
              <div className="bg-white dark:bg-dark-100 w-4/5 h-4/5 rounded-md shadow-inner p-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-3"></div>
                <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded mb-3"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-1"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
              </div>
            </div>
            <div className="p-4 bg-white dark:bg-dark-100">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Published Post
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                How a finished post looks
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link
            href={isLoggedIn ? "/feed" : SIGNUP_HREF}
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-300"
          >
            {isLoggedIn ? "Open your feed" : "Sign up, it's free"}
          </Link>
        </div>
      </section>

      {/* Subscribe Section */}
      {/* <section className="py-16 px-6 sm:px-16 md:px-20 lg:px-28">
        <div className="max-w-3xl mx-auto bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-10 text-center text-white">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Get AI Blogging Tips & Updates
          </h2>
          <p className="mb-8 opacity-90 max-w-lg mx-auto">
            Join our newsletter to receive weekly insights on AI content
            creation and platform updates
          </p>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto"
          >
            <div className="relative flex-grow">
              <FaEnvelope className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                className="w-full pl-12 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
                required
              />
            </div>
            <button
              type="submit"
              className="bg-white text-blue-600 font-semibold px-6 py-3 rounded-lg hover:bg-gray-100 transition duration-300"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section> */}

      {/* PWA Section */}
      <PwaSection />
      <LargeFooter />
      

      {/* <LargeFooter /> */}
    </>
  );
}
