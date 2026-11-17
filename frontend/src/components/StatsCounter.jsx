import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

function AnimatedNumber({ target, suffix = "", duration = 2000 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!isInView) return;
    const num = parseInt(target.replace(/[^0-9]/g, ""));
    if (isNaN(num)) { setCount(target); return; }
    
    let start = 0;
    const step = Math.ceil(num / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= num) {
        setCount(num);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, target, duration]);

  const display = typeof count === "number" 
    ? (target.includes("+") ? `${count}+` : count.toString())
    : count;

  return <span ref={ref}>{display}{suffix}</span>;
}

export default function StatsCounter({ stats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
      {stats.map((stat, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1, duration: 0.5 }}
          className="text-center"
        >
          <div className="font-heading text-4xl sm:text-5xl md:text-6xl font-light text-[#F3A15A] tracking-tight" data-testid={`stat-${i}`}>
            <AnimatedNumber target={stat.number} />
          </div>
          <div className="text-white/50 text-sm mt-2 uppercase tracking-widest font-light">
            {stat.label}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
