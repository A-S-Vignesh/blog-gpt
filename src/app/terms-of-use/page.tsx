const TermsOfUsePage = () => {
  return (
    <section className="max-w-5xl mx-auto px-6 py-12 text-gray-800 dark:text-gray-200">
      <h1 className="text-3xl font-bold mb-6 sub_heading">Terms of Use</h1>

      <p className="mb-4 para">
        Welcome to <strong>The Blog GPT</strong>. By accessing or using this
        website, you agree to comply with and be bound by these Terms of Use. If
        you do not agree, please do not use the platform.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        1. Account Registration
      </h2>
      <p className="mb-4 para">
        Users must sign in using Google Authentication (OAuth). You are
        responsible for maintaining the security of your Google account and any
        activity that occurs under your account.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">2. Acceptable Use</h2>
      <p className="mb-4 para">
        You agree to use the platform only for lawful purposes. You must not
        post or generate content that is illegal, harmful, abusive, defamatory,
        misleading, or infringes on the rights of others.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        3. User-Generated Content
      </h2>
      <p className="mb-4 para">
        You retain ownership of the content you create. However, by posting
        content on The Blog GPT, you grant us a non-exclusive, royalty-free,
        worldwide license to display, distribute, and promote your content
        within the platform.
      </p>

      <p className="mb-4 para">
        You are solely responsible for the content you publish.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        4. AI-Generated Content
      </h2>
      <p className="mb-4 para">
        The platform may use AI technologies (such as Google Gemini) to assist
        in generating content. AI-generated outputs may contain inaccuracies,
        biases, or unintended results. Users must review and verify all content
        before publishing.
      </p>

      <p className="mb-4 para">
        We do not guarantee the accuracy, reliability, or originality of
        AI-generated content.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">5. Content Moderation</h2>
      <p className="mb-4 para">
        We reserve the right to remove, edit, or restrict any content that
        violates these Terms or is deemed inappropriate, without prior notice.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        6. Intellectual Property
      </h2>
      <p className="mb-4 para">
        All platform branding, logos, design elements, and proprietary software
        belong to The Blog GPT. You may not copy, reproduce, or use our branding
        without written permission.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">7. Termination</h2>
      <p className="mb-4 para">
        We may suspend or terminate your account at our discretion if you
        violate these Terms or engage in harmful activity.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        8. Limitation of Liability
      </h2>
      <p className="mb-4 para">
        The Blog GPT is provided "as is" without warranties of any kind. We are
        not liable for any indirect, incidental, or consequential damages
        resulting from your use of the platform.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">9. Governing Law</h2>
      <p className="mb-4 para">
        These Terms shall be governed by and interpreted in accordance with the
        laws of India.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">10. Changes to Terms</h2>
      <p className="mb-4 para">
        We may update these Terms from time to time. Continued use of the
        platform after changes means you accept the revised Terms.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">11. Contact</h2>
      <p className="mb-4 para">
        For questions regarding these Terms, please contact:
        <a
          href="mailto:support@thebloggpt.com"
          target="_blank"
          className="underline text-blue-600 dark:text-blue-400 ml-1"
        >
          support@thebloggpt.com
        </a>
      </p>

      <p className="mt-10 text-sm text-gray-500">
        Last updated: {new Date().toLocaleDateString()}
      </p>
    </section>
  );
};

export default TermsOfUsePage;
