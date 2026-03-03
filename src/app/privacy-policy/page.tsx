const PrivacyPolicyPage = () => {
  return (
    <section className="max-w-5xl mx-auto px-6 py-12 text-gray-800 dark:text-gray-200">
      <h1 className="text-3xl font-bold mb-6 sub_heading">Privacy Policy</h1>

      <p className="mb-4 para">
        Welcome to <strong>The Blog GPT</strong>. We respect your privacy and
        are committed to protecting your personal information. This Privacy
        Policy explains how we collect, use, and safeguard your data when you
        use our platform.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        1. Information We Collect
      </h2>
      <p className="mb-4 para">
        When you sign in using Google Authentication (Google OAuth), we collect
        the following information from your Google account:
      </p>
      <ul className="list-disc ml-6 mb-4 para space-y-2">
        <li>Your full name</li>
        <li>Your email address (Gmail)</li>
        <li>Your profile picture</li>
      </ul>

      <p className="mb-4 para">
        This information is provided directly by Google after your consent
        during login. We do not collect your Google password.
      </p>

      <p className="mb-4 para">
        We may also collect additional information such as:
      </p>
      <ul className="list-disc ml-6 mb-4 para space-y-2">
        <li>Blog content you create or publish</li>
        <li>Usage and analytics data (e.g., pages visited, device type)</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        2. Public Profile Information
      </h2>
      <p className="mb-4 para">
        Your name and profile picture may be publicly visible on the platform
        alongside your blog posts, comments, or profile page. By using The Blog
        GPT, you agree to this public display of basic profile information.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        3. How We Use Your Information
      </h2>
      <p className="mb-4 para">We use your information to:</p>
      <ul className="list-disc ml-6 mb-4 para space-y-2">
        <li>Create and manage your account</li>
        <li>Display your published blog content</li>
        <li>Provide AI-powered content generation features</li>
        <li>Improve platform performance and user experience</li>
        <li>Ensure security and prevent misuse</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        4. Cookies and Analytics
      </h2>
      <p className="mb-4 para">
        We use cookies and analytics tools (such as Google Analytics) to
        understand how users interact with our platform. This helps us improve
        performance and user experience. You may disable cookies in your browser
        settings.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        5. Third-Party Services
      </h2>
      <p className="mb-4 para">
        We rely on trusted third-party services to operate our platform,
        including:
      </p>
      <ul className="list-disc ml-6 mb-4 para space-y-2">
        <li>Google Authentication (OAuth)</li>
        <li>Analytics providers</li>
        <li>AI content generation services</li>
        <li>Hosting and database providers</li>
      </ul>

      <p className="mb-4 para">
        These services may process limited user data only as necessary to
        provide their functionality.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">6. Data Security</h2>
      <p className="mb-4 para">
        We implement reasonable technical and organizational security measures
        to protect your data from unauthorized access, misuse, or disclosure.
        However, no system can guarantee complete security.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">7. Your Rights</h2>
      <p className="mb-4 para">You have the right to:</p>
      <ul className="list-disc ml-6 mb-4 para space-y-2">
        <li>Access your stored data</li>
        <li>Request updates or corrections</li>
        <li>Request deletion of your account and associated data</li>
      </ul>

      <p className="mb-4 para">
        To request data deletion, please contact us using the email below.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">8. Children’s Privacy</h2>
      <p className="mb-4 para">
        The Blog GPT is not intended for individuals under the age of 13. We do
        not knowingly collect personal information from children.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        9. Changes to This Policy
      </h2>
      <p className="mb-4 para">
        We may update this Privacy Policy from time to time. Updates will be
        posted on this page with a revised “Last updated” date.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">10. Contact Us</h2>
      <p className="mb-4 para">
        If you have any questions about this Privacy Policy or wish to request
        account deletion, please contact us at{" "}
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
};

export default PrivacyPolicyPage;
