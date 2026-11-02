import { motion, Variants } from "framer-motion";

const listItemVariants:Variants = {
  hidden: {
    opacity: 0,
    y: 12,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut" as const,
    },
  },
};

export default // SKELETON ROW
function ConnectionSkeleton() {
  return (
    <motion.div
      variants={listItemVariants}
      className="flex items-center justify-between px-3 py-3 rounded-2xl"
    >
      {/* User Info */}
      <div className="flex items-center gap-3">
        <div className="size-12 rounded-full bg-neutral-800 border border-neutral-700 animate-pulse shrink-0" />

        <div className="space-y-2">
          <div className="h-3 w-28 rounded-full bg-neutral-800 animate-pulse" />
          <div className="h-2.5 w-16 rounded-full bg-neutral-900 animate-pulse" />
        </div>
      </div>

      {/* Follow Button */}
      <div className="w-24 h-8 rounded-full bg-neutral-800 animate-pulse" />
    </motion.div>
  );
}
