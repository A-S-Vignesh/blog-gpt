"use client";

import React, { useState } from "react";
import { FaPaperPlane } from "react-icons/fa6";

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
    >("idle");
  const [showModal, setShowModal] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch("/api/contactmessage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      // SUCCESS
      setShowModal(true);
      setStatus("success");
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message || "Failed to send message");
    }
  };

  return (
    <div className="bg-white dark:bg-dark-100 rounded-2xl shadow-xl p-8 border-2 border-gray-200 dark:border-gray-700">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
        Send us a message
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block mb-2 text-gray-700 dark:text-gray-300">
              Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-100"
            />
          </div>

          <div>
            <label className="block mb-2 text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-100"
            />
          </div>
        </div>

        <div>
          <label className="block mb-2 text-gray-700 dark:text-gray-300">
            Subject
          </label>
          <input
            type="text"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-100"
          />
        </div>

        <div>
          <label className="block mb-2 text-gray-700 dark:text-gray-300">
            Message
          </label>
          <textarea
            name="message"
            rows={6}
            value={formData.message}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-100"
          />
        </div>

        <button
          type="submit"
          disabled={status === "loading"}
          className={`w-full flex items-center justify-center py-3 px-8 rounded-lg font-semibold text-white transition
            ${
              status === "loading"
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
        >
          <FaPaperPlane className="mr-2" />
          {status === "loading" ? "Sending..." : "Send Message"}
        </button>
      </form>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white dark:bg-dark-100 rounded-2xl shadow-2xl w-full max-w-md p-8 text-center animate-scale-in">
            <div className="text-green-600 text-5xl mb-4">✅</div>

            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Message Sent Successfully
            </h3>

            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Thanks for reaching out. We’ve received your message and will get
              back to you shortly.
            </p>

            <button
              onClick={() => setShowModal(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactForm;
