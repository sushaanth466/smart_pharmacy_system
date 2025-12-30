import { useEffect } from "react";

export default function useParallax(ref, strength = 12) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleMove = e => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      el.style.transform =
        `perspective(1600px)
         rotateX(${(-y / rect.height) * strength}deg)
         rotateY(${(x / rect.width) * strength}deg)`;
    };

    const reset = () => {
      el.style.transform = "perspective(1600px) rotateX(0deg) rotateY(0deg)";
    };

    el.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseleave", reset);

    return () => {
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseleave", reset);
    };
  }, [ref, strength]);
}
