"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaRegPenToSquare, FaRegTrashCan, FaShareNodes } from "react-icons/fa6";

interface CommentOptionSliderUpProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
  isOwner?: boolean;
}

export const CommentOptionSliderUp: React.FC<CommentOptionSliderUpProps> = ({
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onShare,
  isOwner = false,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop clicking outside closes */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-xs z-99999"
          />

          {/* Plain Black Slide-Up Sheet (Draggable down / tap outside) */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 80 || info.velocity.y > 400) {
                onClose();
              }
            }}
            className="fixed bottom-0 left-0 right-0 max-w-xl mx-auto bg-black border-t border-neutral-800 rounded-t-3xl z-100000 pb-10 pt-3 px-4 shadow-2xl"
          >
            {/* Drag Handle Bar */}
            <div className="w-full flex items-center justify-center pb-4">
              <div className="w-12 h-1 bg-neutral-700 rounded-full" />
            </div>

            {/* Options List */}
            <div className="space-y-1">
              {isOwner && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      onEdit?.();
                      onClose();
                    }}
                    className="w-full py-3.5 px-4 rounded-2xl flex items-center gap-3 text-xs font-semibold text-white hover:bg-neutral-900 transition-colors cursor-pointer"
                  >
                    <FaRegPenToSquare className="size-4 text-neutral-400" />
                    <span>Edit comment</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onDelete?.();
                      onClose();
                    }}
                    className="w-full py-3.5 px-4 rounded-2xl flex items-center gap-3 text-xs font-semibold text-red-400 hover:bg-red-950/20 transition-colors cursor-pointer"
                  >
                    <FaRegTrashCan className="size-4" />
                    <span>Delete comment</span>
                  </button>
                </>
              )}

              <button
                    type="button"
                    onClick={() => {
                      onShare?.();
                      onClose();
                    }}
                    className="w-full py-3.5 px-4 rounded-2xl flex items-center gap-3 text-xs font-semibold text-white hover:bg-neutral-900 transition-colors cursor-pointer"
                  >
                    <FaShareNodes className="size-4 text-neutral-400" />
                    <span>Share comment</span>
                  </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};