export const metadata = {
  title: "Terms of Use – The Blog GPT",
  description:
    "Review the terms and conditions for using The Blog GPT. Understand user rights, responsibilities, and platform guidelines.",
};

import React from "react";

const TermsOfUsePage = () => {
  return (
    <section className="max-w-5xl mx-auto px-6 py-12 text-gray-800 dark:text-gray-200">
      <h1 className="text-3xl font-bold mb-6 sub_heading">Terms of Use</h1>
      <p className="mb-4 para">
        Welcome to <strong>The Blog GPT</strong>. By accessing or using our
        website, you agree to be bound by these Terms of Use. Please read them
        carefully.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">1. Use of the Site</h2>
      <p className="mb-4 para">
        You agree to use The Blog GPT platform only for lawful purposes. You
        must not post or transmit any content that is offensive, illegal,
        threatening, or violates the rights of others.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        2. User-Generated Content
      </h2>
      <p className="mb-4 para">
        By submitting content to our platform, you grant us a non-exclusive,
        royalty-free license to use, display, and share your content. You are
        solely responsible for the content you create and post.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        3. AI-Generated Content
      </h2>
      <p className="mb-4 para">
        Some content may be generated using AI tools like Gemini. While we
        strive for accuracy and relevance, we do not guarantee that all
        AI-generated content is accurate, appropriate, or free from bias. Always
        review content before publishing.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        4. Intellectual Property
      </h2>
      <p className="mb-4 para">
        All trademarks, logos, and original content on The Blog GPT are the
        property of their respective owners. You may not use any of our branding
        without prior permission.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">5. Termination</h2>
      <p className="mb-4 para">
        We reserve the right to suspend or terminate your account if you violate
        these Terms or engage in any behavior that is harmful to the community.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        6. Limitation of Liability
      </h2>
      <p className="mb-4 para">
        We are not responsible for any loss or damage resulting from your use of
        the platform, including AI-generated content, third-party links, or user
        submissions.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        7. Changes to These Terms
      </h2>
      <p className="mb-4 para">
        We may update these Terms from time to time. Continued use of the site
        constitutes your acceptance of the revised Terms.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">8. Contact</h2>
      <p className="mb-4 para">
        If you have any questions or concerns about these Terms, please contact
        us at{" "}
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

export default TermsOfUsePage;
