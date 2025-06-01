
import React from 'react';

export const Confetti: React.FC = () => {
  // Generate 60 confetti pieces with random properties
  const confettiPieces = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    animationDelay: Math.random() * 3,
    animationDuration: 3 + Math.random() * 2,
    backgroundColor: `hsl(${Math.random() * 360}, 70%, 60%)`
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
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
      
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {confettiPieces.map((piece) => (
          <div
            key={piece.id}
            className="absolute w-2 h-2 opacity-90"
            style={{
              left: `${piece.left}%`,
              top: '-10px',
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
