import FaqSection from "@/components/contact/FaqSection";
import ContactForm from "@/components/ContactForm";
import CtaSection from "@/components/CtaSection";
import LargeFooter from "@/components/LargeFooter";
import {
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaPaperPlane,
  FaClock,
} from "react-icons/fa";
import { FaLinkedin, FaTwitter, FaGithub, FaFacebook } from "react-icons/fa";

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
            Have questions, feedback, or partnership inquiries? We'd love to
            hear from you!
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
                {/* Contact Info Cards */}
                <div className="bg-white dark:bg-dark-100 rounded-xl p-6 shadow-md border-2 border-gray-200 dark:border-gray-700">
                  <div className="flex items-start">
                    <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full mr-4">
                      <FaEnvelope className="text-blue-600 dark:text-blue-300 text-xl" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Email Us
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-1">
                        General inquiries:
                      </p>
                      <a
                        href="mailto:info@thebloggpt.com"
                        target="_blank"
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        info@thebloggpt.com
                      </a>
                      <p className="text-gray-600 dark:text-gray-400 mt-3 mb-1">
                        Support:
                      </p>
                      <a
                        href="mailto:support@thebloggpt.com"
                        target="_blank"
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        support@thebloggpt.com
                      </a>
                    </div>
                  </div>
                </div>

                {/* <div className="bg-white dark:bg-dark-100 rounded-xl p-6 shadow-md border-2 border-gray-200 dark:border-gray-700">
                  <div className="flex items-start">
                    <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full mr-4">
                      <FaPhone className="text-blue-600 dark:text-blue-300 text-xl" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Call Us
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-1">
                        Customer support:
                      </p>
                      <a
                        href="tel:+11234567890"
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        +1 (123) 456-7890
                      </a>
                      <p className="text-gray-600 dark:text-gray-400 mt-3 mb-1">
                        Sales inquiries:
                      </p>
                      <a
                        href="tel:+11234567891"
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        +1 (123) 456-7891
                      </a>
                    </div>
                  </div>
                </div> */}

                <div className="bg-white dark:bg-dark-100 rounded-xl p-6 shadow-md border-2 border-gray-200 dark:border-gray-700">
                  <div className="flex items-start">
                    <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full mr-4">
                      <FaMapMarkerAlt className="text-blue-600 dark:text-blue-300 text-xl" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Visit Us
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        123 Innovation Drive
                        <br />
                        Tech Park, Suite 456
                        <br />
                        San Francisco, CA 94107
                      </p>
                    </div>
                  </div>
                </div>

                {/* <div className="bg-white dark:bg-dark-100 rounded-xl p-6 shadow-md border-2 border-gray-200 dark:border-gray-700">
                  <div className="flex items-start">
                    <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full mr-4">
                      <FaClock className="text-blue-600 dark:text-blue-300 text-xl" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Business Hours
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Monday - Friday: 9:00 AM - 6:00 PM
                        <br />
                        Saturday: 10:00 AM - 4:00 PM
                        <br />
                        Sunday: Closed
                      </p>
                    </div>
                  </div>
                </div> */}
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
                    className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full text-blue-600 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 transition"
                  >
                    <FaTwitter size={20} />
                  </a>
                  <a
                    href="https://linkedin.com/company/thebloggpt"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full text-blue-600 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 transition"
                  >
                    <FaLinkedin size={20} />
                  </a>
                  <a
                    href="https://facebook.com/thebloggpt"
                    target="_blank"
                    rel="noopener noreferrer"
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

      {/* Map Section */}
      <section className="py-16 px-6 sm:px-16 md:px-20 lg:px-28 bg-gray-50 dark:bg-dark-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              Our Location
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Visit our headquarters in the heart of San Francisco's innovation
              district
            </p>
          </div>

          <div className="bg-white dark:bg-dark-100 rounded-2xl shadow-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700">
            <div className="h-96 w-full bg-gray-200 dark:bg-gray-800 relative">
              {/* Map placeholder */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">📍</div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    San Francisco, CA
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    123 Innovation Drive
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center">
                  <FaMapMarkerAlt className="text-blue-600 dark:text-blue-400 text-2xl mr-4" />
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">
                      Address
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      123 Innovation Drive, San Francisco, CA 94107
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <FaPhone className="text-blue-600 dark:text-blue-400 text-2xl mr-4" />
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">
                      Phone
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      +1 (123) 456-7890
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <FaEnvelope className="text-blue-600 dark:text-blue-400 text-2xl mr-4" />
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">
                      Email
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      info@thebloggpt.com
                    </p>
                  </div>
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
