import Link from "next/link";

function CtaSection() {
    return (
      <section className="py-16 px-6 sm:px-16 md:px-20 lg:px-28 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Content Creation?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Join thousands of creators who are already using Blog-GPT to produce
            amazing content faster.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
            href={"/auth/signin"}
            className="bg-white text-blue-600 font-semibold py-3 px-8 rounded-lg hover:bg-gray-100 transition duration-300">
              Create a Free Account
            </Link>
            <Link
            href={"/post"}
            className="bg-transparent border-2 border-white text-white font-semibold py-3 px-8 rounded-lg hover:bg-blue-700 transition duration-300">
              See Blog
            </Link>
          </div>
        </div>
      </section>
    );
}

export default CtaSection;