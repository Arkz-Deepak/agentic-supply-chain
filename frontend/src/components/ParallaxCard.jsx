import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export default function ParallaxCard({
  children,
  className = '',
  maxTilt = 6,
  glowColor = 'rgba(0, 240, 255, 0.15)',
  ...props
}) {
  const cardRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for high-end organic feel
  const springConfig = { damping: 20, stiffness: 200 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [maxTilt, -maxTilt]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-maxTilt, maxTilt]), springConfig);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // Convert to relative coordinates (-0.5 to 0.5)
    mouseX.set(clientX / width - 0.5);
    mouseY.set(clientY / height - 0.5);
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      className={`relative rounded-2xl glass-panel transition-all duration-200 ${className}`}
      {...props}
    >
      {/* Dynamic glossy specular reflection layer */}
      {isHovered && (
        <div
          className="pointer-events-none absolute -inset-px rounded-2xl opacity-60 transition duration-300"
          style={{
            background: `radial-gradient(400px circle at ${(mouseX.get() + 0.5) * 100}% ${(mouseY.get() + 0.5) * 100}%, ${glowColor}, transparent 70%)`,
          }}
        />
      )}
      <div className="relative z-10 h-full">{children}</div>
    </motion.div>
  );
}
