
import React from 'react';

export const Confetti: React.FC = () => {
  // Generate 150 confetti pieces with random properties for more visual impact
  const confettiPieces = Array.from({ length: 150 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    animationDelay: Math.random() * 2,
    animationDuration: 4 + Math.random() * 3, // 4-7 seconds duration
    backgroundColor: `hsl(${Math.random() * 360}, 70%, 60%)`,
    size: 2 + Math.random() * 2 // Varying sizes from 2-4px
  }));

  return (
    <>
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
      
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {confettiPieces.map((piece) => (
          <div
            key={piece.id}
            className="absolute opacity-90"
            style={{
              left: `${piece.left}%`,
              top: '-10px',
              width: `${piece.size}px`,
              height: `${piece.size}px`,
              backgroundColor: piece.backgroundColor,
              animationDelay: `${piece.animationDelay}s`,
              animationDuration: `${piece.animationDuration}s`,
              transform: 'rotate(45deg)',
              animation: `confetti-fall ${piece.animationDuration}s ease-in-out ${piece.animationDelay}s forwards`
            }}
          />
        ))}
      </div>
    </>
  );
};
