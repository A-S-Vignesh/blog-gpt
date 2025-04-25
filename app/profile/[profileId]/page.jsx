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

  useEffect(() => {
    const loginUser = session?.user.id;
    const profileUser = params.profileId;
    let isUser = false;
    if (loginUser === profileUser) {
      isUser = true;
    }
    setIsMyProfile(isUser);
  }, [session]);
  useEffect(() => {
    const getData = async () => {
      getRequest(`/api/user/${params.profileId}`)
        .then((data) => setUserData(data))
        .catch((err) => console.log(err));
    };
    const getPost = async () => {
      getRequest(`/api/post`)
        .then((data) => {
          const filteredPost = data.data.filter(
            (post) => post.creator._id === params.profileId
          );
          setUserPosts(filteredPost);
        })
        .catch((err) => console.log(err));
    };
    getData();
    getPost();
  }, []);

  return (
    <ViewProfile
      userData={userData}
      userPosts={userPosts}
      isMyProfile={isMyProfile}
    />
  );
};

export default Page;
