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
              We're revolutionizing content creation with AI-powered tools that
              help writers, marketers, and creators produce high-quality content
              faster than ever before.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/post/create"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-300"
              >
                Start Writing Now
              </Link>
              {/* <button className="border-2 border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 font-semibold py-3 px-8 rounded-lg hover:bg-blue-50 dark:hover:bg-dark-100 transition duration-300">
                Meet Our Team
              </button> */}
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
                  To empower creators with AI tools that enhance creativity,
                  save time, and produce exceptional content that resonates with
                  audiences.
                </p>

                <div className="flex items-center">
                  <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full mr-4">
                    <FaChartLine className="text-blue-600 dark:text-blue-300 text-2xl" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Our Vision
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mt-4">
                  To become the leading AI-powered content platform where every
                  creator can bring their ideas to life with ease.
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
                  <h3 className="text-xl font-bold">Founded in 2023</h3>
                  <p className="text-blue-100">
                    By a team of passionate writers and AI engineers
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
                      The Beginning
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Frustrated by the time-consuming process of content
                      creation, our founders set out to build a solution that
                      leverages AI to streamline writing while maintaining
                      quality and creativity.
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
                      Rapid Growth
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Since our launch, we've helped thousands of creators
                      publish over 50,000 blog posts. Our user base has grown to
                      include bloggers, marketers, and businesses in over 30
                      countries.
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
                      Today & Beyond
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      We continue to innovate with new AI capabilities,
                      expanding our platform to support more content types while
                      maintaining our commitment to quality and user experience.
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
              Our Core Values
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <FaHeart className="text-red-500 text-2xl" />,
                title: "User-Centric",
                description:
                  "We prioritize our users needs above all, constantly improving based on feedback to deliver exceptional value.",
              },
              {
                icon: <FaGem className="text-blue-500 text-2xl" />,
                title: "Quality Focus",
                description:
                  "We believe in creating tools that produce high-quality, authentic content that stands out.",
              },
              {
                icon: <FaCode className="text-green-500 text-2xl" />,
                title: "Innovation",
                description:
                  "We embrace cutting-edge AI technology to solve real content creation challenges.",
              },
              {
                icon: <FaUsers className="text-purple-500 text-2xl" />,
                title: "Collaboration",
                description:
                  "We foster a collaborative environment where ideas are shared and valued.",
              },
              {
                icon: <FaShieldAlt className="text-amber-500 text-2xl" />,
                title: "Integrity",
                description:
                  "We maintain transparency in our operations and respect user privacy and data security.",
              },
              {
                icon: <FaRocket className="text-indigo-500 text-2xl" />,
                title: "Growth Mindset",
                description:
                  "We continuously learn and adapt to help our users and our platform grow.",
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
              Our Technology
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Powered by cutting-edge AI and designed for creators
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-10 items-center">
            <div className="md:w-1/2">
              <div className="bg-gray-200 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl w-full h-80 flex items-center justify-center">
                <div className="text-center p-6">
                  <div className="text-6xl mb-4">🤖</div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Gemini AI
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Advanced language model at our core
                  </p>
                </div>
              </div>
            </div>

            <div className="md:w-1/2">
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    Advanced AI Engine
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Our platform leverages Google's Gemini AI technology,
                    fine-tuned specifically for content creation. This allows us
                    to generate high-quality, coherent, and contextually
                    appropriate content across various domains.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    SEO Optimization
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Built-in SEO analysis ensures your content ranks well on
                    search engines. Our algorithms analyze top-performing
                    content to provide optimization suggestions.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    Continuous Learning
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Our AI models continuously learn from user interactions and
                    feedback, constantly improving content quality and
                    relevance.
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
