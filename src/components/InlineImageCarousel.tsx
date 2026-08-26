import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ImageItem {
  data: string;
}

interface InlineImageCarouselProps {
  images: ImageItem[] | undefined;
  title: string;
  heightClass?: string;
}

export const InlineImageCarousel: React.FC<InlineImageCarouselProps> = ({
  images,
  title,
  heightClass = "h-36",
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right

  const hasImages = images && images.length > 0;
  const imageList = hasImages
    ? images
    : [{ data: `https://picsum.photos/seed/${title}/800/600` }];

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (imageList.length <= 1) return;
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % imageList.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (imageList.length <= 1) return;
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + imageList.length) % imageList.length);
  };

  // Slide transition variants
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir < 0 ? "100%" : "-100%",
      opacity: 0,
    }),
  };

  return (
    <div className={`relative ${heightClass} overflow-hidden group/carousel select-none`}>
      {/* Dynamic Gradient overlays */}
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-bg via-transparent to-transparent opacity-60 pointer-events-none" />
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/40 via-transparent to-transparent pointer-events-none" />

      {/* Image container & Slider transition */}
      <div className="w-full h-full relative bg-surface-2">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.img
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            src={imageList[currentIndex].data}
            alt={`${title} - view ${currentIndex + 1}`}
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover group-hover/carousel:scale-105 transition-transform duration-[1200ms] ease-out"
          />
        </AnimatePresence>
      </div>

      {/* Slide Navigation Buttons (Only display if multiple images) */}
      {imageList.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-amber-primary hover:text-bg active:scale-90 cursor-pointer"
            title="Previous Photo"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-amber-primary hover:text-bg active:scale-90 cursor-pointer"
            title="Next Photo"
          >
            <ChevronRight size={16} />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-2.5 right-2.5 z-20 flex gap-1 bg-black/50 backdrop-blur-md px-1.5 py-1 rounded-full border border-white/10 items-center">
            {imageList.map((_, idx) => (
              <span
                key={idx}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  currentIndex === idx ? "bg-amber-primary w-3" : "bg-white/40"
                }`}
              />
            ))}
          </div>

          {/* Fractional Indicator (Mobile friendly) */}
          <div className="absolute bottom-2.5 left-2.5 z-20 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10 text-[9px] font-mono font-bold text-white uppercase tracking-wider">
            {currentIndex + 1} / {imageList.length}
          </div>
        </>
      )}

      {/* No images fallback placeholder icon */}
      {!hasImages && (
        <div className="absolute top-2 left-2 z-20 text-white/40 pointer-events-none">
          <ImageIcon size={14} />
        </div>
      )}
    </div>
  );
};
