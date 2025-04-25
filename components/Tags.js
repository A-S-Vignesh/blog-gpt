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
  const shuffledColors = colors.sort(() => Math.random() - 0.5);
  return (
    <div className="flex gap-4 flex-wrap">
      {(tag ? tag?.split(",") : [null, null, null, null, null])
        .slice(0, limit)
        .map((tagit, i) =>
          tagit?.length < 2 ? (
            ""
          ) : (
            <span
              key={i}
              className={`${tag ? "" : "skeloten_loading w-14 h-6"} tag ${
                shuffledColors[i]
              }`}
            >
              {tagit}
            </span>
          )
        )}
    </div>
  );
};

export default Tags;
