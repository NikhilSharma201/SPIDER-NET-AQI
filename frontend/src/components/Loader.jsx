import { motion } from 'framer-motion';

export default function Loader() {
  return (
    <div className="flex justify-center items-center h-48">
      <motion.div
        className="w-16 h-16 border-4 border-spider-red rounded-full"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [1, 0.3, 1],
          borderColor: ["#ff003c", "#00f0ff", "#ff003c"]
        }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}