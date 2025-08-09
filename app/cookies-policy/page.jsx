export const metadata = {
  title: "Cookies Policy – The Blog GPT",
  description:
    "Learn how The Blog GPT uses cookies to enhance your experience, improve website performance, and personalize content.",
};

export default function CookiesPolicyPage() {
  return (
    <section className="max-w-5xl mx-auto px-6 py-12 text-gray-800 dark:text-gray-200">
      <h1 className="text-3xl font-bold mb-6 sub_heading">Cookies Policy</h1>

      <p className="para">
        This Cookies Policy explains how <strong>The Blog GPT</strong> uses
        cookies and similar technologies to recognize you when you visit our
        website. It explains what these technologies are, why we use them, and
        your rights to control our use of them.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">1. What Are Cookies?</h2>
      <p className="para">
        Cookies are small data files placed on your device when you visit a
        website. Cookies are widely used by website owners to make their
        websites work more efficiently and to provide reporting information.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">2. Why We Use Cookies</h2>
      <p className="para">We use cookies for several reasons, including:</p>
      <ul className="list-disc pl-6 mb-4 text-[#667085] dark:text-[#C0C5D0]">
        <li>To remember your theme preferences (light/dark mode)</li>
        <li>To understand how you interact with our blog content</li>
        <li>To enable AI content generation functionality securely</li>
        <li>To analyze traffic and user behavior for improvements</li>
        <li>To personalize user experience and suggestions</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        3. Types of Cookies We Use
      </h2>
      <p className="para">Our site may use the following types of cookies:</p>
      <ul className="list-disc pl-6 mb-4 text-[#667085] dark:text-[#C0C5D0]">
        <li>
          <strong>Essential Cookies:</strong> Required for core functionality,
          such as logging in and accessing secure areas.
        </li>
        <li>
          <strong>Performance Cookies:</strong> Help us understand how users
          interact with the site.
        </li>
        <li>
          <strong>Functionality Cookies:</strong> Remember your preferences and
          settings.
        </li>
        <li>
          <strong>Analytics Cookies:</strong> Used by services like Google
          Analytics to track site performance.
        </li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">4. Managing Cookies</h2>
      <p className="para">
        You can control or disable cookies through your browser settings. Please
        note that disabling cookies may affect certain features or functionality
        of our website.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        5. Third-Party Cookies
      </h2>
      <p className="para">
        In some cases, we use cookies provided by trusted third parties (e.g.,
        Google Analytics, authentication services). These cookies may collect
        anonymized usage statistics and technical information.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        6. Changes to This Policy
      </h2>
      <p className="para">
        We may update this Cookies Policy from time to time. Any changes will be
        posted on this page with a revised “last updated” date.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">7. Contact Us</h2>
      <p className="para">
        If you have any questions about our use of cookies, please contact us at{" "}
        <a
          href="mailto:support@thebloggpt.com"
          target="_blank"
          className="underline text-blue-600 dark:text-blue-400"
        >
          support@thebloggpt.com
        </a>
        .
      </p>

      <p className="mt-10 text-sm text-gray-500">
        Last updated: {new Date().toLocaleDateString()}
      </p>
    </section>
  );
}
