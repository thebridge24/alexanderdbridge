import { motion, Variants } from 'framer-motion';

const skeletonCardVariants:Variants = {
  hidden: {
    opacity: 0,
    y: 25,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: "easeOut" as const,
    },
  },
};

// SKELETON CARD
export default function SuggestedUserSkeleton() {
  return (
    <motion.div
      variants={skeletonCardVariants}
      className="relative bg-neutral-950 border border-neutral-800/80 rounded-3xl p-4 flex flex-col shadow-xl overflow-hidden"
    >
      {/* Banner */}
      <div className="relative h-20 -mx-4 -mt-4 mb-3 bg-neutral-900 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent animate-pulse" />
      </div>

      {/* Avatar */}
      <div className="flex items-center justify-between -mt-10 mb-3 z-10">
        <div className="size-14 rounded-full bg-neutral-800 border-2 border-neutral-700 animate-pulse" />
      </div>

      {/* User details */}
      <div className="mb-4 space-y-2">
        <div className="h-3.5 w-32 rounded-full bg-neutral-800 animate-pulse" />
        <div className="h-2.5 w-24 rounded-full bg-neutral-900 animate-pulse" />
      </div>

      {/* Streak, followers and milestone */}
      <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-neutral-900 mb-4">
        <div className="flex flex-col items-center gap-2">
          <div className="size-4 rounded-full bg-neutral-800 animate-pulse" />
          <div className="h-3 w-8 rounded-full bg-neutral-800 animate-pulse" />
          <div className="h-2 w-12 rounded-full bg-neutral-900 animate-pulse" />
        </div>

        <div className="flex flex-col items-center gap-2 border-x border-neutral-900">
          <div className="size-4 rounded-full bg-neutral-800 animate-pulse" />
          <div className="h-3 w-8 rounded-full bg-neutral-800 animate-pulse" />
          <div className="h-2 w-14 rounded-full bg-neutral-900 animate-pulse" />
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="size-4 rounded-full bg-neutral-800 animate-pulse" />
          <div className="h-3 w-14 rounded-full bg-neutral-800 animate-pulse" />
          <div className="h-2 w-14 rounded-full bg-neutral-900 animate-pulse" />
        </div>
      </div>

      {/* Follow button */}
      <div className="h-10 w-full rounded-full bg-neutral-800 animate-pulse" />
    </motion.div>
  );
}