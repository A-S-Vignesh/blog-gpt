export default function CookiesPolicyPage() {
  return (
    <section className="max-w-5xl mx-auto px-6 py-12 text-gray-800 dark:text-gray-200">
      <h1 className="text-3xl font-bold mb-6 sub_heading">Cookies Policy</h1>

      <p className="para mb-4">
        This Cookies Policy explains how <strong>The Blog GPT</strong> uses
        cookies and similar tracking technologies when you visit our website. By
        continuing to use our platform, you consent to the use of cookies as
        described in this policy.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">1. What Are Cookies?</h2>
      <p className="para mb-4">
        Cookies are small text files stored on your device when you visit a
        website. They help websites function properly, remember user
        preferences, and collect analytical information.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">2. How We Use Cookies</h2>
      <p className="para mb-4">We use cookies and similar technologies to:</p>

      <ul className="list-disc pl-6 mb-4 text-[#667085] dark:text-[#C0C5D0] space-y-2">
        <li>Maintain secure login sessions (Google OAuth authentication)</li>
        <li>Remember your preferences (such as theme settings)</li>
        <li>Analyze website traffic and user behavior</li>
        <li>Improve AI content generation performance and security</li>
        <li>Enhance overall user experience</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        3. Types of Cookies We Use
      </h2>

      <ul className="list-disc pl-6 mb-4 text-[#667085] dark:text-[#C0C5D0] space-y-2">
        <li>
          <strong>Essential Cookies:</strong> Required for login,
          authentication, and core functionality.
        </li>
        <li>
          <strong>Analytics Cookies:</strong> Used to collect anonymized
          statistics about how visitors use the platform (e.g., Google
          Analytics).
        </li>
        <li>
          <strong>Functional Cookies:</strong> Store user preferences such as
          theme selection.
        </li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        4. Third-Party Cookies
      </h2>
      <p className="para mb-4">
        Some cookies may be set by trusted third-party services, including:
      </p>

      <ul className="list-disc pl-6 mb-4 text-[#667085] dark:text-[#C0C5D0] space-y-2">
        <li>Google Authentication (OAuth)</li>
        <li>Google Analytics</li>
        <li>Hosting and infrastructure providers</li>
      </ul>

      <p className="para mb-4">
        These third parties may process limited technical information necessary
        to provide their services.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">5. Managing Cookies</h2>
      <p className="para mb-4">
        You can control or disable cookies through your browser settings. Please
        note that disabling essential cookies may affect certain features of the
        platform, including login functionality.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        6. Changes to This Policy
      </h2>
      <p className="para mb-4">
        We may update this Cookies Policy periodically. Any updates will be
        posted on this page with a revised “Last updated” date.
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
