import { motion } from "framer-motion";

const orbs = [
  { size: 180, x: "75%", y: "20%", delay: 0, duration: 8, color: "rgba(243, 161, 90, 0.12)" },
  { size: 120, x: "15%", y: "60%", delay: 2, duration: 10, color: "rgba(255, 255, 255, 0.06)" },
  { size: 90, x: "80%", y: "70%", delay: 1, duration: 7, color: "rgba(243, 161, 90, 0.08)" },
  { size: 60, x: "35%", y: "25%", delay: 3, duration: 9, color: "rgba(255, 255, 255, 0.04)" },
  { size: 140, x: "60%", y: "45%", delay: 1.5, duration: 11, color: "rgba(243, 161, 90, 0.06)" },
];

const shapes = [
  { type: "diamond", size: 50, x: "20%", y: "30%", delay: 0, rotate: 45, duration: 12 },
  { type: "ring", size: 70, x: "70%", y: "55%", delay: 2, rotate: 0, duration: 15 },
  { type: "diamond", size: 30, x: "85%", y: "25%", delay: 1, rotate: 45, duration: 10 },
];

export default function Hero3D() {
  return (
    <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">
      {/* Glass Orbs */}
      {orbs.map((orb, i) => (
        <motion.div
          key={`orb-${i}`}
          className="absolute rounded-full"
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.x,
            top: orb.y,
            background: `radial-gradient(circle at 30% 30%, ${orb.color}, transparent 70%)`,
            backdropFilter: "blur(1px)",
            border: "1px solid rgba(255,255,255,0.04)",
          }}
          animate={{
            y: [-15, 15, -15],
            x: [-8, 8, -8],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: orb.duration,
            delay: orb.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* 3D Glass Shapes */}
      {shapes.map((shape, i) => (
        <motion.div
          key={`shape-${i}`}
          className="absolute"
          style={{
            left: shape.x,
            top: shape.y,
            width: shape.size,
            height: shape.size,
          }}
          animate={{
            y: [-10, 10, -10],
            rotate: [shape.rotate, shape.rotate + 15, shape.rotate],
          }}
          transition={{
            duration: shape.duration,
            delay: shape.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {shape.type === "diamond" ? (
            <div
              className="w-full h-full"
              style={{
                background: "rgba(243, 161, 90, 0.08)",
                border: "1px solid rgba(243, 161, 90, 0.15)",
                backdropFilter: "blur(8px)",
                borderRadius: "4px",
                transform: `rotate(${shape.rotate}deg)`,
              }}
            />
          ) : (
            <div
              className="w-full h-full rounded-full"
              style={{
                border: "2px solid rgba(255, 255, 255, 0.08)",
                background: "transparent",
              }}
            />
          )}
        </motion.div>
      ))}

      {/* Floating particles */}
      {Array.from({ length: 15 }).map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute w-1 h-1 rounded-full bg-[#F3A15A]"
          style={{
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
            opacity: 0.15 + Math.random() * 0.25,
          }}
          animate={{
            y: [-20, 20, -20],
            opacity: [0.1, 0.4, 0.1],
          }}
          transition={{
            duration: 4 + Math.random() * 6,
            delay: Math.random() * 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
