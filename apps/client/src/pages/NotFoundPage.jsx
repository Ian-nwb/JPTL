import React, { useEffect, useRef } from 'react';

export const NotFoundPage = ({ onNavigate = () => { } }) => {
  const canvasRef = useRef(null);

  /* ── Animated particle background ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let particles = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    class Particle {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;
        this.radius = Math.random() * 1.5 + 0.5;
        this.opacity = Math.random() * 0.5 + 0.1;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99, 102, 241, ${this.opacity})`;
        ctx.fill();
      }
    }

    for (let i = 0; i < 60; i++) particles.push(new Particle());

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.update();
        p.draw();
      });
      // Draw connecting lines between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(99, 102, 241, ${0.08 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-[#08080C] text-white overflow-hidden select-none font-sans flex items-center justify-center">
      {/* Particle canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 0 }}
      />

      {/* Ambient radial glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.06) 40%, transparent 70%)',
          zIndex: 0,
        }}
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-6 text-center max-w-lg">
        {/* Giant 404 with glitch / gradient */}
        <div className="relative">
          <h1
            className="text-[8rem] sm:text-[9rem] font-extrabold leading-none tracking-tighter font-grotesk"
            style={{
              background:
                'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 40%, #EC4899 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              filter: 'drop-shadow(0 0 60px rgba(99, 102, 241, 0.25))',
              animation: 'float404 6s ease-in-out infinite',
            }}
          >
            404
          </h1>

          {/* Glitch echo layers */}
          <h1
            aria-hidden="true"
            className="absolute inset-0 text-[8rem] sm:text-[9rem] font-extrabold leading-none tracking-tighter font-grotesk pointer-events-none"
            style={{
              background:
                'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 40%, #EC4899 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              opacity: 0.3,
              animation: 'glitch1 4s ease-in-out infinite',
            }}
          >
            404
          </h1>
          <h1
            aria-hidden="true"
            className="absolute inset-0 text-[8rem] sm:text-[9rem] font-extrabold leading-none tracking-tighter font-grotesk pointer-events-none"
            style={{
              background:
                'linear-gradient(135deg, #EC4899 0%, #3B82F6 50%, #8B5CF6 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              opacity: 0.2,
              animation: 'glitch2 4s ease-in-out infinite',
            }}
          >
            404
          </h1>
        </div>

        {/* Status badge */}
        <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          Page Not Found
        </span>

        {/* Description */}
        <p className="text-base sm:text-lg text-slate-400 font-sans leading-relaxed max-w-md">
          The page you're looking for doesn't exist or has been moved.
          <br />
          Let's get you back on track.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mt-2">
          <button
            onClick={() => onNavigate('/')}
            className="group relative px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-sm font-bold transition-all duration-200 btn-press cursor-pointer overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              <svg className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Go Home
            </span>
            {/* Shine sweep on hover */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </button>

          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white font-mono text-sm font-bold transition-all duration-200 btn-press cursor-pointer"
          >
            Go Back
          </button>
        </div>

        {/* Decorative path readout */}
        <div className="mt-6 px-4 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
          <p className="text-xs font-mono text-slate-600">
            <span className="text-slate-500">path</span>
            <span className="text-slate-700 mx-1">→</span>
            <span className="text-rose-400/80">{window.location.pathname}</span>
          </p>
        </div>
      </div>

      {/* CSS Keyframes */}
      <style>{`
        @keyframes float404 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes glitch1 {
          0%, 100% { transform: translate(0, 0); }
          20% { transform: translate(-2px, 1px); }
          40% { transform: translate(2px, -1px); }
          60% { transform: translate(-1px, 2px); }
          80% { transform: translate(1px, -2px); }
        }
        @keyframes glitch2 {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(2px, 2px); }
          50% { transform: translate(-2px, -1px); }
          75% { transform: translate(1px, -2px); }
        }
      `}</style>
    </div>
  );
};
