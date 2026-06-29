"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { signOut } from "next-auth/react";

import {
  FaUser,
  FaAt,
  FaTwitter,
  FaLinkedin,
  FaGithub,
  FaKey,
  FaEye,
  FaEyeSlash,
  FaSave,
  FaArrowRight,
} from "react-icons/fa";
import Image from "next/image";
import {
  ConfirmUsernameChange,
  InfoModal,
} from "@/components/ConformUsernameChage";
import { getPlanById } from "@/config/plans";

type ModalState = {
  type: "success" | "error";
  title: string;
  message: string;
};

const BIO_MAX = 160;

/** Animated shimmer shown while the settings data is loading. Mirrors the real
 *  layout (left profile card + right column of setting cards) so there is no
 *  layout shift when the content swaps in. */
function SettingsSkeleton() {
  const block = "bg-gray-200 dark:bg-gray-800 rounded";
  const card =
    "rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-dark-100 shadow-sm p-6";
  return (
    <div className="min-h-screen bg-white dark:bg-dark-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 animate-pulse">
        <header className="mb-8 space-y-2">
          <div className={`h-7 w-56 ${block}`} />
          <div className={`h-4 w-72 ${block}`} />
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <aside className="lg:col-span-1">
            <div className={card}>
              <div className={`h-24 w-24 rounded-full mx-auto ${block}`} />
              <div className={`h-4 w-32 mx-auto mt-4 ${block}`} />
              <div className={`h-3 w-24 mx-auto mt-2 ${block}`} />
              <div className={`h-2 w-full mt-6 ${block}`} />
              <div className={`h-3 w-40 mx-auto mt-3 ${block}`} />
            </div>
          </aside>
          <div className="lg:col-span-2 space-y-6">
            {/* Username card */}
            <div className={card}>
              <div className={`h-5 w-32 ${block}`} />
              <div className={`h-16 w-full mt-4 ${block}`} />
              <div className={`h-10 w-full mt-4 ${block}`} />
            </div>
            {/* Profile card */}
            <div className={card}>
              <div className={`h-5 w-28 ${block}`} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5">
                <div className={`h-10 ${block}`} />
                <div className={`h-10 ${block}`} />
                <div className={`h-24 sm:col-span-2 ${block}`} />
              </div>
            </div>
            {/* API key card */}
            <div className={card}>
              <div className={`h-5 w-40 ${block}`} />
              <div className={`h-10 w-full mt-4 ${block}`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const AccountSettings = () => {
  const queryClient = useQueryClient();

  // Fetch settings via React Query — cached, so revisiting /settings is instant
  // and a background refetch keeps it fresh. `isLoading` cleanly drives the
  // shimmer below, so the wrong username state never flashes on first paint.
  const {
    data: userData,
    isLoading,
    isError,
  } = useQuery<any>({
    queryKey: ["account-settings"],
    queryFn: async () => {
      const res = await fetch("/api/useraction/get", {
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to load settings");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Editable copy of the server data; null until it loads so we render a
  // skeleton instead of a half-populated form.
  const [formData, setFormData] = useState<any>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  // One-time username change (its own action, separate from the profile save).
  const [usernameInput, setUsernameInput] = useState("");
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  // BYO Gemini key — its own action; the key is never read back from the server.
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [apiKeySaving, setApiKeySaving] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<ModalState | null>(null);

  // Sync the editable form whenever the server data changes (initial load, and
  // after a save updates the cache). Won't clobber edits mid-typing since the
  // query isn't refetched while the form is open.
  useEffect(() => {
    if (userData) {
      setFormData({ ...userData });
      setUsernameInput(userData.username || "");
    }
  }, [userData]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
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
    // The username is changed via its own one-time action, not this form.
    await saveProfile();
  };

  // One-time username change. Confirmed via the warning dialog, then this POSTs
  // to the dedicated endpoint and signs the user out so the new handle (carried
  // in the session JWT) is refreshed everywhere.
  const handleChangeUsername = async () => {
    setUsernameSaving(true);
    setUsernameError(null);
    try {
      const res = await fetch("/api/useraction/username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: usernameInput.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setUsernameError(
          data?.error || "Could not change username. Please try again.",
        );
        setUsernameSaving(false);
        return;
      }
      // Success → re-login so the new handle propagates.
      signOut({ callbackUrl: "/auth/signin" });
    } catch {
      setUsernameError("Please try again later.");
      setUsernameSaving(false);
    }
  };

  const handleSaveApiKey = async () => {
    const key = apiKeyInput.trim();
    if (!key) {
      setApiKeyError("Enter your API key.");
      return;
    }
    setApiKeySaving(true);
    setApiKeyError(null);
    try {
      const res = await fetch("/api/useraction/gemini-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ geminiApiKey: key }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setApiKeyError(data?.error || "Could not save the key.");
        return;
      }
      // Reflect the new state in the cache without ever holding the secret.
      queryClient.setQueryData(["account-settings"], (old: any) =>
        old ? { ...old, hasGeminiApiKey: true } : old,
      );
      setApiKeyInput("");
      setShowModal({
        type: "success",
        title: "API key saved",
        message: "Your Gemini key is encrypted and saved.",
      });
    } catch {
      setApiKeyError("Please try again later.");
    } finally {
      setApiKeySaving(false);
    }
  };

  const handleRemoveApiKey = async () => {
    setApiKeySaving(true);
    setApiKeyError(null);
    try {
      const res = await fetch("/api/useraction/gemini-key", {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setApiKeyError(data?.error || "Could not remove the key.");
        return;
      }
      queryClient.setQueryData(["account-settings"], (old: any) =>
        old ? { ...old, hasGeminiApiKey: false } : old,
      );
      setApiKeyInput("");
      setShowModal({
        type: "success",
        title: "API key removed",
        message: "Your Gemini key has been removed.",
      });
    } catch {
      setApiKeyError("Please try again later.");
    } finally {
      setApiKeySaving(false);
    }
  };

  const saveProfile = async () => {
    setIsSaving(true);

    try {
      const updatedData: any = {
        name: formData.name || "",
        bio: formData.bio || "",
        socials: {
          twitter: formData.socials?.twitter || "",
          linkedin: formData.socials?.linkedin || "",
          github: formData.socials?.github || "",
        },
      };
      // The Gemini key is handled by its OWN section/endpoint, never here.

      const response = await fetch("/api/useraction/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });

      const result = await response.json();

      if (response.ok) {
        // Push the saved data into the cache; the sync effect re-derives the
        // form from it. No refetch needed.
        queryClient.setQueryData(
          ["account-settings"],
          result.updatedUser || result,
        );
        setShowModal({
          type: "success",
          title: "Profile Updated",
          message: "Your changes have been saved successfully.",
        });
      } else {
        // Surface the server's actual reason (it comes back in `error`) —
        // e.g. "Username already taken", the post-publish lock, or a specific
        // validation message — instead of a generic "Something went wrong".
        setShowModal({
          type: "error",
          title: "Update Failed",
          message: result.error || result.message || "Something went wrong.",
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

  // While settings load, show a shimmer instead of a half-populated form — this
  // also stops the username section from flashing the "not changed" state before
  // the real value arrives.
  if (isError) {
    return (
      <div className="min-h-screen bg-white dark:bg-dark-100 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-700 dark:text-gray-300">
            We couldn&apos;t load your settings.
          </p>
          <button
            type="button"
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["account-settings"] })
            }
            className="mt-3 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  if (isLoading || !userData || !formData) {
    return <SettingsSkeleton />;
  }

  // ── Derived display values ────────────────────────────────────────────────
  const plan = getPlanById((userData as any).plan || "free");
  const planLimit = plan.aiGenerationsPerMonth; // number | null (unlimited)
  const used = (userData as any).aiGenerationCount ?? 0;
  const usagePct =
    planLimit && planLimit > 0
      ? Math.min(100, Math.round((used / planLimit) * 100))
      : 0;
  const bioLeft = Math.max(0, BIO_MAX - (formData.bio?.length || 0));

  const inputClass =
    "w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-100 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition";
  const cardClass =
    "rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-dark-100 shadow-sm";
  const labelClass =
    "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";

  return (
    <div className="min-h-screen bg-white dark:bg-dark-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Page header */}
        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Account settings
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your profile, social links, and API key.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left column — profile preview + plan ─────────────────────── */}
          <aside className="lg:col-span-1">
            <div className={`${cardClass} p-6 lg:sticky lg:top-25`}>
              <div className="flex flex-col items-center text-center">
                <div className="relative w-24 h-24 rounded-full overflow-hidden ring-2 ring-gray-100 dark:ring-gray-800">
                  <Image
                    src={userData.image || "/assets/images/default-avatar.png"}
                    alt={formData.name || "Profile picture"}
                    fill
                    className="object-cover"
                  />
                </div>

                <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                  {formData.name || "Your name"}
                </h2>
                <p className="flex items-center justify-center gap-1 text-sm text-blue-600 dark:text-blue-400">
                  <FaAt className="text-xs" />
                  {formData.username || "username"}
                </p>

                {formData.bio ? (
                  <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                    {formData.bio}
                  </p>
                ) : (
                  <p className="mt-3 text-sm italic text-gray-400 dark:text-gray-500">
                    No bio added yet
                  </p>
                )}

                {/* Social links */}
                {(formData?.socials?.twitter ||
                  formData?.socials?.linkedin ||
                  formData?.socials?.github) && (
                  <div className="mt-4 flex justify-center gap-2">
                    {formData?.socials?.twitter && (
                      <a
                        href={`https://x.com/${formData.socials.twitter}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="X profile"
                        className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:text-blue-600 dark:hover:text-blue-400 transition"
                      >
                        <FaTwitter size={16} />
                      </a>
                    )}
                    {formData?.socials?.linkedin && (
                      <a
                        href={`https://linkedin.com/in/${formData.socials.linkedin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="LinkedIn profile"
                        className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:text-blue-600 dark:hover:text-blue-400 transition"
                      >
                        <FaLinkedin size={16} />
                      </a>
                    )}
                    {formData?.socials?.github && (
                      <a
                        href={`https://github.com/${formData.socials.github}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="GitHub profile"
                        className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:text-blue-600 dark:hover:text-blue-400 transition"
                      >
                        <FaGithub size={16} />
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Plan + usage */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Plan
                  </span>
                  <span className="text-sm font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                    {plan.name}
                  </span>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                    <span>AI generations this month</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {planLimit === null ? "Unlimited" : `${used} / ${planLimit}`}
                    </span>
                  </div>
                  {planLimit !== null && (
                    <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-600"
                        style={{ width: `${usagePct}%` }}
                      />
                    </div>
                  )}
                </div>

                <Link
                  href="/billing"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Manage plan <FaArrowRight className="text-xs" />
                </Link>
              </div>
            </div>
          </aside>

          {/* ── Right column — settings form ─────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Username — a one-time change with its own action, kept separate
                from the profile save so it can never be triggered by accident. */}
            <section className={`${cardClass} p-6`}>
              <div className="flex items-center gap-2 mb-1">
                <FaAt className="text-blue-600 dark:text-blue-400" />
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  Username
                </h3>
              </div>

              {userData.usernameChangedAt || userData.previousUsername ? (
                <>
                  <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">
                    Your handle is{" "}
                    <span className="font-semibold">@{userData.username}</span>.
                  </p>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    You&apos;ve already used your one-time username change, so it
                    is now permanent.
                  </p>
                  {userData.previousUsername && (
                    <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                      Links to your old handle (@{userData.previousUsername})
                      redirect here automatically.
                    </p>
                  )}
                </>
              ) : (
                <>
                  <div className="mt-3 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/15 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
                    <strong>You can change your username only once.</strong> After
                    this it is permanent. Old links to your profile and posts will
                    redirect to the new handle, and you will be signed out to
                    refresh your session.
                  </div>
                  <div className="relative mt-4">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <FaAt className="text-sm" />
                    </span>
                    <input
                      type="text"
                      value={usernameInput}
                      onChange={(e) => {
                        setUsernameInput(e.target.value);
                        setUsernameError(null);
                      }}
                      className={`${inputClass} pl-9`}
                      placeholder="new-username"
                    />
                  </div>
                  {usernameError && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                      {usernameError}
                    </p>
                  )}
                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      disabled={
                        usernameSaving ||
                        !usernameInput.trim() ||
                        usernameInput.trim() === userData.username
                      }
                      onClick={() => {
                        setUsernameError(null);
                        setShowConfirm(true);
                      }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {usernameSaving ? "Changing…" : "Change username"}
                    </button>
                  </div>
                </>
              )}
            </section>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile */}
              <section className={`${cardClass} p-6`}>
                <div className="flex items-center gap-2 mb-5">
                  <FaUser className="text-blue-600 dark:text-blue-400" />
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    Profile
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="name" className={labelClass}>
                      Full name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="Your full name"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="bio" className={labelClass}>
                      Bio
                    </label>
                    <textarea
                      id="bio"
                      name="bio"
                      rows={4}
                      maxLength={BIO_MAX}
                      value={formData?.bio}
                      onChange={handleChange}
                      className={`${inputClass} resize-none`}
                      placeholder="Tell readers a little about yourself"
                    />
                    <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500 text-right">
                      {bioLeft} characters left
                    </p>
                  </div>
                </div>
              </section>

              {/* Social links */}
              <section className={`${cardClass} p-6`}>
                <div className="flex items-center gap-2 mb-5">
                  <FaLinkedin className="text-blue-600 dark:text-blue-400" />
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    Social links
                  </h3>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      id: "twitter",
                      label: "X (Twitter)",
                      prefix: "x.com/",
                      value: formData?.socials?.twitter || "",
                    },
                    {
                      id: "linkedin",
                      label: "LinkedIn",
                      prefix: "linkedin.com/in/",
                      value: formData?.socials?.linkedin || "",
                    },
                    {
                      id: "github",
                      label: "GitHub",
                      prefix: "github.com/",
                      value: formData?.socials?.github || "",
                    },
                  ].map((s) => (
                    <div key={s.id}>
                      <label htmlFor={s.id} className={labelClass}>
                        {s.label}
                      </label>
                      <div className="flex rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-100 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition">
                        <span className="px-3 py-2.5 text-sm text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/60 border-r border-gray-200 dark:border-gray-700 select-none whitespace-nowrap">
                          {s.prefix}
                        </span>
                        <input
                          type="text"
                          id={s.id}
                          name={s.id}
                          value={s.value}
                          onChange={handleSocialChange}
                          className="flex-1 min-w-0 px-3 py-2.5 text-sm bg-transparent text-gray-900 dark:text-white placeholder-gray-400 outline-none"
                          placeholder="username"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Gemini API key — dedicated action, encrypted at rest, never shown */}
              <section className={`${cardClass} p-6`}>
                <div className="flex items-center gap-2 mb-2">
                  <FaKey className="text-blue-600 dark:text-blue-400" />
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    Gemini API key
                  </h3>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Optional. Add your own Google Gemini key to generate from your
                  own quota instead of the platform&apos;s. It&apos;s encrypted at
                  rest and never shown again.
                </p>

                {userData?.hasGeminiApiKey && (
                  <div className="mb-4 flex items-center justify-between rounded-lg border border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-900/15 px-4 py-2.5">
                    <span className="text-sm text-green-700 dark:text-green-300">
                      ✓ A key is saved and active.
                    </span>
                    <button
                      type="button"
                      onClick={handleRemoveApiKey}
                      disabled={apiKeySaving}
                      className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 disabled:opacity-60"
                    >
                      Remove
                    </button>
                  </div>
                )}

                <label htmlFor="geminiApiKey" className={labelClass}>
                  {userData?.hasGeminiApiKey ? "Replace key" : "Add key"}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <FaKey className="text-sm" />
                  </span>
                  <input
                    type={showApiKey ? "text" : "password"}
                    id="geminiApiKey"
                    value={apiKeyInput}
                    onChange={(e) => {
                      setApiKeyInput(e.target.value);
                      setApiKeyError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSaveApiKey();
                      }
                    }}
                    className={`${inputClass} pl-9 pr-10`}
                    placeholder="Paste your Gemini API key"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={toggleApiKeyVisibility}
                    aria-label={showApiKey ? "Hide API key" : "Show API key"}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showApiKey ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {apiKeyError && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                    {apiKeyError}
                  </p>
                )}
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveApiKey}
                    disabled={apiKeySaving || !apiKeyInput.trim()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {apiKeySaving
                      ? "Saving…"
                      : userData?.hasGeminiApiKey
                        ? "Replace key"
                        : "Save key"}
                  </button>
                </div>
                <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
                  Stored encrypted (AES-256). We never display it again or send it
                  to your browser.
                </p>
              </section>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-1">
                <Link
                  href={`/${userData.username}`}
                  className="px-5 py-2.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <FaSave className="text-sm" />
                  {isSaving ? "Saving…" : "Save changes"}
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
            handleChangeUsername();
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
