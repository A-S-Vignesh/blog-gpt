const PrivacyPolicyPage = () => {
  return (
    <section className="max-w-5xl mx-auto px-6 py-12 text-gray-800 dark:text-gray-200">
      <h1 className="text-3xl font-bold mb-6 sub_heading">Privacy Policy</h1>

      <p className="mb-4 para">
        At <strong>The Blog GPT</strong>, we respect your privacy and are
        committed to protecting your personal data. This Privacy Policy outlines
        how we collect, use, and safeguard your information.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        1. Information We Collect
      </h2>
      <p className="mb-4 para">
        We may collect personal information such as your name, email address,
        and any content you create on the platform. Additionally, we may collect
        analytics data through tools like Google Analytics.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        2. How We Use Your Information
      </h2>
      <p className="mb-4 para">
        We use your data to operate and improve our platform, personalize your
        experience, communicate updates, and ensure compliance with our Terms of
        Use.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        3. Cookies and Tracking
      </h2>
      <p className="mb-4 para">
        We use cookies to remember your preferences, analyze traffic, and
        deliver personalized content. You can choose to disable cookies through
        your browser settings.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">4. Data Sharing</h2>
      <p className="mb-4 para">
        We do not sell your personal data. We may share data with trusted
        third-party services (like analytics providers or AI platforms) only
        when necessary to run the site effectively.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">5. Data Security</h2>
      <p className="mb-4 para">
        We implement appropriate technical and organizational measures to
        protect your data from unauthorized access, use, or disclosure.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">6. Your Rights</h2>
      <p className="mb-4 para">
        You have the right to access, update, or delete your data. If you’d like
        to exercise any of these rights, please contact us.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">7. Children’s Privacy</h2>
      <p className="mb-4 para">
        The Blog GPT is not intended for children under the age of 13. We do not
        knowingly collect data from children.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        8. Changes to This Policy
      </h2>
      <p className="mb-4 para">
        We may update this Privacy Policy from time to time. Any changes will be
        posted on this page with a new effective date.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">9. Contact Us</h2>
      <p className="mb-4 para">
        If you have questions or concerns about this Privacy Policy, please
        contact us at{" "}
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