import React from "react";
import defaultBg from "@/assets/new-login-bg.png";

interface FixedBackgroundProps {
  src?: string;
}

// Global fixed background layer that keeps the full image visible (no cropping)
// Works reliably on mobile and desktop (avoids background-attachment: fixed issues)
export const FixedBackground: React.FC<FixedBackgroundProps> = ({ src = defaultBg }) => {
  return (
    <div aria-hidden className="fixed inset-0 -z-10 pointer-events-none">
      <img
        src={src}
        alt=""
        className="w-full h-full object-contain object-center"
        decoding="async"
        loading="eager"
      />
    </div>
  );
};

export default FixedBackground;

