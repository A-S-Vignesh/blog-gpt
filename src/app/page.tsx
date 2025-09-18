import LargeFooter from "@/components/LargeFooter";
import PwaSection from "@/components/PwaSection";
import { Metadata } from "next";
import Link from "next/link";
import {
  FaGoogle,
  FaRobot,
  FaEdit,
  FaShareAlt,
  FaSave,
  FaSearch,
  FaCloudUploadAlt,
  FaStar,
  FaGithub,
  FaLinkedin,
  FaEnvelope,
  FaMobileAlt,
  FaCheck,
  FaChevronRight,
} from "react-icons/fa";

export const metadata: Metadata = {
  title: "The Blog GPT | AI-Powered Blog Platform",
  description:
    "Discover engaging AI-generated blogs powered by Gemini AI. Read insightful posts, explore trending topics, and generate smart content effortlessly on The Blog GPT.",
  keywords: [
    "AI blog",
    "Blog-GPT",
    "Gemini AI blog",
    "Vignesh A S",
    "Next.js blogging",
    "AI content generation",
    "Modern blog platform",
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
      "Explore AI-generated blogs using Gemini AI. Discover, read, and generate smart content.",
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
}

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="min-h-screen px-6 sm:px-16 md:px-20 lg:px-28 py-12 bg-white dark:bg-dark-100 flex flex-col md:flex-row items-center justify-between">
        <div className="w-full md:w-1/2 mb-10 md:mb-0">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight text-gray-900 dark:text-white">
            Generate High-Quality Blogs Instantly with AI
          </h1>
          <p className="text-xl mt-6 text-gray-700 dark:text-gray-300">
            Create, edit, and publish SEO-optimized blogs using Gemini AI—all in
            one place.
          </p>
          <div className="flex flex-wrap gap-4 mt-8">
            <Link
              href="/post"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-300 flex items-center"
            >
              See Blogs <FaChevronRight className="ml-2" />
            </Link>
            <Link
              href="/auth/signin"
              className="border-2 border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 font-semibold py-3 px-8 rounded-lg hover:bg-blue-50 dark:hover:bg-dark-100 transition duration-300"
            >
              Free Signup
            </Link>
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
            How Blog-GPT Works
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
              title: "Generate content using AI",
              desc: "Let Gemini AI create SEO-optimized blog drafts based on your topic",
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
            Powerful Features
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Everything you need to create amazing blog content
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            {
              icon: <FaRobot className="text-indigo-500" />,
              title: "Gemini AI-Powered Blog Generator",
              desc: "Generate complete blog posts with just a topic suggestion",
            },
            {
              icon: <FaSearch className="text-blue-500" />,
              title: "SEO Optimized Content",
              desc: "AI creates content that ranks well in search engines",
            },
            {
              icon: <FaCloudUploadAlt className="text-teal-500" />,
              title: "Cloudinary Image Upload",
              desc: "Easily add and manage images for your posts",
            },
            {
              icon: <FaEdit className="text-green-500" />,
              title: "Easy Post Editing",
              desc: "Intuitive editor for refining your content",
            },
            {
              icon: <FaShareAlt className="text-orange-500" />,
              title: "Shareable Post Links",
              desc: "Instantly share your posts with anyone",
            },
            {
              icon: <FaSave className="text-amber-500" />,
              title: "Save and Manage Posts",
              desc: "Organize all your blog content in one place",
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

      {/* Monetization Section */}
      <section className="py-16 bg-gray-50 dark:bg-dark-100 px-6 sm:px-16 md:px-20 lg:px-28">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            Plans for Every Creator
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Choose the plan that fits your blogging needs
          </p>
        </div>

        <div className="flex flex-col md:flex-row justify-center gap-8 max-w-5xl mx-auto">
          <div className="bg-white dark:bg-dark-100 rounded-xl p-8 shadow-lg border-2 border-gray-200 dark:border-gray-700">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Free Plan
            </h3>
            <p className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">
              $0
              <span className="text-lg font-normal text-gray-500 dark:text-gray-400">
                /forever
              </span>
            </p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center text-gray-600 dark:text-gray-400">
                <FaCheck className="text-green-500 mr-2" /> 5 blog posts per
                month
              </li>
              <li className="flex items-center text-gray-600 dark:text-gray-400">
                <FaCheck className="text-green-500 mr-2" /> Basic SEO
                optimization
              </li>
              <li className="flex items-center text-gray-600 dark:text-gray-400">
                <FaCheck className="text-green-500 mr-2" /> Standard image
                uploads
              </li>
              <li className="flex items-center text-gray-500 dark:text-gray-500">
                <span className="mr-2">•</span> Limited customization
              </li>
            </ul>
            <button className="w-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white py-3 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition">
              Get Started Free
            </button>
          </div>

          <div className="bg-white dark:bg-dark-100 rounded-xl p-8 shadow-lg border-2 border-blue-500 relative">
            <div className="absolute top-0 right-0 bg-blue-500 text-white px-4 py-1 rounded-bl-lg rounded-tr-lg font-medium">
              Popular
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Pro Plan
            </h3>
            <p className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">
              $9
              <span className="text-lg font-normal text-gray-500 dark:text-gray-400">
                /month
              </span>
            </p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center text-gray-600 dark:text-gray-400">
                <FaCheck className="text-green-500 mr-2" /> Unlimited blog posts
              </li>
              <li className="flex items-center text-gray-600 dark:text-gray-400">
                <FaCheck className="text-green-500 mr-2" /> Advanced SEO
                optimization
              </li>
              <li className="flex items-center text-gray-600 dark:text-gray-400">
                <FaCheck className="text-green-500 mr-2" /> AI image generation
              </li>
              <li className="flex items-center text-gray-600 dark:text-gray-400">
                <FaCheck className="text-green-500 mr-2" /> Priority support
              </li>
              <li className="flex items-center text-gray-600 dark:text-gray-400">
                <FaCheck className="text-green-500 mr-2" /> Detailed analytics
              </li>
            </ul>
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition duration-300">
              Upgrade to Pro
            </button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 px-6 sm:px-16 md:px-20 lg:px-28">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            Trusted by Bloggers Worldwide
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Join creators from 10+ countries who use Blog-GPT daily
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            {
              name: "Sarah Johnson",
              role: "Tech Blogger",
              content:
                "Blog-GPT has cut my writing time in half while improving my SEO rankings. The AI suggestions are incredibly helpful!",
            },
            {
              name: "Michael Chen",
              role: "Marketing Director",
              content:
                "Our content team produces 3x more articles since switching to Blog-GPT. The quality is consistently excellent.",
            },
            {
              name: "Emma Rodriguez",
              role: "Travel Writer",
              content:
                "As a solo creator, Blog-GPT feels like having a professional writing partner. The image integration is seamless!",
            },
          ].map((testimonial, index) => (
            <div
              key={index}
              className="bg-white dark:bg-dark-100 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center mb-4">
                <div className="flex items-center">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <FaStar key={i} className="text-yellow-400 mr-1" />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 italic mb-6">
                "{testimonial.content}"
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-lg font-bold">
                  {testimonial.name.charAt(0)}
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {testimonial.name}
                  </h4>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {[
            "The Future of AI",
            "Sustainable Travel",
            "React Best Practices",
            "Digital Marketing 2024",
          ].map((title, index) => (
            <div
              key={index}
              className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-center hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            >
              <p className="text-gray-900 dark:text-white font-medium">
                {title}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Published with Blog-GPT
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Screenshots Section */}
      <section className="py-16 bg-gray-50 dark:bg-dark-100 px-6 sm:px-16 md:px-20 lg:px-28">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            See Blog-GPT in Action
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Experience our intuitive interface and powerful features
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
                Professional-looking final output
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/auth/signin"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-300"
          >
            Sign Up for a Free
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
