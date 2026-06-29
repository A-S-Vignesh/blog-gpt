import type { Metadata } from "next";
import FaqSection from "@/components/contact/FaqSection";
import ContactForm from "@/components/ContactForm";
import CtaSection from "@/components/CtaSection";
import LargeFooter from "@/components/LargeFooter";
import {
  FaEnvelope,
  FaClock,
  FaLinkedin,
  FaTwitter,
  FaFacebook,
} from "react-icons/fa";

export const metadata: Metadata = {
  title: "Contact | The Blog GPT",
  description:
    "Get in touch with The Blog GPT. Questions about AI blog generation, feedback, billing, or a bug to report? Email us or send a message and we'll reply.",
  alternates: { canonical: "https://thebloggpt.com/contact" },
};

const ContactPage = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-dark-100">
      {/* Hero Section */}
      <section className="py-16 px-6 sm:px-16 md:px-20 lg:px-28 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Contact{" "}
            <span className="text-blue-600 dark:text-blue-400">
              The Blog GPT
            </span>
          </h1>
          <p className="text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
            Have a question, some feedback, or a bug to report? Send us a
            message. A real person reads every one, and we&apos;ll get back to
            you.
          </p>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-16 px-6 sm:px-16 md:px-20 lg:px-28">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <ContactForm />

            {/* Contact Information */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
                Get in touch
              </h2>

              <div className="space-y-8">
                {/* Email */}
                <div className="bg-white dark:bg-dark-100 rounded-xl p-6 shadow-md border-2 border-gray-200 dark:border-gray-700">
                  <div className="flex items-start">
                    <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full mr-4">
                      <FaEnvelope className="text-blue-600 dark:text-blue-300 text-xl" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Email us
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-1">
                        General questions:
                      </p>
                      <a
                        href="mailto:info@thebloggpt.com"
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        info@thebloggpt.com
                      </a>
                      <p className="text-gray-600 dark:text-gray-400 mt-3 mb-1">
                        Account &amp; billing support:
                      </p>
                      <a
                        href="mailto:support@thebloggpt.com"
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        support@thebloggpt.com
                      </a>
                    </div>
                  </div>
                </div>

                {/* Response time (we're an online product — no physical office) */}
                <div className="bg-white dark:bg-dark-100 rounded-xl p-6 shadow-md border-2 border-gray-200 dark:border-gray-700">
                  <div className="flex items-start">
                    <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full mr-4">
                      <FaClock className="text-blue-600 dark:text-blue-300 text-xl" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Response time
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        The Blog GPT is an online product, so email is the best
                        way to reach us. We usually reply within 1–2 business
                        days.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Media */}
              <div className="mt-10">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Connect with us
                </h3>
                <div className="flex space-x-4">
                  <a
                    href="https://x.com/thebloggpt"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="The Blog GPT on X"
                    className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full text-blue-600 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 transition"
                  >
                    <FaTwitter size={20} />
                  </a>
                  <a
                    href="https://linkedin.com/company/thebloggpt"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="The Blog GPT on LinkedIn"
                    className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full text-blue-600 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 transition"
                  >
                    <FaLinkedin size={20} />
                  </a>
                  <a
                    href="https://facebook.com/thebloggpt"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="The Blog GPT on Facebook"
                    className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full text-blue-600 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 transition"
                  >
                    <FaFacebook size={20} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <FaqSection />

      {/* CTA Section */}
      <CtaSection />

      {/* Footer */}
      <LargeFooter />
    </div>
  );
};

export default ContactPage;
