const ICONS = {
  brain: '<path d="M12 5a3 3 0 0 0-5.8-1.1 3.4 3.4 0 0 0-2.1 5.4A3.8 3.8 0 0 0 5 16.4 3.6 3.6 0 0 0 12 18V5Zm0 0a3 3 0 0 1 5.8-1.1 3.4 3.4 0 0 1 2.1 5.4 3.8 3.8 0 0 1-.9 7.1A3.6 3.6 0 0 1 12 18M5 16.4c0-1.5 1-2.8 2.4-3.2M19 16.4c0-1.5-1-2.8-2.4-3.2M6.2 3.9c-.3 2 1 3.9 2.7 4.4m8.9-4.4c.3 2-1 3.9-2.7 4.4"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.2"/><rect x="14" y="3" width="7" height="7" rx="1.2"/><rect x="3" y="14" width="7" height="7" rx="1.2"/><rect x="14" y="14" width="7" height="7" rx="1.2"/>',
  graph: '<path d="M4 3v17h17M8 15l4-4 3 2 5-6m-4 0h4v4"/>',
  book: '<path d="M12 6C9 3 5 3 2 4v15c3-1 7-1 10 2 3-3 7-3 10-2V4c-3-1-7-1-10 2Zm0 0v15"/>',
  user: '<circle cx="12" cy="7" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2H4Z"/>',
  hash: '<path d="m10 3-4 18M18 3l-4 18M4 9h17M3 15h17"/>',
  buildings: '<path d="M4 21V9l8-5 8 5v12M2 21h20M9 21v-6h6v6m-5-11h4"/>',
  cards: '<rect x="6" y="5" width="11" height="15" rx="2.3" transform="rotate(-13 11 13)"/><path d="m14 4 3-1a2 2 0 0 1 2.5 1.5l3 12a2 2 0 0 1-1.5 2.5l-2 .5m-10-7 2-3 3 2-2 3-3-2Z"/>',
  numbers: '<path d="M4 7h4m-2-2v4m5 1a2 2 0 1 1 3-1l-3 3h4m2 2h3l-2 2 2 1v2h-3m-13 0h5"/>',
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>', back: '<path d="M20 12H5m6-6-6 6 6 6"/>',
  bolt: '<path d="m13 2-8 12h6l-1 8 9-12h-6l1-8Z"/>',
  flame: '<path d="M13 3c0 5 6 5 6 12a7 7 0 1 1-14 0c0-4 2-6 4-8 0 3 1 4 2 4 2-2 2-5 2-8Z"/><path d="M12 20a3 3 0 0 0 3-3c0-1-.5-2-1.5-3-1 2-3 2-3 4 0 1 .6 2 1.5 2Z"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 1 1 8 0v3m-4 4v3"/>',
  check: '<path d="m5 12 4 4 10-10"/>', close: '<path d="m6 6 12 12M6 18 18 6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
  home: '<path d="m3 10 9-7 9 7v10H3V10Zm7 10v-6h4v6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', refresh: '<path d="M20 7v5h-5M4 17v-5h5m-4-1a7 7 0 0 1 12-4l3 5M4 12l3 5a7 7 0 0 0 12-4"/>',
  trophy: '<path d="M7 3h10v8a5 5 0 0 1-10 0V3Zm0 2H3v3a4 4 0 0 0 4 4m10-7h4v3a4 4 0 0 1-4 4m-5 4v4m-4 0h8"/>'
};
export const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.brain}</svg>`;
export const neon = (name, color = 'violet') => `<span class="neon ${color}">${icon(name)}</span>`;
export const brand = () => `<a class="brand" href="#inicio"><span class="brand-mark">${icon('brain')}</span>Mnemônix</a>`;

export function drawOrbit(canvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const scale = Math.min(devicePixelRatio || 1, 2);
  canvas.width = width * scale;
  canvas.height = height * scale;
  ctx.scale(scale, scale);
  const cx = width * .51;
  const cy = height * .5;
  const radius = Math.min(width * .31, height * .40);
  const track = (tilt, phase) => {
    const points = [];
    for (let i = 0; i <= 112; i++) {
      const t = i / 112 * Math.PI * 2;
      const x = Math.cos(t) * radius * 1.21;
      const y = Math.sin(t) * radius * .43;
      points.push([cx + x * Math.cos(tilt) - y * Math.sin(tilt), cy + x * Math.sin(tilt) + y * Math.cos(tilt), Math.sin(t + phase)]);
    }
    return points;
  };
  for (const [j, tilt] of [-.38, .43, 1.24, 2.18, 2.82].entries()) {
    const points = track(tilt, j * .5);
    for (let i = 1; i < points.length; i++) {
      const [x, y, z] = points[i];
      ctx.beginPath();
      ctx.moveTo(...points[i - 1].slice(0, 2));
      ctx.lineTo(x, y);
      ctx.lineWidth = 1.05 + Math.max(0, z) * .7;
      ctx.strokeStyle = `rgba(${j === 2 ? '149,236,224' : '190,144,255'}, ${.25 + Math.max(0, z) * .63})`;
      ctx.shadowBlur = Math.max(0, z) * 12;
      ctx.shadowColor = j === 2 ? '#7cfada' : '#b996ff';
      ctx.stroke();
    }
    for (const i of [4 + j * 5, 46 + j * 3, 80 + j * 2]) {
      const [x, y] = points[i];
      ctx.beginPath();
      ctx.shadowBlur = 14;
      ctx.fillStyle = j === 2 ? '#baffec' : '#edddff';
      ctx.arc(x, y, 1.7 + j % 3 * .6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const light = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * .67);
  light.addColorStop(0, '#eee3ffdd');
  light.addColorStop(.28, '#bd8df77c');
  light.addColorStop(1, '#9a63e000');
  ctx.shadowBlur = 0;
  ctx.fillStyle = light;
  ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
  for (let i = 0; i < 34; i++) {
    const angle = i * 2.39996323;
    const distance = radius * (.27 + .78 * ((i * 31 % 37) / 37));
    const x = cx + Math.cos(angle) * distance;
    const y = cy + Math.sin(angle) * distance;
    ctx.beginPath();
    ctx.fillStyle = i % 4 === 0 ? '#beffdfba' : '#d2b6ff99';
    ctx.arc(x, y, i % 5 === 0 ? 1.3 : .65, 0, Math.PI * 2);
    ctx.fill();
  }
}
