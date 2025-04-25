import Image from "next/image";
import React, { useState } from "react";
import BlogPost from "./BlogPost";
import Loading from "@/app/loading";

const ViewProfile = ({ isMyProfile, userData, userPosts }) => {
  const [profileEdit, setProfileEdit] = useState({
    isProfileEdit: false,
    username: "",
  });
  const [error, setError] = useState({
    isError: false,
    message: "",
  });
  const [loading, setLoading] = useState(false);
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
      console.log(data);
      if (!data.isAvailable) {
        setError({
          isError: true,
          message: "Username already exist!",
        });
      } else {
        setError({
          isError: false,
          message: "",
        });
        setProfileEdit({
          ...profileEdit,
          isProfileEdit: false,
          username: "",
        });
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <section className="padding min-h-screen px-6 sm:px-16 md:px-20 lg:px-28 py-3 sm:py-4 bg-white dark:bg-dark-100">
      {/* loading */}
      {loading && <Loading />}
      {/* Title */}
      <h2 className="title_heading ">Profile</h2>
      <p className="text-lg text-slate-500 mt-0">
        Welcome to {isMyProfile ? "Your Personalized " : ""} Profile Page
      </p>
      {/* Profile card */}
      <div className="sm:my-10 my-6 flex sm:gap-20 gap-6 items-start  sm:items-center lg:w-[50%]">
        {/* Profile photo */}
        <Image
          src={userData?.image}
          width={100}
          height={100}
          alt="profile image"
          className=" md:h-[150px] sm:h-[75px]  md:w-[150px] p-1  sm:w-[75px] h-[50px] w-[50px] mt-4 sm:mt-0 rounded-full"
        />
        <div className="">
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
                className="border dark:ring-white dark:border-white ring-1 dark:bg-dark-100  ring-black p-2 text-2xl border-black rounded-md"
              />
            ) : (
              userData?.username
            )}
          </h2>
          {error.isError && (
            <div className="alert alert-error text-red-500">
              <span className="font-bold">Error! </span>
              {error.message}
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
            <div className="flex flex-nowrap gap-x-6">
              {profileEdit.isProfileEdit && (
                <button
                  onClick={() =>
                    setProfileEdit({
                      ...profileEdit,
                      isProfileEdit: false,
                    })
                  }
                  className="outline_btn mt-2"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={() => handleEditProfile(userData?.username)}
                className="black_btn mt-2"
              >
                {profileEdit.isProfileEdit ? "Save" : "Edit Profile"}
              </button>
            </div>
          )}
        </div>
      </div>
      <hr className="hr" />
      {/* Users Posts */}
      <div className="">
        <h2 className="sub_heading my-4 text-left">All blog posts</h2>
        <div className="flex flex-col lg:flex-row items-center justify-center flex-wrap gap-6 ">
          {userPosts && userPosts.length < 1 && (
            <div className="center h-full w-full">
              <h2 className="text-xl text-slate-500">No Posts</h2>
            </div>
          )}
          {userPosts?.map((post, i) => (
            <BlogPost key={i} {...post} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ViewProfile;
