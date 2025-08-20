import React from "react";

interface TagsProps {
  tags?: string[];
  limit?: number;
}

const Tags: React.FC<TagsProps> = ({ tags = [], limit = 5 }) => {
  const colors = [
    "paleBlue_tag",
    "darkBlue_tag",
    "rose_tag",
    "green_tag",
    "violet_tag",
    "black_tag",
    "red_tag",
  ];

  // Only take up to `limit`
  const tagsArray = tags.slice(0, limit);

  return (
    <div className="flex gap-4 flex-wrap">
      {tagsArray.length > 0
        ? tagsArray.map((tag, i) =>
            tag?.length < 2 ? null : (
              <span key={i} className={`tag ${colors[i % colors.length]}`}>
                {tag.trim()}
              </span>
            )
          )
        : // skeleton when no tags
          Array.from({ length: limit }).map((_, i) => (
            <span key={i} className="skeloten_loading w-14 h-6 rounded" />
          ))}
    </div>
  );
};

export default Tags;
