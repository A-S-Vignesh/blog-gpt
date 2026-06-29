import Link from "next/link";

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
        <li>
          Images you upload or generate with our AI tools (stored and served via
          our image provider, Cloudinary)
        </li>
        <li>
          Your IP address and basic request metadata, collected automatically
          and used for security, rate limiting, and abuse/spam prevention (our
          legitimate interest, not for tracking)
        </li>
        <li>
          Usage and analytics data (e.g., pages visited, device type), collected
          only with your explicit consent
        </li>
        <li>Name and email submitted via our contact form</li>
        <li>
          Your own AI provider (Gemini) API key, only if you choose to add one
          in your settings. It is stored <strong>encrypted at rest</strong>, is
          never shown back to you or sent to your browser, and we{" "}
          <strong>never use it for our own purposes</strong> — it belongs to you
          and is held solely to power your own AI generations.
        </li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        Payment Information
      </h2>
      <p className="mb-4 para">
        When you subscribe to a paid plan, your payment is processed by our
        payment provider, <strong>Razorpay</strong>. We do{" "}
        <strong>not</strong> store or have access to your full card number, CVV,
        or bank credentials. These are handled directly by Razorpay. We do store
        subscription metadata such as your plan, billing cycle, amount, currency,
        and the Razorpay customer/subscription identifiers, along with payment
        event records used to verify and audit transactions.
      </p>

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
        <li>Respond to contact form enquiries</li>
        <li>Ensure security and prevent misuse</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        4. Cookies and Analytics
      </h2>
      <p className="mb-4 para">
        We use cookies and analytics tools (such as Google Analytics and Vercel
        Analytics) only after you have given explicit consent via the cookie
        consent banner shown on your first visit. You can change your
        preferences at any time using the <strong>Cookie Settings</strong> link
        in the footer of our website, or read our full{" "}
        <Link
          href="/cookies-policy"
          className="underline text-blue-600 dark:text-blue-400"
        >
          Cookies Policy
        </Link>
        .
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        5. Third-Party Services
      </h2>
      <p className="mb-4 para">
        We rely on trusted third-party services to operate our platform,
        including:
      </p>
      <ul className="list-disc ml-6 mb-4 para space-y-2">
        <li>Google Authentication (OAuth): sign-in</li>
        <li>
          Razorpay (
          <a
            href="https://razorpay.com/privacy/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-blue-600 dark:text-blue-400"
          >
            privacy policy
          </a>
          ): payment and subscription processing
        </li>
        <li>
          Cloudinary (
          <a
            href="https://cloudinary.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-blue-600 dark:text-blue-400"
          >
            privacy policy
          </a>
          ): image hosting and delivery
        </li>
        <li>Google (Gemini API): AI text and image generation</li>
        <li>Resend: transactional email (e.g., billing and account notices)</li>
        <li>Google Analytics (analytics, with consent)</li>
        <li>Vercel Analytics (analytics, with consent)</li>
        <li>Hosting and database providers</li>
      </ul>

      <p className="mb-4 para">
        These services may process limited user data only as necessary to
        provide their functionality.
      </p>

      <p className="mb-4 para">
        <strong>AI generation:</strong> when you use our AI features, the text or
        image prompt you submit (including any title you provide) is transmitted
        to Google's Gemini API to produce the requested content. Please do not
        enter sensitive personal information into AI prompts.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">6. Data Retention</h2>
      <p className="mb-4 para">
        We retain your data for as long as your account is active or as needed
        to provide our services. Specifically:
      </p>
      <ul className="list-disc ml-6 mb-4 para space-y-2">
        <li>
          <strong>Account data</strong> (name, email, profile picture):
          retained until you request deletion
        </li>
        <li>
          <strong>Blog content</strong>: retained until you delete it or your
          account is removed
        </li>
        <li>
          <strong>Contact form messages</strong>: retained for up to 12 months
          for support purposes
        </li>
        <li>
          <strong>Analytics data</strong>: processed by Google/Vercel per their
          own retention policies (typically 14 to 26 months)
        </li>
        <li>
          <strong>Subscription and payment records</strong>: retained after
          account deletion only as required to meet financial, tax, accounting,
          and audit obligations (typically up to 7 or 8 years under applicable law).
          Where personal identifiers are not legally required, they are
          disassociated from your profile or minimized.
        </li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        7. International Data Transfers
      </h2>
      <p className="mb-4 para">
        Your data may be processed by third-party service providers located
        outside your country, including in the United States and India (Razorpay).
        These transfers are made under appropriate safeguards, such as Standard
        Contractual Clauses (SCCs) and the data processing agreements of our
        providers (Google, Vercel, Cloudinary, Razorpay, and Resend), in
        compliance with applicable data protection laws.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">8. Data Security</h2>
      <p className="mb-4 para">
        We implement reasonable technical and organizational security measures
        to protect your data from unauthorized access, misuse, or disclosure.
        However, no system can guarantee complete security.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">9. Your Rights (GDPR)</h2>
      <p className="mb-4 para">
        If you are located in the European Economic Area (EEA), you have the
        following rights under GDPR:
      </p>
      <ul className="list-disc ml-6 mb-4 para space-y-2">
        <li>Access your stored personal data</li>
        <li>Request corrections or updates to your data</li>
        <li>Request deletion of your account and associated data</li>
        <li>
          Withdraw consent for analytics at any time (via Cookie Settings in the
          footer)
        </li>
        <li>Lodge a complaint with your local data protection authority</li>
      </ul>

      <p className="mb-4 para">
        To exercise any of these rights, please contact us at the email below.
      </p>

      <h2 id="do-not-sell" className="text-xl font-semibold mt-6 mb-2">
        10. California Privacy Rights (CCPA)
      </h2>
      <p className="mb-4 para">
        If you are a California resident, you have the following rights under
        the California Consumer Privacy Act (CCPA):
      </p>
      <ul className="list-disc ml-6 mb-4 para space-y-2">
        <li>Know what personal information we collect and how it is used</li>
        <li>Request deletion of your personal information</li>
        <li>Opt out of the "sale" or "sharing" of your personal information</li>
      </ul>
      <p className="mb-4 para">
        <strong>Do Not Sell or Share My Personal Information:</strong> We do not
        sell your personal information for monetary compensation. However, our
        use of Google Analytics and Vercel Analytics may constitute "sharing"
        under CCPA's broad definition. You can opt out at any time by clicking{" "}
        <strong>Cookie Settings</strong> in the footer and disabling analytics
        cookies.
      </p>
      <p className="mb-4 para">
        To exercise your CCPA rights, contact us at the email below.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        11. Children's Privacy
      </h2>
      <p className="mb-4 para">
        The Blog GPT is not intended for individuals under the age of 13. We do
        not knowingly collect personal information from children.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        12. Changes to This Policy
      </h2>
      <p className="mb-4 para">
        We may update this Privacy Policy from time to time. Updates will be
        posted on this page with a revised "Last updated" date.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">13. Contact Us</h2>
      <p className="mb-4 para">
        If you have any questions about this Privacy Policy, wish to exercise
        your rights, or request account deletion, please contact us at{" "}
        <a
          href="mailto:support@thebloggpt.com"
          target="_blank"
          className="underline text-blue-600 dark:text-blue-400"
        >
          support@thebloggpt.com
        </a>
        .
      </p>

      <p className="mt-10 text-sm text-gray-500">Last updated: June 26, 2026</p>
    </section>
  );
};

export default PrivacyPolicyPage;
