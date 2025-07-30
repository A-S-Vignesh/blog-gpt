"use client";

import ViewProfile from "@/components/ViewProfile";
import { getRequest } from "@/utils/requestHandlers";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";

const Page = () => {
  const { data: session } = useSession();
  const params = useParams();
  const [isMyProfile, setIsMyProfile] = useState(false);
  const [userData, setUserData] = useState(null);
  const [userPosts, setUserPosts] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loginUser = session?.user.id;
    const profileUser = params.profileId;
    let isUser = false;
    if (loginUser === profileUser) {
      isUser = true;
    }
    setIsMyProfile(isUser);
  }, [session, params.profileId]);

  useEffect(() => {
    const getData = async () => {
      try {
        const data = await getRequest(`/api/user/${params.profileId}`);
        setUserData(data);
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Failed to load user profile");
      }
    };
    
    const getPost = async () => {
      try {
        // Use skip=all to get all posts
        const data = await getRequest(`/api/post?skip=all`);
        if (data && Array.isArray(data)) {
          const filteredPost = data.filter(
            (post) => post.creator._id === params.profileId
          );
          setUserPosts(filteredPost);
        } else {
          console.error("Invalid data format received from server");
          setError("Failed to load user posts");
        }
      } catch (err) {
        console.error("Error fetching user posts:", err);
        setError("Failed to load user posts");
      }
    };
    
    getData();
    getPost();
  }, [params.profileId]);

  return (
    <ViewProfile
      userData={userData}
      setUserData={setUserData}
      userPosts={userPosts}
      isMyProfile={isMyProfile}
      error={error}
    />
  );
};

export default Page;
