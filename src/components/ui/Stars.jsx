import { useMemo } from 'react';

export default function Stars({ count = 80 }) {
  const stars = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const isGold = i % 18 === 0;
      const isBright = i % 7 === 0;
      return {
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: isBright ? Math.random() * 1.5 + 1 : Math.random() * 0.8 + 0.3,
        opacity: isBright ? Math.random() * 0.5 + 0.4 : Math.random() * 0.4 + 0.1,
        delay: Math.random() * 5,
        duration: Math.random() * 4 + 2,
        isGold,
      };
    });
  }, [count]);

  return (
    <div className="star-field" aria-hidden="true">
      {stars.map(star => (
        <div
          key={star.id}
          style={{
            position: 'absolute',
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            borderRadius: '50%',
            background: star.isGold ? '#f5c842' : 'white',
            opacity: star.opacity,
            animation: `twinkle ${star.duration}s ease-in-out ${star.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
