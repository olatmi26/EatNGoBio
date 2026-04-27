import{u as g,d as x,j as e,H as f}from"./app-pFgRHxbr.js";/* empty css            */function u(){const{isDark:l,toggleTheme:s}=g(),{data:i,setData:n,post:d,processing:o,errors:t}=x({email:"",password:"",remember:!1}),b=r=>{r.preventDefault(),d(route("login"))},c=[{icon:"ri-shield-check-line",title:"Zero-Trust Verification",desc:"Multi-layer biometric auth with liveness detection & anti-spoofing.",color:"#34d399",bg:"rgba(52,211,153,0.12)"},{icon:"ri-pulse-line",title:"Real-Time Sync Engine",desc:"Sub-second attendance propagation across all connected terminals.",color:"#38bdf8",bg:"rgba(56,189,248,0.12)"},{icon:"ri-map-pin-2-line",title:"Multi-Site Orchestration",desc:"Unlimited branch control with geo-fenced policy enforcement.",color:"#a78bfa",bg:"rgba(167,139,250,0.12)"},{icon:"ri-brain-line",title:"Workforce Intelligence",desc:"Payroll-ready analytics, shift patterns & exception flagging.",color:"#fbbf24",bg:"rgba(251,191,36,0.12)"}],a=l;return e.jsxs(e.Fragment,{children:[e.jsx(f,{title:"Sign In — EatNGoBio"}),e.jsx("style",{children:`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
                html, body, #app { height: 100%; overflow: hidden; }

                /* ══════════════════════════════════════════
                   ROOT & UNIFIED CANVAS
                ══════════════════════════════════════════ */
                .lr-root {
                    height: 100vh; width: 100vw; overflow: hidden;
                    display: flex; position: relative;
                    font-family: 'Plus Jakarta Sans', sans-serif;
                }

                /* ── Deep base ── */
                .lr-base {
                    position: absolute; inset: 0; z-index: 0;
                    transition: background 0.5s;
                }
                .lr-base.dk { background: #03080f; }
                .lr-base.lt { background: #eef7f2; }

                /* ── Aurora sweep — full-width gradient that drifts left→right ── */
                .aurora {
                    position: absolute; inset: 0; z-index: 1; pointer-events: none;
                    background: linear-gradient(
                        105deg,
                        transparent 0%,
                        rgba(22,163,74,0.18) 20%,
                        rgba(8,145,178,0.14) 40%,
                        rgba(124,58,237,0.12) 60%,
                        rgba(22,163,74,0.16) 80%,
                        transparent 100%
                    );
                    background-size: 200% 100%;
                    animation: auroraDrift 10s ease-in-out infinite alternate;
                    mix-blend-mode: screen;
                }
                .aurora.lt {
                    background: linear-gradient(
                        105deg,
                        transparent 0%,
                        rgba(22,163,74,0.22) 20%,
                        rgba(8,145,178,0.16) 40%,
                        rgba(124,58,237,0.14) 60%,
                        rgba(22,163,74,0.20) 80%,
                        transparent 100%
                    );
                    background-size: 200% 100%;
                    mix-blend-mode: multiply;
                }
                @keyframes auroraDrift {
                    0%   { background-position: 0% 50%; }
                    100% { background-position: 100% 50%; }
                }

                /* ── Large traversing orbs (cross the full canvas left↔right) ── */
                .orb-layer { position: absolute; inset: 0; z-index: 2; pointer-events: none; overflow: hidden; }

                .orb {
                    position: absolute; border-radius: 50%;
                    filter: blur(60px); pointer-events: none;
                }

                /* Main traversing orb — green, crosses left to right */
                .orb-traverse-1 {
                    width: 560px; height: 560px;
                    top: -80px; left: -280px;
                    animation: traverse1 18s ease-in-out infinite alternate;
                }
                .orb-traverse-1.dk { background: radial-gradient(circle, rgba(22,163,74,0.55) 0%, rgba(22,163,74,0.12) 55%, transparent 75%); }
                .orb-traverse-1.lt { background: radial-gradient(circle, rgba(22,163,74,0.40) 0%, rgba(22,163,74,0.10) 55%, transparent 75%); }
                @keyframes traverse1 {
                    0%   { transform: translate(0vw, 0px) scale(1); }
                    50%  { transform: translate(55vw, 80px) scale(1.15); }
                    100% { transform: translate(100vw, -40px) scale(0.9); }
                }

                /* Secondary traversing orb — cyan, reverse direction */
                .orb-traverse-2 {
                    width: 480px; height: 480px;
                    bottom: -60px; right: -240px;
                    animation: traverse2 22s ease-in-out infinite alternate;
                }
                .orb-traverse-2.dk { background: radial-gradient(circle, rgba(8,145,178,0.50) 0%, rgba(8,145,178,0.10) 55%, transparent 75%); }
                .orb-traverse-2.lt { background: radial-gradient(circle, rgba(8,145,178,0.35) 0%, rgba(8,145,178,0.08) 55%, transparent 75%); }
                @keyframes traverse2 {
                    0%   { transform: translate(0vw, 0px) scale(1); }
                    50%  { transform: translate(-50vw, -60px) scale(1.2); }
                    100% { transform: translate(-95vw, 30px) scale(0.85); }
                }

                /* Third orb — violet, mid-screen floater */
                .orb-traverse-3 {
                    width: 380px; height: 380px;
                    top: 30%; left: 20%;
                    animation: traverse3 26s ease-in-out infinite alternate;
                }
                .orb-traverse-3.dk { background: radial-gradient(circle, rgba(124,58,237,0.38) 0%, rgba(124,58,237,0.08) 55%, transparent 75%); }
                .orb-traverse-3.lt { background: radial-gradient(circle, rgba(124,58,237,0.25) 0%, rgba(124,58,237,0.06) 55%, transparent 75%); }
                @keyframes traverse3 {
                    0%   { transform: translate(0px, 0px) scale(1); }
                    33%  { transform: translate(40vw, -40px) scale(1.1); }
                    66%  { transform: translate(80vw, 60px) scale(0.9); }
                    100% { transform: translate(30vw, -80px) scale(1.05); }
                }

                /* ── Glossy bubble particles ── */
                .bubble-layer { position: absolute; inset: 0; z-index: 3; pointer-events: none; overflow: hidden; }

                .bubble {
                    position: absolute; border-radius: 50%;
                    animation: bubbleRise linear infinite;
                }
                /* Each bubble uses a glossy sphere effect */
                .bubble::before {
                    content: ''; position: absolute; inset: 0; border-radius: 50%;
                    background: radial-gradient(circle at 35% 30%, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.3) 30%, transparent 65%);
                }
                .bubble::after {
                    content: ''; position: absolute; inset: 0; border-radius: 50%;
                    background: radial-gradient(circle at 65% 72%, rgba(255,255,255,0.25) 0%, transparent 50%);
                }

                .b1  { width:18px;height:18px; left:4%;   animation-duration:14s; animation-delay:0s;    }
                .b2  { width:11px;height:11px; left:12%;  animation-duration:18s; animation-delay:-3s;   }
                .b3  { width:24px;height:24px; left:22%;  animation-duration:12s; animation-delay:-6s;   }
                .b4  { width:8px; height:8px;  left:31%;  animation-duration:20s; animation-delay:-1s;   }
                .b5  { width:30px;height:30px; left:40%;  animation-duration:16s; animation-delay:-8s;   }
                .b6  { width:14px;height:14px; left:50%;  animation-duration:13s; animation-delay:-4s;   }
                .b7  { width:20px;height:20px; left:60%;  animation-duration:19s; animation-delay:-11s;  }
                .b8  { width:9px; height:9px;  left:68%;  animation-duration:15s; animation-delay:-2s;   }
                .b9  { width:26px;height:26px; left:76%;  animation-duration:11s; animation-delay:-9s;   }
                .b10 { width:13px;height:13px; left:85%;  animation-duration:17s; animation-delay:-5s;   }
                .b11 { width:36px;height:36px; left:92%;  animation-duration:14s; animation-delay:-13s;  }
                .b12 { width:10px;height:10px; left:7%;   animation-duration:21s; animation-delay:-7s;   }
                .b13 { width:22px;height:22px; left:45%;  animation-duration:10s; animation-delay:-15s;  }
                .b14 { width:16px;height:16px; left:55%;  animation-duration:23s; animation-delay:-10s;  }
                .b15 { width:28px;height:28px; left:72%;  animation-duration:16s; animation-delay:-17s;  }

                .bubble.dk { background: radial-gradient(circle at 38% 32%, rgba(52,211,153,0.55), rgba(22,163,74,0.18) 50%, rgba(8,145,178,0.10) 80%); border: 1px solid rgba(52,211,153,0.30); }
                .bubble.lt { background: radial-gradient(circle at 38% 32%, rgba(22,163,74,0.45), rgba(16,185,129,0.15) 50%, rgba(8,145,178,0.08) 80%); border: 1px solid rgba(22,163,74,0.25); }

                /* Every 3rd bubble gets a cyan tint */
                .b3,.b6,.b9,.b12,.b15 { }
                .b3.dk,.b6.dk,.b9.dk,.b12.dk,.b15.dk { background: radial-gradient(circle at 38% 32%, rgba(56,189,248,0.55), rgba(8,145,178,0.18) 50%, rgba(124,58,237,0.10) 80%); border-color: rgba(56,189,248,0.30); }
                .b3.lt,.b6.lt,.b9.lt,.b12.lt,.b15.lt { background: radial-gradient(circle at 38% 32%, rgba(8,145,178,0.40), rgba(56,189,248,0.12) 50%, transparent 80%); border-color: rgba(8,145,178,0.22); }

                /* Every 5th bubble violet */
                .b5.dk,.b10.dk { background: radial-gradient(circle at 38% 32%, rgba(167,139,250,0.55), rgba(124,58,237,0.18) 50%, transparent 80%); border-color: rgba(167,139,250,0.30); }
                .b5.lt,.b10.lt { background: radial-gradient(circle at 38% 32%, rgba(124,58,237,0.38), rgba(167,139,250,0.12) 50%, transparent 80%); border-color: rgba(124,58,237,0.22); }

                @keyframes bubbleRise {
                    0%   { bottom: -60px; opacity: 0; transform: translateX(0px) scale(0.7); }
                    10%  { opacity: 0.9; }
                    50%  { transform: translateX(30px) scale(1); }
                    80%  { opacity: 0.6; }
                    90%  { transform: translateX(-20px) scale(0.95); }
                    100% { bottom: 110vh; opacity: 0; transform: translateX(10px) scale(0.8); }
                }

                /* ── Glossy sheen overlay ── */
                .gloss-sheen {
                    position: absolute; inset: 0; z-index: 4; pointer-events: none;
                    background: linear-gradient(
                        170deg,
                        rgba(255,255,255,0.04) 0%,
                        transparent 40%,
                        rgba(255,255,255,0.02) 60%,
                        transparent 100%
                    );
                }

                /* dot grid on top */
                .lr-dots {
                    position: absolute; inset: 0; z-index: 5; pointer-events: none;
                    background-image: radial-gradient(circle, rgba(255,255,255,0.10) 1px, transparent 1px);
                    background-size: 40px 40px;
                }
                .lr-dots.lt {
                    background-image: radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px);
                }

                /* ══════════════════════════════════════════
                   LAYOUT PANELS
                ══════════════════════════════════════════ */
                .lr-panels {
                    position: relative; z-index: 10;
                    display: flex; width: 100%; height: 100%;
                }

                /* ── LEFT ── */
                .lr-left {
                    display: none; flex-direction: column;
                    width: 50%; height: 100%; padding: 32px 44px;
                    
                    background: transparent;
                }
                @media (min-width: 1024px) { .lr-left { display: flex; } }
                

                /* topbar */
                .tb { display: flex; align-items: center; justify-content: space-between; margin-bottom: 26px; flex-shrink: 0; }

                .logo { display: flex; align-items: center; gap: 10px; }
                .logo-icon {
                    width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
                    display: flex; align-items: center; justify-content: center;
                    background: linear-gradient(140deg,#16a34a,#0d4f22);
                    box-shadow: 0 0 0 1px rgba(255,255,255,0.12), 0 6px 20px rgba(22,163,74,0.45), inset 0 1px 0 rgba(255,255,255,0.3);
                    font-size: 18px; color: #fff; position: relative; overflow: hidden;
                }
                .logo-icon::after {
                    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 50%;
                    background: linear-gradient(180deg, rgba(255,255,255,0.25) 0%, transparent 100%);
                    border-radius: 10px 10px 0 0;
                }
                .logo-name { font-weight: 800; font-size: 15px; letter-spacing: -0.025em; }
                .logo-tag  { font-size: 9.5px; letter-spacing: 0.04em; margin-top: 1px; opacity: 0.5; }

                .theme-btn {
                    width: 34px; height: 34px; border-radius: 9px; border: 1px solid;
                    background: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
                    font-size: 14px; transition: all 0.2s; backdrop-filter: blur(8px);
                }
                .theme-btn:hover { transform: scale(1.1); }
                .theme-btn.dk { border-color: rgba(255,255,255,0.12); color: #94a3b8; background: rgba(255,255,255,0.06); }
                .theme-btn.lt { border-color: rgba(0,0,0,0.08); color: #6b7280; background: rgba(255,255,255,0.5); }

                /* pill */
                .pill {
                    display: inline-flex; align-items: center; gap: 6px;
                    padding: 4px 12px; border-radius: 100px;
                    font-size: 9.5px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
                    margin-bottom: 14px; flex-shrink: 0; align-self: center;
                    backdrop-filter: blur(12px);
                }
                .pill.dk { background: rgba(22,163,74,0.14); border: 1px solid rgba(52,211,153,0.30); color: #4ade80; box-shadow: 0 0 12px rgba(22,163,74,0.20); }
                .pill.lt { background: rgba(220,252,231,0.80); border: 1px solid rgba(187,247,208,0.9); color: #15803d; }
                .pill-dot { width: 6px; height: 6px; border-radius: 50%; background: #16a34a; animation: blink 2.2s ease-in-out infinite; flex-shrink: 0; box-shadow: 0 0 6px #16a34a; }
                @keyframes blink { 0%,100%{opacity:1;transform:scale(1);}50%{opacity:0.35;transform:scale(0.55);} }

                /* hero */
                .hero-title {
                    font-size: clamp(22px, 2.2vw, 32px); font-weight: 800;
                    letter-spacing: -0.035em; line-height: 1.1;
                    margin-bottom: 10px; flex-shrink: 0; text-align: center;
                }
                .hero-title .gr {
                    color: #16a34a;
                    text-shadow: 0 0 30px rgba(22,163,74,0.5);
                }
                .hero-sub { font-size: 12px; line-height: 1.68; max-width: 390px; margin-bottom: 22px; font-weight: 400; flex-shrink: 0; text-align: center; align-self: center; }

                /* feature grid */
                .feat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; flex: 1; min-height: 0; }

                .feat-card {
                    padding: 14px 16px; border-radius: 14px; border: 1px solid;
                    transition: transform 0.22s, box-shadow 0.22s;
                    display: flex; flex-direction: column; gap: 7px;
                    min-height: 0; overflow: hidden; position: relative;
                    backdrop-filter: blur(20px);
                }
                .feat-card::before {
                    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.20), transparent);
                }
                .feat-card:hover { transform: translateY(-2px); }
                .feat-card.dk {
                    background: rgba(255,255,255,0.05);
                    border-color: rgba(255,255,255,0.09);
                    box-shadow: 0 4px 20px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.07);
                }
                .feat-card.dk:hover { box-shadow: 0 8px 30px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.09); }
                .feat-card.lt {
                    background: rgba(255,255,255,0.65);
                    border-color: rgba(255,255,255,0.90);
                    box-shadow: 0 2px 12px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9);
                }
                .feat-card.lt:hover { box-shadow: 0 6px 24px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.9); }

                .feat-icon { width: 32px; height: 32px; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0; position: relative; overflow: hidden; }
                .feat-icon::after { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 50%; background: linear-gradient(180deg,rgba(255,255,255,0.30) 0%,transparent 100%); border-radius: 9px 9px 0 0; }
                .feat-name { font-size: 13px; font-weight: 700; letter-spacing: -0.01em; line-height: 1.25; }
                .feat-desc { font-size: 11.5px; line-height: 1.55; font-weight: 400; }

                /* left footer */
                .lr-lfooter { display: flex; align-items: center; gap: 8px; margin-top: 16px; flex-shrink: 0; }
                .lf-line { flex: 1; height: 1px; }
                .lf-text { font-size: 9px; letter-spacing: 0.08em; white-space: nowrap; text-transform: uppercase; }

                /* ── RIGHT ── */
                .lr-right { flex: 1; display: flex; align-items: center; justify-content: center; padding: 24px 20px; height: 100%; overflow: hidden; background: transparent; }

                .form-shell { width: 100%; max-width: 420px; }

                /* mobile logo */
                .mob-logo { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
                @media(min-width:1024px){ .mob-logo { display: none; } }

                /* ── GLOSSY FORM CARD ── */
                .glass {
                    border-radius: 22px; border: 1px solid;
                    padding: 30px 28px; position: relative; overflow: hidden;
                    transition: all 0.3s; backdrop-filter: blur(40px) saturate(1.8);
                }
                /* top gloss edge */
                .glass::before {
                    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
                    background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.50) 40%, rgba(255,255,255,0.70) 60%, transparent 100%);
                }
                /* inner gloss sheen */
                .glass::after {
                    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 45%;
                    background: linear-gradient(180deg, rgba(255,255,255,0.07) 0%, transparent 100%);
                    pointer-events: none;
                }
                .glass.dk {
                    background: rgba(6,14,26,0.55);
                    border-color: rgba(255,255,255,0.13);
                    box-shadow:
                        0 24px 80px rgba(0,0,0,0.65),
                        0 8px 32px rgba(22,163,74,0.12),
                        inset 0 1px 0 rgba(255,255,255,0.10),
                        inset 0 -1px 0 rgba(0,0,0,0.40);
                }
                .glass.lt {
                    background: rgba(255,255,255,0.75);
                    border-color: rgba(255,255,255,0.95);
                    box-shadow:
                        0 20px 60px rgba(0,0,0,0.25),
                        0 4px 16px rgba(22,163,74,0.08),
                        inset 0 1px 0 rgba(255,255,255,1),
                        inset 0 -1px 0 rgba(0,0,0,0.04);
                }

                .card-eye {
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 9px; font-weight: 500; letter-spacing: 0.16em;
                    text-transform: uppercase; color: #16a34a; margin-bottom: 4px;
                    position: relative; z-index: 1;
                }
                .card-title { font-size: 20px; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 3px; position: relative; z-index: 1; }
                .card-sub   { font-size: 11.5px; margin-bottom: 18px; font-weight: 400; position: relative; z-index: 1; }

                .divider { height: 1px; margin-bottom: 16px; position: relative; z-index: 1; }

                /* fields */
                .field { margin-bottom: 13px; position: relative; z-index: 1; }
                .field-lbl { display: block; font-size: 10px; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; margin-bottom: 6px; }
                .field-wrap { position: relative; }
                .f-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 13px; pointer-events: none; }
                .f-icon.dk { color: rgba(148,163,184,0.7); }
                .f-icon.lt { color: rgba(107,114,128,0.8); }
                .f-input {
                    width: 100%; padding: 10px 12px 10px 36px;
                    font-size: 13px; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 500;
                    border-radius: 10px; border: 1px solid; outline: none;
                    transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
                    backdrop-filter: blur(12px);
                }
                .f-input::placeholder { opacity: 0.30; }
                .f-input.dk {
                    background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.10); color: #f1f5f9;
                    box-shadow: inset 0 1px 0 rgba(255,255,255,0.04), inset 0 -1px 0 rgba(0,0,0,0.20);
                }
                .f-input.dk:focus { border-color: rgba(22,163,74,0.60); box-shadow: 0 0 0 3px rgba(22,163,74,0.12), inset 0 1px 0 rgba(255,255,255,0.06); background: rgba(255,255,255,0.09); }
                .f-input.lt {
                    background: rgba(248,250,252,0.80); border-color: rgba(226,232,240,0.90); color: #0f172a;
                    box-shadow: inset 0 1px 2px rgba(0,0,0,0.04);
                }
                .f-input.lt:focus { border-color: #16a34a; box-shadow: 0 0 0 3px rgba(22,163,74,0.13); background: rgba(255,255,255,0.95); }
                .f-input.err { border-color: #dc2626 !important; }
                .f-err { font-size: 10.5px; color: #ef4444; margin-top: 4px; display: flex; align-items: center; gap: 3px; }

                /* remember row */
                .rem-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; position: relative; z-index: 1; }
                .rem-lbl { display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 11.5px; font-weight: 500; }
                .rem-lbl input { accent-color: #16a34a; width: 13px; height: 13px; cursor: pointer; }
                .fgt-link { font-size: 11.5px; font-weight: 600; color: #16a34a; text-decoration: none; transition: opacity 0.15s; }
                .fgt-link:hover { opacity: 0.7; }

                /* submit */
                .sub-btn {
                    width: 100%; padding: 11px;
                    font-size: 13px; font-weight: 700;
                    font-family: 'Plus Jakarta Sans', sans-serif; letter-spacing: 0.025em;
                    border: none; border-radius: 10px; color: #fff; cursor: pointer;
                    background: linear-gradient(135deg, #16a34a 0%, #0d5c27 100%);
                    box-shadow: 0 4px 18px rgba(22,163,74,0.50), 0 1px 0 rgba(255,255,255,0.25) inset, 0 -1px 0 rgba(0,0,0,0.20) inset;
                    transition: all 0.18s; position: relative; overflow: hidden; z-index: 1;
                }
                /* glossy sheen on button */
                .sub-btn::before {
                    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 50%;
                    background: linear-gradient(180deg, rgba(255,255,255,0.22) 0%, transparent 100%);
                    pointer-events: none;
                }
                .sub-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 26px rgba(22,163,74,0.60), 0 1px 0 rgba(255,255,255,0.25) inset; }
                .sub-btn:active:not(:disabled) { transform: translateY(0); box-shadow: 0 2px 10px rgba(22,163,74,0.35), inset 0 1px 0 rgba(255,255,255,0.15); }
                .sub-btn:disabled { opacity: 0.55; cursor: not-allowed; }

                /* trust row */
                .trust-row { display: flex; align-items: center; justify-content: center; margin-top: 15px; flex-wrap: wrap; position: relative; z-index: 1; }
                .trust-item { display: flex; align-items: center; gap: 4px; font-size: 9.5px; font-weight: 600; letter-spacing: 0.03em; opacity: 0.35; padding: 0 9px; }
                .trust-item + .trust-item { border-left: 1px solid; }
                .trust-item.dk-sep { border-color: rgba(71,85,105,0.6); }
                .trust-item.lt-sep { border-color: rgba(226,232,240,0.8); }

                .card-footer { text-align: center; margin-top: 15px; font-size: 9.5px; font-weight: 500; opacity: 0.25; letter-spacing: 0.05em; }

                /* spinner */
                @keyframes spin { to { transform: rotate(360deg); } }
                .spin { display: inline-block; width: 11px; height: 11px; border: 2px solid rgba(255,255,255,0.30); border-top-color: #fff; border-radius: 50%; animation: spin 0.65s linear infinite; vertical-align: middle; margin-right: 6px; }
            `}),e.jsxs("div",{className:"lr-root",children:[e.jsx("div",{className:`lr-base ${a?"dk":"lt"}`}),e.jsx("div",{className:`aurora ${a?"dk":"lt"}`}),e.jsxs("div",{className:"orb-layer",children:[e.jsx("div",{className:`orb orb-traverse-1 ${a?"dk":"lt"}`}),e.jsx("div",{className:`orb orb-traverse-2 ${a?"dk":"lt"}`}),e.jsx("div",{className:`orb orb-traverse-3 ${a?"dk":"lt"}`})]}),e.jsx("div",{className:"bubble-layer",children:["b1","b2","b3","b4","b5","b6","b7","b8","b9","b10","b11","b12","b13","b14","b15"].map(r=>e.jsx("div",{className:`bubble ${r} ${a?"dk":"lt"}`},r))}),e.jsx("div",{className:"gloss-sheen"}),e.jsx("div",{className:`lr-dots ${a?"":"lt"}`}),e.jsxs("div",{className:"lr-panels",children:[e.jsxs("div",{className:`lr-left ${a?"dk":"lt"}`,children:[e.jsxs("div",{className:"tb",children:[e.jsxs("div",{className:"logo",children:[e.jsx("div",{className:"logo-icon",children:e.jsx("i",{className:"ri-fingerprint-line"})}),e.jsxs("div",{children:[e.jsxs("div",{className:"logo-name",style:{color:a?"#f1f5f9":"#0f172a"},children:["EatNGo",e.jsx("span",{style:{color:"#16a34a"},children:"Bio"})]}),e.jsx("div",{className:"logo-tag",style:{color:a?"#94a3b8":"#64748b"},children:"Enterprise Attendance Platform"})]})]}),e.jsx("button",{className:`theme-btn ${a?"dk":"lt"}`,onClick:s,children:e.jsx("i",{className:a?"ri-sun-line":"ri-moon-line"})})]}),e.jsxs("div",{className:`pill ${a?"dk":"lt"}`,children:[e.jsx("span",{className:"pill-dot"}),"Enterprise Biometric Management"]}),e.jsxs("h1",{className:"hero-title",style:{color:a?"#f1f5f9":"#0f172a"},children:["Attendance Intelligence",e.jsx("br",{}),e.jsx("span",{className:"gr",children:"Built for Scale"})]}),e.jsx("p",{className:"hero-sub",style:{color:a?"#64748b":"#4b5563"},children:"Self-hosted biometric attendance with unlimited terminals, real-time sync, and enterprise policy controls — no seat limits, no third-party licensing."}),e.jsx("div",{className:"feat-grid",children:c.map(r=>e.jsxs("div",{className:`feat-card ${a?"dk":"lt"}`,children:[e.jsx("div",{className:"feat-icon",style:{background:r.bg},children:e.jsx("i",{className:r.icon,style:{color:r.color}})}),e.jsx("div",{className:"feat-name",style:{color:a?"#e2e8f0":"#0f172a"},children:r.title}),e.jsx("div",{className:"feat-desc",style:{color:a?"#64748b":"#6b7280"},children:r.desc})]},r.title))}),e.jsxs("div",{className:"lr-lfooter",children:[e.jsx("div",{className:"lf-line",style:{background:a?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.07)"}}),e.jsx("span",{className:"lf-text",style:{color:a?"#334155":"#94a3b8"},children:"EatNGo Africa · All Rights Reserved"}),e.jsx("div",{className:"lf-line",style:{background:a?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.07)"}})]})]}),e.jsx("div",{className:"lr-right",children:e.jsxs("div",{className:"form-shell",children:[e.jsxs("div",{className:"mob-logo",children:[e.jsxs("div",{className:"logo",children:[e.jsx("div",{className:"logo-icon",children:e.jsx("i",{className:"ri-fingerprint-line"})}),e.jsxs("div",{className:"logo-name",style:{color:a?"#f1f5f9":"#0f172a"},children:["EatNGo",e.jsx("span",{style:{color:"#16a34a"},children:"Bio"})]})]}),e.jsx("button",{className:`theme-btn ${a?"dk":"lt"}`,onClick:s,children:e.jsx("i",{className:a?"ri-sun-line":"ri-moon-line"})})]}),e.jsxs("div",{className:`glass ${a?"dk":"lt"}`,children:[e.jsx("p",{className:"card-eye",children:"— Secure Portal"}),e.jsx("h2",{className:"card-title",style:{color:a?"#f1f5f9":"#0f172a"},children:"Welcome back"}),e.jsx("p",{className:"card-sub",style:{color:a?"#64748b":"#6b7280"},children:"Sign in to your enterprise dashboard"}),e.jsx("div",{className:"divider",style:{background:a?"rgba(255,255,255,0.09)":"#e2e8f0"}}),e.jsxs("form",{onSubmit:b,children:[e.jsxs("div",{className:"field",children:[e.jsx("label",{className:"field-lbl",style:{color:a?"#64748b":"#374151"},children:"Work Email"}),e.jsxs("div",{className:"field-wrap",children:[e.jsx("i",{className:`ri-mail-line f-icon ${a?"dk":"lt"}`}),e.jsx("input",{type:"email",value:i.email,onChange:r=>n("email",r.target.value),placeholder:"you@eatngo-africa.com",className:`f-input ${a?"dk":"lt"} ${t.email?"err":""}`,required:!0})]}),t.email&&e.jsxs("p",{className:"f-err",children:[e.jsx("i",{className:"ri-error-warning-line"}),t.email]})]}),e.jsxs("div",{className:"field",children:[e.jsx("label",{className:"field-lbl",style:{color:a?"#64748b":"#374151"},children:"Password"}),e.jsxs("div",{className:"field-wrap",children:[e.jsx("i",{className:`ri-lock-2-line f-icon ${a?"dk":"lt"}`}),e.jsx("input",{type:"password",value:i.password,onChange:r=>n("password",r.target.value),placeholder:"••••••••••••",className:`f-input ${a?"dk":"lt"} ${t.password?"err":""}`,required:!0})]}),t.password&&e.jsxs("p",{className:"f-err",children:[e.jsx("i",{className:"ri-error-warning-line"}),t.password]})]}),e.jsxs("div",{className:"rem-row",children:[e.jsxs("label",{className:"rem-lbl",style:{color:a?"#94a3b8":"#6b7280"},children:[e.jsx("input",{type:"checkbox",checked:i.remember,onChange:r=>n("remember",r.target.checked)}),"Keep me signed in"]}),e.jsx("a",{href:"#",className:"fgt-link",children:"Forgot password?"})]}),e.jsx("button",{type:"submit",className:"sub-btn",disabled:o,children:o?e.jsxs(e.Fragment,{children:[e.jsx("span",{className:"spin"}),"Authenticating…"]}):e.jsxs(e.Fragment,{children:[e.jsx("i",{className:"ri-shield-check-line",style:{marginRight:6}}),"Secure Sign In"]})})]}),e.jsx("div",{className:"trust-row",children:[{icon:"ri-shield-keyhole-line",label:"AES-256"},{icon:"ri-server-line",label:"Self-Hosted"},{icon:"ri-time-line",label:"99.9% SLA"},{icon:"ri-lock-password-line",label:"SOC-2 Ready"}].map((r,p)=>e.jsxs("div",{className:`trust-item ${p>0?a?"dk-sep":"lt-sep":""}`,style:{color:a?"#94a3b8":"#6b7280"},children:[e.jsx("i",{className:r.icon,style:{fontSize:11}}),r.label]},r.label))})]}),e.jsx("p",{className:"card-footer",style:{color:a?"#475569":"#9ca3af"},children:"EatNGo Biometrics — Enterprise Attendance Platform"})]})})]})]})]})}export{u as default};
