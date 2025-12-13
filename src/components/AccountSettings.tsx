"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";

import {
  FaUser,
  FaAt,
  FaQuoteLeft,
  FaTwitter,
  FaLinkedin,
  FaGithub,
  FaKey,
  FaEye,
  FaEyeSlash,
  FaSave,
} from "react-icons/fa";
import Image from "next/image";
import {
  ConfirmUsernameChange,
  InfoModal,
} from "@/components/ConformUsernameChage";

type ModalState = {
  type: "success" | "error";
  title: string;
  message: string;
};

const AccountSettings = () => {
  const [userData, setUserData] = useState({
    name: "",
    username: "",
    bio: "",
    socials: {
      twitter: "",
      linkedin: "",
      github: "",
    },
    geminiApiKey: "",
    image: "",
  });

  // Form state
  const [formData, setFormData] = useState({ ...userData });
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showModal, setShowModal] = useState<ModalState | null>(null);
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch("/api/useraction/get", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          console.error("Failed to fetch user data:", res.statusText);
          return setUserData({
            name: "",
            username: "",
            bio: "",
            socials: { twitter: "", linkedin: "", github: "" },
            geminiApiKey: "",
            image: "/assets/images/default-avatar.png",
          });
        }

        const data = await res.json();
        setUserData(data);
        setFormData({ ...data });
      } catch (err) {
        console.error("Failed to fetch user data:", err);
        setUserData({
          name: "",
          username: "",
          bio: "",
          socials: { twitter: "", linkedin: "", github: "" },
          geminiApiKey: "",
          image: "/assets/images/default-avatar.png",
        });
      }
    };

    fetchUserData();
  }, []);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSocialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Remove any accidental full URL pasted by user
    const cleanedValue = value
      .replace(
        /^https?:\/\/(www\.)?(x\.com|twitter\.com|linkedin\.com\/in|github\.com)\//,
        ""
      )
      .trim();

    setFormData((prev: any) => ({
      ...prev,
      socials: {
        ...prev.socials,
        [name]: cleanedValue,
      },
    }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const isUsernameChanged =
      formData.username && formData.username !== userData.username;

    // If username is changed, show confirmation first
    if (isUsernameChanged) {
      setShowConfirm(true);
      return;
    }

    // Otherwise just save
    await saveProfile(isUsernameChanged);
  };

  const saveProfile = async (isUsernameChanged: string | boolean) => {
    setIsSaving(true);

    try {
      const updatedData = {
        name: formData.name || "",
        username: formData.username || "",
        bio: formData.bio || "",
        socials: {
          twitter: formData.socials?.twitter || "",
          linkedin: formData.socials?.linkedin || "",
          github: formData.socials?.github || "",
        },
        geminiApiKey: formData.geminiApiKey || "",
      };

      const response = await fetch("/api/useraction/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });

      const result = await response.json();

      if (response.ok) {
        setUserData(result.updatedUser || result);

        if (isUsernameChanged) {
          setShowModal({
            type: "success",
            title: "Username Updated",
            message:
              "Your username has been changed. Please sign in again with the new username.",
          });
          // Force logout to apply new username
          signOut({ callbackUrl: "/auth/signin" });
        } else {
          setShowModal({
            type: "success",
            title: "Profile Updated",
            message: "Your changes have been saved successfully.",
          });
        }
      } else if (response.status === 400) {
        setShowModal({
          type: "error",
          title: "Username Already Taken",
          message: result.message || "Please choose a different username.",
        });
      } else {
        setShowModal({
          type: "error",
          title: "Update Failed",
          message: result.message || "Something went wrong.",
        });
      }
    } catch (err) {
      console.error(err);
      setShowModal({
        type: "error",
        title: "Unexpected Error",
        message: "Please try again later.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleApiKeyVisibility = () => {
    setShowApiKey(!showApiKey);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-dark-100">
      <section className="py-16 px-6 sm:px-16 md:px-20 lg:px-28 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Account{" "}
            <span className="text-blue-600 dark:text-blue-400">Settings</span>
          </h1>
          <p className="text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
            Manage your profile and preferences
          </p>
        </div>
      </section>
      <div className="max-w-6xl mx-auto px-6 sm:px-16 md:px-20 lg:px-28 py-10">
        {/* Header */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-dark-100 rounded-2xl shadow-lg p-6 border-2 border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <div className="relative mx-auto w-32 h-32">
                  <div className="rounded-full overflow-hidden border-4 border-white dark:border-dark-100 shadow-lg">
                    <Image
                      src={
                        userData.image || "/assets/images/default-avatar.png"
                      }
                      alt="Profile Picture"
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button className="absolute bottom-2 right-2 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-md">
                    <FaUser className="text-sm" />
                  </button>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-4">
                  {formData.name}
                </h2>
                <div className="flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                  <FaAt className="mr-1" />
                  <span className="font-medium">{formData.username}</span>
                </div>

                <p className="text-gray-700 dark:text-gray-300 mb-6">
                  {formData.bio || "No bio added yet"}
                </p>

                <div className="flex justify-center gap-4 mb-6">
                  {/* Twitter */}
                  {formData?.socials?.twitter && (
                    <a
                      href={`https://x.com/${formData.socials.twitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800 transition"
                    >
                      <FaTwitter size={18} />
                    </a>
                  )}

                  {/* LinkedIn */}
                  {formData?.socials?.linkedin && (
                    <a
                      href={`https://linkedin.com/in/${formData.socials.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800 transition"
                    >
                      <FaLinkedin size={18} />
                    </a>
                  )}

                  {/* GitHub */}
                  {formData?.socials?.github && (
                    <a
                      href={`https://github.com/${formData.socials.github}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-gray-800 dark:text-gray-300 hover:bg-blue-200 dark:hover:bg-blue-800 transition"
                    >
                      <FaGithub size={18} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Settings Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Information Card */}
              <div className="bg-white dark:bg-dark-100 rounded-2xl shadow-lg p-6 border-2 border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                  <FaUser className="mr-2 text-blue-600 dark:text-blue-400" />
                  Profile Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-dark-100 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="username"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Username
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaAt className="text-gray-500 dark:text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        className="w-full pl-10 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-dark-100 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter username"
                        required
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label
                      htmlFor="bio"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Bio
                    </label>
                    <div className="relative">
                      <div className="absolute top-3 left-3 text-gray-500 dark:text-gray-400">
                        <FaQuoteLeft />
                      </div>
                      <textarea
                        id="bio"
                        name="bio"
                        value={formData?.bio}
                        onChange={handleChange}
                        className="w-full pl-10 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-dark-100 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Tell others about yourself"
                      ></textarea>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Max 160 characters. {160 - formData?.bio?.length}{" "}
                      remaining.
                    </p>
                  </div>
                </div>
              </div>

              {/* Social Media Card */}
              {/* Social Media Card */}
              <div className="bg-white dark:bg-dark-100 rounded-2xl shadow-lg p-6 border-2 border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                  <FaTwitter className="mr-2 text-blue-600 dark:text-blue-400" />
                  Social Media Links
                </h3>

                <div className="space-y-6">
                  {/* Twitter */}
                  <div>
                    <label
                      htmlFor="twitter"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Twitter
                    </label>
                    <div className="flex rounded-xl overflow-hidden border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-100 focus-within:ring-2 focus-within:ring-blue-500">
                      <span className="px-3 py-3 text-gray-500 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 select-none">
                        https://x.com/
                      </span>
                      <input
                        type="text"
                        id="twitter"
                        name="twitter"
                        value={formData?.socials?.twitter || ""}
                        onChange={handleSocialChange}
                        className="flex-1 px-3 py-3 outline-none bg-transparent text-gray-900 dark:text-white"
                        placeholder="username"
                      />
                    </div>
                  </div>

                  {/* LinkedIn */}
                  <div>
                    <label
                      htmlFor="linkedin"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      LinkedIn
                    </label>
                    <div className="flex rounded-xl overflow-hidden border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-100 focus-within:ring-2 focus-within:ring-blue-500">
                      <span className="px-3 py-3 text-gray-500 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 select-none">
                        https://linkedin.com/in/
                      </span>
                      <input
                        type="text"
                        id="linkedin"
                        name="linkedin"
                        value={formData?.socials?.linkedin || ""}
                        onChange={handleSocialChange}
                        className="flex-1 px-3 py-3 outline-none bg-transparent text-gray-900 dark:text-white"
                        placeholder="username"
                      />
                    </div>
                  </div>

                  {/* GitHub */}
                  <div>
                    <label
                      htmlFor="github"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      GitHub
                    </label>
                    <div className="flex rounded-xl overflow-hidden border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-100 focus-within:ring-2 focus-within:ring-blue-500">
                      <span className="px-3 py-3 text-gray-500 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 select-none">
                        https://github.com/
                      </span>
                      <input
                        type="text"
                        id="github"
                        name="github"
                        value={formData?.socials?.github || ""}
                        onChange={handleSocialChange}
                        className="flex-1 px-3 py-3 outline-none bg-transparent text-gray-900 dark:text-white"
                        placeholder="username"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* API Settings Card */}
              <div className="bg-white dark:bg-dark-100 rounded-2xl shadow-lg p-6 border-2 border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                  <FaKey className="mr-2 text-blue-600 dark:text-blue-400" />
                  API Settings
                </h3>

                <div>
                  <label
                    htmlFor="geminiApiKey"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Gemini API Key
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaKey className="text-gray-500 dark:text-gray-400" />
                    </div>
                    <input
                      type={showApiKey ? "text" : "password"}
                      id="geminiApiKey"
                      name="geminiApiKey"
                      value={formData?.geminiApiKey}
                      onChange={handleChange}
                      className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-dark-100 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your Gemini API key"
                    />
                    <button
                      type="button"
                      onClick={toggleApiKeyVisibility}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      {showApiKey ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    This API key is used to generate content with Gemini AI.
                    Keep it secure.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4 pt-4">
                <Link
                  href={`/${userData.username}`}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:opacity-90 transition flex items-center justify-center disabled:opacity-70"
                >
                  <FaSave className="mr-2" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {showConfirm && (
        <ConfirmUsernameChange
          onConfirm={() => {
            setShowConfirm(false);
            saveProfile(true);
          }}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      {showModal && (
        <InfoModal
          type={showModal.type}
          title={showModal.title}
          message={showModal.message}
          onClose={() => {
            if (
              showModal.type === "success" &&
              showModal.title.includes("Username")
            ) {
              signOut({ callbackUrl: "/auth/signin" });
            }
            setShowModal(null);
          }}
        />
      )}
    </div>
  );
};

export default AccountSettings;
