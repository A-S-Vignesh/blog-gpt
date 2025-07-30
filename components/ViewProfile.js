import Image from "next/image";
import React, { use, useState } from "react";
import BlogPost from "./BlogPost";
import { useEffect } from "react";
// import Loading from "@/app/loading";
import { InfinitySpin } from "react-loader-spinner";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { set } from "lodash";

const ViewProfile = ({
  isMyProfile,
  userData,
  userPosts,
  error,
  setUserData,
}) => {
  const [profileEdit, setProfileEdit] = useState({
    isProfileEdit: false,
    geminiApiKey: userData?.geminiApiKey || "",
    username: userData?.username || "",
  });
  const [errorState, setErrorState] = useState({
    isError: false,
    message: "",
  });
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (userData) {
      setProfileEdit({
        ...profileEdit,
        username: userData.username,
        geminiApiKey: userData.geminiApiKey || "",
      });
    }
  }, [userData]);

  const handleEditProfile = async (username) => {
    if (!profileEdit.isProfileEdit) {
      return setProfileEdit({
        ...profileEdit,
        isProfileEdit: true,
        username: username,
      });
    }
    setLoading(true);
    try {
      const url = `/api/user/check?username=${profileEdit.username}&userId=${userData?._id}`;
      const response = await fetch(url);
      const data = await response.json();
      if (!data.isAvailable) {
        setErrorState({
          isError: true,
          message: "Username already exist!",
        });
      } else {
        setErrorState({
          isError: false,
          message: "",
        });
        setProfileEdit({
          ...profileEdit,
          isProfileEdit: false,
          username: "",
        });
        setUserData({
          ...userData,
          username: profileEdit.username,
          geminiApiKey: profileEdit.geminiApiKey,
        });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setErrorState({
        isError: true,
        message: "Failed to update profile",
      });
    } finally {
      setLoading(false);
    }
  };

  const isLoading = !userData || !userPosts;

  if (isLoading) {
    return (
      <section className="padding min-h-screen px-6 sm:px-16 md:px-20 lg:px-28 py-3 sm:py-4 bg-white dark:bg-dark-100">
        <div className="">
          <h2 className="title_heading">Profile</h2>
          <p className="text-lg text-slate-500 mt-0">Welcome to Profile Page</p>
          <div className="sm:my-10 my-6 flex sm:gap-20 gap-6 items-start sm:items-center lg:w-[50%]">
            <div className="relative md:h-[150px] sm:h-[75px] md:w-[150px] sm:w-[75px] h-[50px] w-[50px] mt-4 sm:mt-0">
              <div className="absolute inset-0 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
            </div>
            <div className="flex flex-col gap-4">
              <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
              <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
            </div>
          </div>
          <hr className="hr" />
          <div>
            <h2 className="sub_heading my-4 text-left">All blog posts</h2>
            <div className="flex-grow flex flex-col sm:flex-row items-center justify-center flex-wrap gap-6 sm:gap-x-10 lg:gap-x-16 min-h-[400px] w-full">
              <LoadingSkeleton count={3} />
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Show error message if there's an error
  if (error) {
    return (
      <section className="padding min-h-screen px-6 sm:px-16 md:px-20 lg:px-28 py-3 sm:py-4 bg-white dark:bg-dark-100">
        <div className="flex flex-col items-center justify-center h-[50vh]">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 black_btn"
          >
            Try Again
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="padding min-h-screen px-6 sm:px-16 md:px-20 lg:px-28 py-3 sm:py-4 bg-white dark:bg-dark-100">
      <h2 className="title_heading">Profile</h2>
      <p className="text-lg text-slate-500 mt-0">
        Welcome to {isMyProfile ? "Your Personalized " : ""} Profile Page
      </p>
      <div className="sm:my-10 my-6 flex sm:gap-20 gap-6 items-start sm:items-center lg:w-[50%]">
        <div className="relative md:h-[150px] sm:h-[75px] md:w-[150px] sm:w-[75px] h-[50px] w-[50px] mt-4 sm:mt-0">
          <Image
            src={userData?.image}
            width={100}
            height={100}
            alt="profile image"
            className="h-full w-full p-1 rounded-full"
          />
        </div>

        <div className="flex flex-col">
          <h2 className="capitalize dark:text-white w-full sm:whitespace-nowrap font-semibold mb-2 text-3xl">
            {profileEdit.isProfileEdit ? (
              <input
                type="text"
                value={profileEdit.username}
                onChange={(e) =>
                  setProfileEdit({
                    ...profileEdit,
                    username: e.target.value,
                  })
                }
                className="border dark:ring-white dark:border-white ring-1 dark:bg-dark-100 ring-black p-2 text-2xl border-black rounded-md"
              />
            ) : (
              userData?.username
            )}
          </h2>

          {errorState.isError && (
            <div className="alert alert-error text-red-500">
              <span className="font-bold">Error! </span>
              {errorState.message}
            </div>
          )}

          <p className="font-semibold text-gray-500">
            {userData &&
              (isMyProfile
                ? userData?.email
                : userData?.email.slice(0, 3) +
                  "*".repeat(10) +
                  userData?.email.slice(userData?.email.length - 4))}
          </p>

          <p className="capitalize dark:text-white font-semibold my-2 text-2xl">
            {userPosts?.length || 0} <span>Posts</span>
          </p>

          {isMyProfile && (
            <div className="mt-4">
              <label
                htmlFor="apiKey"
                className="text-sm font-medium text-gray-700 dark:text-white"
              >
                Gemini API Key
              </label>

              {profileEdit.isProfileEdit ? (
                <input
                  type="password"
                  id="apiKey"
                  value={profileEdit.geminiApiKey || "adiuahiudfhaiufhaiufui"}
                  onChange={(e) =>
                    setProfileEdit({
                      ...profileEdit,
                      geminiApiKey: e.target.value,
                    })
                  }
                  className="mt-1 p-2 w-full border rounded-md dark:bg-dark-200 dark:border-gray-600"
                  placeholder="Enter your Gemini API key"
                />
              ) : (
                <p className="mt-1 text-gray-600 dark:text-gray-300 font-mono">
                  {"*".repeat(
                    Math.max(0, (userData?.geminiApiKey?.length || 0) - 4)
                  ) + userData?.geminiApiKey?.slice(-4)}
                </p>
              )}
            </div>
          )}

          {isMyProfile && (
            <div className="flex flex-nowrap gap-x-6">
              {profileEdit.isProfileEdit && (
                <button
                  onClick={() =>
                    setProfileEdit({
                      ...profileEdit,
                      isProfileEdit: false,
                      username: userData.username,
                      geminiApiKey: userData.geminiApiKey,
                    })
                  }
                  className="outline_btn mt-2"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={() =>
                  handleEditProfile(
                    profileEdit.username,
                    profileEdit.geminiApiKey
                  )
                }
                className="black_btn mt-2"
              >
                {profileEdit.isProfileEdit ? "Save" : "Edit Profile"}
              </button>
            </div>
          )}
        </div>
      </div>
      <hr className="hr" />
      <div>
        <h2 className="sub_heading my-4 text-left">All blog posts</h2>
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-x-10 lg:gap-x-16 mt-2 md:mt-4">
          {userPosts && userPosts.length < 1 ? (
            <div className="col-span-full center h-full w-full">
              <h2 className="text-xl text-slate-500">No Posts</h2>
            </div>
          ) : (
            userPosts?.map((post, i) => <BlogPost key={i} {...post} />)
          )}
        </div>
      </div>
    </section>
  );
};

export default ViewProfile;
