/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        space: {
          void:  '#030a1a',
          deep:  '#060f28',
          navy:  '#0c1d45',
          mid:   '#162850',
          light: '#1e3a6e',
        },
        gold: {
          dim:    '#7a5c10',
          muted:  '#b8880f',
          bright: '#f5c842',
          glow:   '#fde68a',
        },
        clinical: {
          void:  '#020e0c',
          deep:  '#041e1b',
          teal:  '#1de9b6',
          light: '#b2f5e8',
        },
      },
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
        body:    ['Inter', 'sans-serif'],
        syne:    ['Syne', 'sans-serif'],
      },
      backgroundImage: {
        'nebula':          'radial-gradient(ellipse 80% 60% at 50% 0%, #0c1d45 0%, #030a1a 70%)',
        'space-radial':    'radial-gradient(ellipse at top, #0d1533 0%, #030a1a 50%, #000 100%)',
        'gold-beam':       'linear-gradient(135deg, #b8880f 0%, #f5c842 50%, #b8880f 100%)',
        'clinical-beam':   'linear-gradient(135deg, #0d9488 0%, #1de9b6 50%, #0d9488 100%)',
        'card-surface':    'linear-gradient(145deg, rgba(22,40,80,0.6) 0%, rgba(12,29,69,0.4) 100%)',
        'medical-surface': 'linear-gradient(145deg, rgba(4,30,27,0.8) 0%, rgba(2,14,12,0.6) 100%)',
        /* ── Aceternity-style structural textures ── */
        'dot-grid':        'radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)',
        'line-grid':       'linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)',
        'hero-glow':       'radial-gradient(ellipse 60% 50% at 15% 50%, rgba(245,200,66,0.06) 0%, transparent 70%)',
        'stat-glow':       'radial-gradient(ellipse at center, rgba(245,200,66,0.1) 0%, transparent 65%)',
      },
      backgroundSize: {
        'dot-32':  '32px 32px',
        'dot-40':  '40px 40px',
        'line-48': '48px 48px',
        'line-64': '64px 64px',
      },
      boxShadow: {
        'glow-gold':     '0 0 24px rgba(245,200,66,0.25), 0 0 8px rgba(245,200,66,0.15)',
        'glow-gold-lg':  '0 0 48px rgba(245,200,66,0.3), 0 0 16px rgba(245,200,66,0.2)',
        'glow-teal':     '0 0 24px rgba(29,233,182,0.25), 0 0 8px rgba(29,233,182,0.1)',
        'glow-blue':     '0 0 24px rgba(59,130,246,0.2)',
        'glass':         '0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
        'glass-medical': '0 4px 24px rgba(0,0,0,0.6), inset 0 1px 0 rgba(29,233,182,0.08)',
        'card-hover':    '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.08)',
        'card-gold':     '0 0 0 1px rgba(245,200,66,0.28), 0 12px 48px rgba(0,0,0,0.65), 0 0 36px rgba(245,200,66,0.07)',
        'card-teal':     '0 0 0 1px rgba(29,233,182,0.28), 0 12px 48px rgba(0,0,0,0.65), 0 0 36px rgba(29,233,182,0.07)',
      },
      animation: {
        'twinkle':       'twinkle 3s ease-in-out infinite',
        'ring-glow':     'ring-glow 3s ease-in-out infinite',
        'slide-in-left': 'slide-in-left 0.4s cubic-bezier(0.16,1,0.3,1)',
        'shimmer':       'shimmer 2.4s ease-in-out infinite',
      },
      keyframes: {
        twinkle: {
          '0%, 100%': { opacity: '0.9' },
          '50%':      { opacity: '0.15' },
        },
        'ring-glow': {
          '0%, 100%': { filter: 'drop-shadow(0 0 6px rgba(245,200,66,0.4))' },
          '50%':      { filter: 'drop-shadow(0 0 14px rgba(245,200,66,0.7))' },
        },
        'slide-in-left': {
          from: { transform: 'translateX(-100%)', opacity: '0' },
          to:   { transform: 'translateX(0)',     opacity: '1' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
      },
    },
  },
  plugins: [],
}
