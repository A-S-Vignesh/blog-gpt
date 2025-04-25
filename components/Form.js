"use client";

import Image from "next/image";
import React, { useEffect, useState } from "react";
import LoadingSkeleton from "./Loading";

const Form = ({ name, submitting, post, setPost, handleSubmit }) => {
  const [imageUrl, setImageUrl] = useState(null);

  const handleUploadImage = (e) => {
    let file = e.target.files[0];

    //base64
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      setImageUrl(reader.result);
      setPost({ ...post, image: reader.result });
    };
  };
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    //base64
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      setImageUrl(reader.result);
      setPost({ ...post, image: reader.result });
    };
  };
  const handleDragOver = (e) => {
    e.preventDefault();
  };
  useEffect(() => {
    setImageUrl(post?.image);
  }, [post]);

  return (
    <section className="padding relative px-6 sm:px-16 md:px-20 lg:px-28 py-3 sm:py-4 bg-white dark:bg-dark-100">
      {submitting && <LoadingSkeleton />}
      <h2 className="title_heading">{name} Post</h2>
      <p className="para">
        Craft and share captivating blog posts to unleash your creativity and
        connect with the world. Let your imagination soar as you inspire and
        engage your audience with your unique voice and perspective. Feel free
        to Customize it!.
      </p>
      <form className="flex flex-col" onSubmit={handleSubmit}>
        <label className="form_label" htmlFor="titile">
          Title
        </label>
        <input
          placeholder="Write the Title"
          className="form_input"
          type="text"
          value={post?.title}
          onChange={(e) => setPost({ ...post, title: e.target.value })}
          required
        />
        <label className="form_label" htmlFor="content">
          Content
        </label>
        <textarea
          className="form_input"
          name="content"
          value={post?.content}
          onChange={(e) => setPost({ ...post, content: e.target.value })}
          placeholder="Write a Post"
          cols="30"
          rows="10"
          required
          style={{ whiteSpace: "pre-wrap" }}
        ></textarea>
        <label className="form_label" htmlFor="slug">
          Slug
        </label>
        <textarea
          className="form_input"
          placeholder="Enter the Slug"
          name="slug"
          value={post?.slug}
          onChange={(e) => setPost({ ...post, slug: e.target.value })}
          cols="30"
          rows="3"
          required
        ></textarea>
        <label className="mb-6" id="input-image" htmlFor="image">
          <h2 className="form_label">Image</h2>

          {/* image drag and drop */}
          <div className="center text-center  w-full sm:w-[75%]">
            <div
              style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : {}}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="sm:p-6 object-cover  cursor-pointer bg-no-repeat bg-center bg-contain 
               p-4 center flex-col shadow-md flex-nowrap rounded-md h-[300px] w-full   lg:w-[55%] 
               bg-[#f7f8ff] border-2 border-dashed dark:bg-gray-600 text-black dark:text-white font-semibold"
            >
              <input
                onChange={handleUploadImage}
                type="file"
                accept="image/*"
                id="image"
                hidden
          
              />
              {!imageUrl && (
                <>
                  <Image
                    className="mt-6 rounded-md"
                    src="/assets/images/upload.png"
                    width={45}
                    height={45}
                    alt="upload png"
                  />
                  <p className=" text-md">
                    Drag and Drop or click here to upload image
                  </p>
                  <span className="block  dark:text-gray-800 text-sm text-[#777] mt-4">
                    Upload any image form desktop
                  </span>
                </>
              )}
            </div>
          </div>
        </label>
        <label className="form_label" htmlFor="tag">
          tag{" "}
          <span className="text-base text-slate-500">
            (Ex: #Education , #Health, #Finance)
          </span>
        </label>
        <input
          placeholder="Enter the tag"
          className="form_input"
          type="text"
          value={post?.tag}
          onChange={(e) => setPost({ ...post, tag: e.target.value })}
          required
        />
        <div className="flex items-center my-4 sm:w-[75%] justify-start gap-6 flex-nowrap">
          <button className="outline_btn">cancel</button>
          <input
            disabled={submitting}
            type="submit"
            name={submitting ? `${name}...` : name}
            className="black_btn"
            value={name}
            required
          />
        </div>
      </form>
    </section>
  );
};

export default Form;
