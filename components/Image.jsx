import Image from "next/image";
import { useState } from "react";

const CustomImage = ({ src, alt, className, width = 500, height = 300, ...props }) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ aspectRatio: `${width}/${height}` }}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`
          duration-700 ease-in-out
          ${isLoading ? 'scale-110 blur-2xl grayscale' : 'scale-100 blur-0 grayscale-0'}
        `}
        onLoadingComplete={() => setIsLoading(false)}
        {...props}
      />
    </div>
  );
};

export default CustomImage; 