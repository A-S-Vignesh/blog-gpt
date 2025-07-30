import React from "react";

const Tags = ({ tag, limit = 5 }) => {
  const colors = [
    "paleBlue_tag",
    "darkBlue_tag",
    "rose_tag",
    "green_tag",
    "violet_tag",
    "black_tag",
    "red_tag",
  ];

  const tagsArray = (
    tag ? tag?.split(",") : [null, null, null, null, null]
  ).slice(0, limit);

  return (
    <div className="flex gap-4 flex-wrap">
      {tagsArray.map((tagit, i) =>
        tagit?.length < 2 ? null : (
          <span
            key={i}
            className={`${tag ? "" : "skeloten_loading w-14 h-6"} tag ${
              colors[i % colors.length]
            }`}
          >
            {tagit.trim()}
          </span>
        )
      )}
    </div>
  );
};


export default Tags;
