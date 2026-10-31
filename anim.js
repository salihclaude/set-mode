'use strict';

/* =========================================================
   SET Mode – Übungsanimationen (eigene SVG-Engine, keine Videos)
   Eine Figur wird pro Frame aus wenigen Zielpunkten berechnet
   (Hüfte, Rumpfwinkel, Fuß- und Handziel) – Knie und Ellbogen
   per Zwei-Knochen-IK. Jede Übung beschreibt nur pose(p) mit
   p = 0 (Startposition) … 1 (Endposition der Bewegung).
   Winkel: 0° = nach unten, 90° = nach vorn (rechts), 180° = oben.
   ========================================================= */

const ANIM = (() => {
  const L = { shin: 46, thigh: 48, torso: 56, neck: 8, head: 11, upper: 31, fore: 29, foot: 16 };
  const G = 190; // Bodenlinie
  const D = [-5, -3]; // Versatz der hinteren Körperseite (Tiefe)
  const COL = {
    near: '#e9ebee', far: '#7b8089', torso: '#c8f542', torsoFar: '#8fae2c', head: '#e9ebee',
    metal: '#9aa0a8', plate: '#2b2e34', plateRim: '#c8f542', frame: '#3a3d44', pad: '#4a4e57', cable: '#7d838c', floor: 'rgba(255,255,255,.12)',
  };

  const rad = d => d * Math.PI / 180;
  const dir = a => [Math.sin(rad(a)), Math.cos(rad(a))];
  const add = (p, v, s = 1) => [p[0] + v[0] * s, p[1] + v[1] * s];
  const lerp = (a, b, p) => a + (b - a) * p;
  const lp = (A, B, p) => [lerp(A[0], B[0], p), lerp(A[1], B[1], p)];
  const angleTo = (A, B) => Math.atan2(B[0] - A[0], B[1] - A[1]) * 180 / Math.PI;
  const f1 = n => n.toFixed(1);

  function ik(A, B, l1, l2, bend) {
    const dx = B[0] - A[0], dy = B[1] - A[1];
    const d = Math.min(l1 + l2 - 0.01, Math.max(Math.abs(l1 - l2) + 0.01, Math.hypot(dx, dy) || 0.01));
    const base = Math.atan2(dy, dx);
    const a = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d))));
    const c1 = [A[0] + l1 * Math.cos(base + a), A[1] + l1 * Math.sin(base + a)];
    const c2 = [A[0] + l1 * Math.cos(base - a), A[1] + l1 * Math.sin(base - a)];
    const score = { fwd: c => c[0], back: c => -c[0], up: c => -c[1], down: c => c[1] }[bend || 'fwd'];
    const J = score(c1) >= score(c2) ? c1 : c2;
    const v = [B[0] - J[0], B[1] - J[1]], n = Math.hypot(v[0], v[1]) || 1;
    return [J, [J[0] + v[0] / n * l2, J[1] + v[1] / n * l2]];
  }

  /* Hilfen für Handziele */
  const down = S => [S[0] + 1, S[1] + 90];                                   // Arm hängt gestreckt
  const hinge = (S, ua, fa) => add(add(S, dir(ua), L.upper), dir(fa), L.fore); // Ellbogenwinkel direkt
  const torsoPt = (S, torso, a, b) => add(add(S, dir(torso), a), dir(torso - 90), b); // a entlang Rumpf, b nach vorn

  /* ---------- Seitenansicht ---------- */
  function solve(P) {
    const J = {};
    J.hip = P.hip;
    J.torso = P.torso;
    J.sh = add(P.hip, dir(P.torso), L.torso);
    const ht = P.torso + (P.headTilt || 0);
    J.neck = add(J.sh, dir(ht), L.neck);
    J.head = add(J.neck, dir(ht), L.head);
    [J.knee, J.ankle] = ik(J.hip, P.ankle, L.thigh, L.shin, P.knee);
    J.toe = add(J.ankle, dir(P.foot ?? 90), L.foot);
    const hand = typeof P.hand === 'function' ? P.hand(J.sh, P.torso) : P.hand;
    [J.elbow, J.hand] = ik(J.sh, hand, L.upper, L.fore, P.elbow || 'down');
    // hintere Seite: gespiegelt per Versatz oder eigene Ziele
    const F = P.far || {};
    J.fhip = add(J.hip, D); J.fsh = add(J.sh, D);
    const fAnkle = F.ankle ? F.ankle : add(P.ankle, D);
    [J.fknee, J.fankle] = ik(J.fhip, fAnkle, L.thigh, L.shin, F.knee || P.knee);
    J.ftoe = add(J.fankle, dir(F.foot ?? P.foot ?? 90), L.foot);
    let fHand = F.hand ? (typeof F.hand === 'function' ? F.hand(J.fsh, P.torso) : F.hand) : add(hand, D);
    [J.felbow, J.fhand] = ik(J.fsh, fHand, L.upper, L.fore, F.elbow || P.elbow || 'down');
    return J;
  }

  const line = (a, b, w, c, extra = '') => `<line x1="${f1(a[0])}" y1="${f1(a[1])}" x2="${f1(b[0])}" y2="${f1(b[1])}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"${extra}/>`;
  const circle = (c, r, fill, extra = '') => `<circle cx="${f1(c[0])}" cy="${f1(c[1])}" r="${r}" fill="${fill}"${extra}/>`;
  const rect = (x, y, w, h, fill, r = 3) => `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" rx="${r}" fill="${fill}"/>`;
  const poly = (pts, fill) => `<polygon points="${pts.map(p => p.map(f1).join(',')).join(' ')}" fill="${fill}"/>`;

  /* Geräte */
  function prop(o) {
    switch (o.t) {
      case 'bench': return rect(o.x, o.y, o.w, o.h || 9, COL.pad, 4) + (o.legs === false ? '' : line([o.x + 10, o.y + (o.h || 9)], [o.x + 10, G], 4, COL.frame) + line([o.x + o.w - 10, o.y + (o.h || 9)], [o.x + o.w - 10, G], 4, COL.frame));
      case 'box': return rect(o.x, o.y, o.w, o.h, o.fill || COL.frame, o.r ?? 4);
      case 'pad': return circle(o.at, o.r || 8, COL.pad);
      case 'line': return line(o.a, o.b, o.w || 5, o.c || COL.frame);
      case 'plate': return circle(o.at, o.r || 18, COL.plate, ` stroke="${COL.plateRim}" stroke-width="2.5"`) + circle(o.at, 3.5, COL.metal);
      case 'db': {
        const a = o.vertical ? 0 : 90, v = dir(a), n = dir(a + 90);
        const p1 = add(o.at, v, -9), p2 = add(o.at, v, 9);
        return line(p1, p2, 3.5, COL.metal) + line(add(p1, n, -6), add(p1, n, 6), 7, COL.plate) + line(add(p2, n, -6), add(p2, n, 6), 7, COL.plate);
      }
      case 'cable': return line(o.from, o.to, 1.6, COL.cable) + circle(o.from, 5, COL.frame, ` stroke="${COL.cable}" stroke-width="1.5"`);
      case 'handle': return circle(o.at, 4, COL.metal);
      case 'rope': return line(o.at, add(o.at, [0, 9]), 4, COL.cable);
      default: return '';
    }
  }

  function drawSide(spec, p) {
    const P = spec.pose(p);
    const J = solve(P);
    const props = spec.props ? spec.props(J, p, P) : [];
    const back = props.filter(o => !o.front), front = props.filter(o => o.front);
    let s = line([10, G], [310, G], 2, COL.floor);
    s += back.map(prop).join('');
    // hintere Gliedmaßen
    s += line(J.fhip, J.fknee, 12, COL.far) + line(J.fknee, J.fankle, 10, COL.far) + line(J.fankle, J.ftoe, 7, COL.far);
    s += line(J.fsh, J.felbow, 9, COL.far) + line(J.felbow, J.fhand, 8, COL.far);
    // Rumpf, Kopf
    s += line(J.hip, J.sh, 21, COL.torso);
    s += line(J.sh, J.neck, 8, COL.near);
    s += circle(J.head, L.head, COL.head);
    // vordere Gliedmaßen
    s += line(J.hip, J.knee, 13, COL.near) + line(J.knee, J.ankle, 11, COL.near) + line(J.ankle, J.toe, 8, COL.near);
    s += front.map(prop).join('');
    s += line(J.sh, J.elbow, 10, COL.near) + line(J.elbow, J.hand, 9, COL.near) + circle(J.hand, 4.6, COL.near);
    s += (spec.handProps ? spec.handProps(J, p, P) : []).map(prop).join('');
    return s;
  }

  /* ---------- Frontansicht (z. B. Seitheben) ---------- */
  function drawFront(spec, p) {
    const P = spec.pose(p);
    const cx = 160, hipY = 98, shY = 44, sw = 22;
    let s = line([10, G], [310, G], 2, COL.floor);
    s += (spec.props ? spec.props(P, p) : []).map(prop).join('');
    s += line([cx - 9, hipY], [cx - 12, G - 2], 13, COL.near) + line([cx + 9, hipY], [cx + 12, G - 2], 13, COL.near);
    s += poly([[cx - sw, shY - 2], [cx + sw, shY - 2], [cx + 13, hipY + 4], [cx - 13, hipY + 4]], COL.torso);
    s += line([cx, shY - 2], [cx, shY - 12], 8, COL.near) + circle([cx, shY - 24], L.head, COL.head);
    for (const side of [-1, 1]) {
      const S = [cx + side * sw, shY];
      const E = add(S, dir(side * P.arm), L.upper);
      const H = add(E, dir(side * (P.arm + (P.bend || 0))), L.fore);
      s += line(S, E, 10, COL.near) + line(E, H, 9, COL.near) + circle(H, 4.6, COL.near);
      (spec.handProps ? spec.handProps(H, side, P) : []).forEach(o => { s += prop(o); });
    }
    return s;
  }

  /* ---------- Draufsicht (Flys) ---------- */
  function drawTop(spec, p) {
    const P = spec.pose(p);
    const cx = 160, cy = 120, sw = 30;
    let s = (spec.props ? spec.props(P, p) : []).map(prop).join('');
    s += `<ellipse cx="${cx}" cy="${cy + 4}" rx="${sw + 6}" ry="17" fill="${COL.torso}"/>`;
    for (const side of [-1, 1]) {
      const S = [cx + side * sw, cy];
      const ang = rad(P.arm), v1 = [side * Math.sin(ang), -Math.cos(ang)];
      const ang2 = rad(P.arm - (P.bend ?? 18)), v2 = [side * Math.sin(ang2), -Math.cos(ang2)];
      const E = add(S, v1, 46), H = add(E, v2, 42);
      s += line(S, E, 11, COL.near) + line(E, H, 10, COL.near) + circle(H, 5, COL.near);
      (spec.handProps ? spec.handProps(H, side, P) : []).forEach(o => { s += prop(o); });
    }
    s += circle([cx, cy + 2], 13, COL.head) + circle([cx, cy - 12], 3.5, COL.head);
    return s;
  }

  /* =========================================================
     Übungen
     ========================================================= */
  const S = {};
  const STAND = { hip: [148, 98], torso: 180, ankle: [150, G] };
  const plateAt = (J, r = 18) => [{ t: 'plate', at: J.hand, r, front: true }];
  const dbAt = (J, vertical) => [{ t: 'db', at: J.hand, vertical }];
  const seat = (x, y, w = 50) => ({ t: 'box', x, y, w, h: 10 });
  const post = (x, y1, y2) => ({ t: 'line', a: [x, y1], b: [x, y2], w: 6 });

  // --- Beine ---
  S.sq_bb = {
    pose: p => ({ hip: lp([147, 99], [112, 150], p), torso: lerp(178, 140, p), ankle: [150, G], knee: 'fwd',
      hand: (Sh, tr) => torsoPt(Sh, tr, -2, -3), elbow: 'back' }),
    props: J => [{ t: 'plate', at: torsoPt(J.sh, J.torso, 1, -8), r: 21 }],
  };
  S.goblet = {
    pose: p => ({ hip: lp([147, 99], [118, 152], p), torso: lerp(179, 158, p), ankle: [150, G],
      hand: (Sh, tr) => torsoPt(Sh, tr, -14, 16), elbow: 'down' }),
    handProps: J => dbAt(J, true),
  };
  S.hack = {
    pose: p => ({ hip: lp([150, 100], [118, 148], p), torso: lerp(170, 160, p), ankle: [160, 186], foot: 80,
      hand: (Sh, tr) => torsoPt(Sh, tr, -4, 6), elbow: 'down' }),
    props: J => [{ t: 'line', a: add(add(J.hip, dir(J.torso - 90), -13), dir(J.torso), -6), b: add(add(J.sh, dir(J.torso - 90), -13), dir(J.torso), 14), w: 11, c: COL.pad },
      { t: 'box', x: 120, y: 186, w: 70, h: 6 }, { t: 'line', a: add(J.hip, dir(J.torso), -30), b: [72, G], w: 5 }],
  };
  S.legpress = {
    pose: p => ({ hip: [150, 142], torso: -125, ankle: lp([216, 74], [186, 106], p), knee: 'up', foot: 225,
      hand: [160, 152], elbow: 'down', headTilt: 20 }),
    props: J => [{ t: 'line', a: [96, 104], b: [146, 150], w: 12, c: COL.pad }, { t: 'box', x: 132, y: 146, w: 46, h: 10, fill: COL.pad },
      { t: 'line', a: [168, 126], b: [262, 25], w: 6 }, post(150, 156, G),
      { t: 'line', a: add(J.ankle, dir(225), 26), b: add(J.ankle, dir(45), 10), w: 7, c: COL.metal, front: true }],
  };
  S.dl = {
    pose: p => ({ hip: lp([116, 128], [147, 98], p), torso: lerp(126, 179, p), ankle: [150, G], hand: down }),
    handProps: J => [{ t: 'plate', at: J.hand, r: 21 }],
  };
  const rdl = (p, v) => ({ hip: lp([147, 98], [116, 106], p), torso: lerp(179, 110, p), ankle: [150, G], hand: down, ...v });
  S.rdl_bb = { pose: p => rdl(p), handProps: J => plateAt(J) };
  S.rdl_db = { pose: p => rdl(p), handProps: J => dbAt(J) };
  S.sl_rdl = {
    pose: p => {
      const P = rdl(p);
      P.far = { ankle: add(P.hip, dir(lerp(0, P.torso - 180, p)), 90), knee: 'down', foot: lerp(90, P.torso - 90, p) };
      return P;
    },
    handProps: J => dbAt(J),
  };
  S.hyper = {
    pose: p => ({ hip: [160, 112], torso: lerp(30, 136, p), ankle: add([160, 112], dir(-42), 93), knee: 'down', foot: 230,
      hand: (Sh, tr) => torsoPt(Sh, tr, -12, 9), elbow: 'down' }),
    props: () => [{ t: 'pad', at: [167, 121], r: 9 }, { t: 'pad', at: [93, 186], r: 6 }, { t: 'line', a: [167, 121], b: [130, G], w: 6 }, { t: 'line', a: [93, 186], b: [130, 170], w: 5 }],
  };
  const thrust = (p) => {
    const Sh = [104, 121], a = lerp(40, 90, p);
    return { hip: add(Sh, dir(a), L.torso), torso: a + 180, ankle: [206, G], knee: 'up', foot: 90, headTilt: lerp(-10, -45, p) };
  };
  S.hipthrust_bb = {
    pose: p => ({ ...thrust(p), hand: (Sh, tr) => torsoPt(Sh, tr, -50, 10), elbow: 'up' }),
    props: J => [{ t: 'bench', x: 50, y: 124, w: 58, h: 12 }, { t: 'plate', at: add(J.hip, [0, -14]), r: 19, front: true }],
  };
  S.hipthrust_db = {
    pose: S.hipthrust_bb.pose,
    props: J => [{ t: 'bench', x: 50, y: 124, w: 58, h: 12 }, { t: 'db', at: add(J.hip, [0, -12]), front: true }],
  };
  S.kickback = {
    pose: p => ({ hip: [150, 99], torso: 168, ankle: add([150, 99], dir(lerp(-2, -40, p)), 93), foot: lerp(90, 30, p),
      far: { ankle: [152, G] }, hand: [196, 92], elbow: 'down' }),
    props: J => [post(204, 40, G), { t: 'cable', from: [60, 182], to: J.ankle }],
  };
  S.lunge_db = {
    pose: p => ({ hip: lp([146, 102], [146, 143], p), torso: 180, ankle: [182, G], knee: 'fwd',
      far: { ankle: [106, 187], knee: 'down', foot: lerp(110, 140, p) }, hand: down }),
    handProps: J => dbAt(J),
  };
  S.bss = {
    pose: p => ({ hip: lp([140, 100], [138, 142], p), torso: lerp(180, 172, p), ankle: [176, G], knee: 'fwd',
      far: { ankle: [88, 132], knee: 'down', foot: 270 }, hand: down }),
    props: () => [{ t: 'bench', x: 40, y: 136, w: 60, h: 10 }],
    handProps: J => dbAt(J),
  };
  S.legext = {
    pose: p => ({ hip: [140, 140], torso: 190, ankle: add([188, 140], dir(lerp(4, 90, p)), L.shin), knee: 'up', foot: lerp(80, 170, p),
      hand: [128, 154], elbow: 'back' }),
    props: J => [seat(112, 146, 66), { t: 'line', a: [104, 146], b: [96, 80], w: 11, c: COL.pad }, post(150, 156, G),
      { t: 'pad', at: add(J.ankle, [3, 6]), r: 7, front: true }, { t: 'line', a: [186, 142], b: add(J.ankle, [3, 6]), w: 4, c: COL.metal }],
  };
  S.legcurl_l = {
    pose: p => ({ hip: [150, 140], torso: -90, ankle: add([198, 140], dir(lerp(90, 188, p)), L.shin), knee: 'down', foot: lerp(0, -90, p),
      hand: [76, 152], elbow: 'down', headTilt: 10 }),
    props: J => [{ t: 'bench', x: 64, y: 148, w: 160, h: 10 }, { t: 'pad', at: add(J.ankle, [0, -8]), r: 7, front: true }],
  };
  S.legcurl_s = {
    pose: p => ({ hip: [140, 140], torso: 192, ankle: add([187, 130], dir(lerp(88, -18, p)), L.shin), knee: 'up', foot: lerp(170, 70, p),
      hand: [128, 154], elbow: 'back' }),
    props: J => [seat(112, 146, 70), { t: 'line', a: [104, 146], b: [96, 80], w: 11, c: COL.pad }, post(150, 156, G),
      { t: 'pad', at: [176, 126], r: 7, front: true }, { t: 'pad', at: add(J.ankle, [8, 2]), r: 7, front: true }],
  };
  const calf = (p, hand) => {
    const toe = [170, 182], fa = lerp(110, 52, p), ankle = add(toe, dir(fa), -L.foot);
    return { hip: [ankle[0] - 2, ankle[1] - 93], torso: 180, ankle, foot: fa, hand, elbow: 'down' };
  };
  S.calf_m = {
    pose: p => calf(p, (Sh, tr) => torsoPt(Sh, tr, -2, 6)),
    props: J => [{ t: 'box', x: 150, y: 182, w: 50, h: 8 }, { t: 'box', x: J.sh[0] - 14, y: J.sh[1] - 9, w: 30, h: 7, fill: COL.pad }, post(205, 20, G)],
  };
  S.calf_db = { pose: p => calf(p, down), props: () => [{ t: 'box', x: 150, y: 182, w: 50, h: 8 }], handProps: J => dbAt(J) };

  // --- Brust ---
  const benchLie = (p, top, bottom, v) => ({ hip: [178, 128], torso: -90, ankle: [214, G], knee: 'up', foot: 90,
    hand: lp(top, bottom, p), elbow: 'down', ...v });
  const flatBench = () => [{ t: 'bench', x: 82, y: 136, w: 120, h: 10 }];
  S.bench_bb = { pose: p => benchLie(p, [124, 70], [128, 116]), props: flatBench, handProps: J => [{ t: 'plate', at: J.hand, r: 17 }] };
  S.bench_db = { pose: p => benchLie(p, [124, 70], [132, 118]), props: flatBench, handProps: J => dbAt(J) };
  S.chestpress = {
    pose: p => ({ hip: [120, 140], torso: 188, ankle: [168, G], knee: 'fwd', hand: lp([140, 94], [174, 90], p), elbow: 'back' }),
    props: () => [seat(94, 146, 54), { t: 'line', a: [90, 146], b: [84, 60], w: 11, c: COL.pad }, post(120, 156, G)],
    handProps: J => [{ t: 'handle', at: J.hand }, { t: 'line', a: J.hand, b: [J.hand[0] + 8, 40], w: 4, c: COL.metal }],
  };
  S.pushup = {
    pose: p => {
      const ankle = [258, 184], b = lerp(23, 9, p), u = [-Math.cos(rad(b)), -Math.sin(rad(b))];
      const sh = add(ankle, u, 150), hip = add(ankle, u, 94);
      return { hip, torso: angleTo(hip, sh), ankle, foot: 40, hand: [116, 188], elbow: 'fwd', headTilt: -5 };
    },
  };
  const incline = (p, v) => ({ hip: [180, 140], torso: -122, ankle: [214, G], knee: 'up', hand: lp([132, 54], [138, 100], p), elbow: 'down', ...v });
  const inclBench = () => [{ t: 'line', a: [182, 150], b: [118, 112], w: 11, c: COL.pad }, seat(160, 146, 40), post(176, 156, G)];
  S.incl_db = { pose: p => incline(p), props: inclBench, handProps: J => dbAt(J) };
  S.incl_bb = { pose: p => incline(p), props: inclBench, handProps: J => [{ t: 'plate', at: J.hand, r: 17 }] };
  S.incl_m = { pose: p => incline(p), props: inclBench, handProps: J => [{ t: 'handle', at: J.hand }, { t: 'line', a: J.hand, b: [J.hand[0] + 30, J.hand[1] + 40], w: 4, c: COL.metal }] };
  // Draufsicht: arm = Winkel von vorn (0°) zur Seite (90°)
  S.fly_m = { view: 'top', pose: p => ({ arm: lerp(84, 16, p) }), handProps: H => [{ t: 'handle', at: H }],
    props: () => [{ t: 'box', x: 118, y: 140, w: 84, h: 52, fill: COL.pad, r: 10 }] };
  S.fly_c = { view: 'top', pose: p => ({ arm: lerp(86, 14, p) }), handProps: (H, side) => [{ t: 'cable', from: [side < 0 ? 22 : 298, 128], to: H }] };
  S.fly_db = { view: 'top', pose: p => ({ arm: lerp(86, 10, p) }), handProps: H => [{ t: 'db', at: H, vertical: true }],
    props: () => [{ t: 'box', x: 128, y: 96, w: 64, h: 110, fill: COL.pad, r: 8 }] };

  // --- Schultern ---
  const press = (p, v) => ({ ...STAND, hand: (Sh, tr) => torsoPt(Sh, tr, lerp(-3, 59, p), lerp(15, 4, p)), elbow: 'down', ...v });
  S.ohp_bb = { pose: p => press(p), handProps: J => [{ t: 'plate', at: J.hand, r: 16 }] };
  S.ohp_db = {
    pose: p => press(p, { hip: [140, 140], ankle: [184, G], knee: 'fwd' }),
    props: () => [seat(112, 146, 52), { t: 'line', a: [110, 146], b: [116, 50], w: 11, c: COL.pad }, post(138, 156, G)],
    handProps: J => dbAt(J),
  };
  S.ohp_m = {
    pose: p => press(p, { hip: [140, 140], ankle: [184, G], knee: 'fwd' }),
    props: () => [seat(112, 146, 52), { t: 'line', a: [110, 146], b: [116, 50], w: 11, c: COL.pad }, post(138, 156, G)],
    handProps: J => [{ t: 'handle', at: J.hand }, { t: 'line', a: J.hand, b: [J.hand[0] + 34, J.hand[1]], w: 4, c: COL.metal }],
  };
  S.lat_raise = { view: 'front', pose: p => ({ arm: lerp(10, 86, p), bend: 8 }), handProps: H => [{ t: 'db', at: H, vertical: true }] };
  S.lat_raise_c = { view: 'front', pose: p => ({ arm: lerp(12, 86, p), bend: 6 }),
    handProps: (H, side) => side > 0 ? [{ t: 'cable', from: [96, 184], to: H }] : [] };
  S.lat_raise_m = { view: 'front', pose: p => ({ arm: lerp(14, 86, p), bend: 10 }),
    handProps: H => [{ t: 'handle', at: H }], props: () => [{ t: 'box', x: 135, y: 98, w: 50, h: 10, fill: COL.pad }] };
  S.facepull = {
    pose: p => ({ ...STAND, torso: 184, hand: lp([226, 56], [176, 34], p), elbow: 'up' }),
    props: J => [post(298, 10, G), { t: 'cable', from: [292, 48], to: J.hand }],
    handProps: J => [{ t: 'rope', at: J.hand }],
  };
  S.revfly_m = { view: 'top', pose: p => ({ arm: lerp(12, 88, p), bend: 4 }), handProps: H => [{ t: 'handle', at: H }],
    props: () => [{ t: 'box', x: 118, y: 76, w: 84, h: 22, fill: COL.pad, r: 8 }] };
  S.revfly_db = { view: 'top', pose: p => ({ arm: lerp(10, 86, p), bend: 6 }), handProps: H => [{ t: 'db', at: H, vertical: true }] };

  // --- Rücken ---
  const rowBent = (p, v) => ({ hip: [118, 106], torso: 112, ankle: [150, G], knee: 'fwd',
    hand: (Sh, tr) => lp(down(Sh), torsoPt(Sh, tr, -36, 10), p), elbow: 'up', ...v });
  S.row_bb = { pose: p => rowBent(p), handProps: J => [{ t: 'plate', at: J.hand, r: 17 }] };
  S.row_c = {
    pose: p => ({ hip: [120, 162], torso: lerp(168, 186, p), ankle: [206, 150], knee: 'up', foot: 170, hand: lp([214, 118], [150, 128], p), elbow: 'back' }),
    props: J => [{ t: 'box', x: 90, y: 168, w: 80, h: 8 }, { t: 'box', x: 210, y: 128, w: 8, h: 40 }, { t: 'cable', from: [296, 140], to: J.hand }],
    handProps: J => [{ t: 'handle', at: J.hand }],
  };
  S.row_db = {
    pose: p => ({ hip: [100, 118], torso: 108, ankle: [118, G], knee: 'fwd',
      hand: (Sh, tr) => lp(down(Sh), torsoPt(Sh, tr, -30, 6), p), elbow: 'up',
      far: { ankle: [62, 148], knee: 'down', foot: 270, hand: [166, 150], elbow: 'back' } }),
    props: () => [{ t: 'bench', x: 50, y: 150, w: 130, h: 10 }],
    handProps: J => dbAt(J),
  };
  S.row_m = {
    pose: p => ({ hip: [120, 150], torso: 162, ankle: [170, G], knee: 'fwd', hand: lp([196, 108], [150, 108], p), elbow: 'back' }),
    props: J => [seat(94, 156, 54), post(120, 166, G), { t: 'line', a: add(J.sh, [14, 6]), b: add(J.hip, [22, -20]), w: 10, c: COL.pad, front: false }],
    handProps: J => [{ t: 'handle', at: J.hand }, { t: 'line', a: J.hand, b: [J.hand[0] + 50, J.hand[1]], w: 4, c: COL.metal }],
  };
  const pulldown = (p, v) => ({ hip: [150, 150], torso: lerp(184, 196, p), ankle: [194, G], knee: 'fwd', hand: lp([158, 30], [166, 84], p), elbow: 'down', ...v });
  const pdProps = J => [seat(122, 156, 56), post(148, 166, G), { t: 'pad', at: [184, 136], r: 8, front: true }, { t: 'cable', from: [160, 6], to: J.hand }];
  S.latpd = { pose: p => pulldown(p), props: pdProps, handProps: J => [{ t: 'handle', at: J.hand }] };
  S.latpd_n = { pose: p => pulldown(p, { hand: lp([166, 32], [176, 90], p) }), props: pdProps, handProps: J => [{ t: 'handle', at: J.hand }] };
  S.pullup = {
    scale: 0.8,
    pose: p => { const hip = lp([150, 140], [150, 104], p); return { hip, torso: 180, ankle: add(hip, [-4, 91]), knee: 'fwd', foot: 120, hand: [152, 22], elbow: 'fwd' }; },
    props: () => [{ t: 'line', a: [110, 22], b: [200, 22], w: 5, c: COL.metal }, post(110, 22, 236)],
  };
  S.pullover_db = { pose: p => benchLie(p, [124, 70], [66, 116], { elbow: 'up' }), props: flatBench, handProps: J => dbAt(J, true) };

  // --- Arme ---
  const elbowSide = (Sh, fa, ua = 3) => hinge(Sh, ua, fa);
  S.curl_db = { pose: p => ({ ...STAND, hand: Sh => elbowSide(Sh, lerp(4, 152, p)) }), handProps: J => dbAt(J) };
  S.hammer = { pose: S.curl_db.pose, handProps: J => dbAt(J, true) };
  S.curl_c = { pose: S.curl_db.pose, props: J => [post(230, 140, G), { t: 'cable', from: [226, 182], to: J.hand }], handProps: J => [{ t: 'handle', at: J.hand }] };
  S.pushdown = {
    pose: p => ({ ...STAND, hand: Sh => elbowSide(Sh, lerp(140, 12, p), 6) }),
    props: J => [post(214, 10, G), { t: 'cable', from: [208, 16], to: J.hand }], handProps: J => [{ t: 'rope', at: J.hand }],
  };
  S.oh_tri_c = {
    pose: p => ({ hip: [140, 100], torso: 158, ankle: [160, G], knee: 'fwd', far: { ankle: [118, G] }, hand: Sh => hinge(Sh, 158, lerp(-20, 156, p)), elbow: 'up' }),
    props: J => [post(34, 60, G), { t: 'cable', from: [40, 96], to: J.hand }], handProps: J => [{ t: 'rope', at: J.hand }],
  };
  S.oh_tri_db = {
    pose: p => ({ hip: [140, 140], torso: 182, ankle: [184, G], knee: 'fwd', hand: Sh => hinge(Sh, 172, lerp(-12, 174, p)), elbow: 'up' }),
    props: () => [seat(112, 146, 52), post(138, 156, G)], handProps: J => dbAt(J, true),
  };
  S.kick_tri = {
    pose: p => ({ hip: [122, 108], torso: 116, ankle: [150, G], knee: 'fwd', hand: Sh => hinge(Sh, -62, lerp(4, -66, p)), elbow: 'up' }),
    handProps: J => dbAt(J, true),
  };

  // --- Bauch ---
  S.cable_crunch = {
    pose: p => ({ hip: [150, 142], torso: lerp(174, 102, p), ankle: [96, 188], knee: 'down', foot: 270, headTilt: lerp(0, -25, p),
      hand: (Sh, tr) => torsoPt(Sh, tr, 12, 9), elbow: 'fwd' }),
    props: J => [post(188, 0, G), { t: 'cable', from: [184, 8], to: J.hand }], handProps: J => [{ t: 'rope', at: J.hand }],
  };
  S.leg_raise = {
    scale: 0.8,
    pose: p => ({ hip: [150, 145], torso: lerp(180, 192, p), ankle: add([150, 145], dir(lerp(-3, 92, p)), 92), knee: 'fwd', foot: lerp(80, 180, p), hand: [152, 24], elbow: 'fwd' }),
    props: () => [{ t: 'line', a: [110, 24], b: [200, 24], w: 5, c: COL.metal }, post(110, 24, 236)],
  };
  S.db_crunch = {
    pose: p => ({ hip: [176, 180], torso: lerp(-90, -122, p), ankle: [214, 187], knee: 'up', foot: 90, headTilt: lerp(0, -20, p),
      hand: (Sh, tr) => torsoPt(Sh, tr, -8, 12), elbow: 'up' }),
    handProps: J => dbAt(J, true),
  };
  S.deadbug = {
    pose: p => ({ hip: [176, 180], torso: -90, ankle: [222, 132], knee: 'up', foot: 0,
      hand: lp([120, 120], [64, 176], p), elbow: 'up',
      far: { ankle: lp([217, 129], [266, 172], p), knee: 'up', foot: 90, hand: [115, 117] } }),
  };

  // --- Cardio (zyklisch) ---
  const walk = (p, v) => {
    const ph = p * Math.PI * 2;
    const step = (q) => [150 + 26 * Math.sin(q), G - Math.max(0, 9 * Math.cos(q))];
    return { hip: [149, 100 + 2 * Math.cos(2 * ph)], torso: 176, ankle: step(ph), foot: 90 + 12 * Math.cos(ph),
      far: { ankle: step(ph + Math.PI), hand: Sh => hinge(Sh, -24 * Math.sin(ph), -24 * Math.sin(ph) + 60) },
      hand: Sh => hinge(Sh, 24 * Math.sin(ph), 24 * Math.sin(ph) + 60), elbow: 'fwd', ...v };
  };
  S.c_walk = { cyclic: true, pose: walk };
  S.c_tread = { cyclic: true, pose: walk, props: () => [{ t: 'box', x: 60, y: 186, w: 190, h: 8, fill: COL.pad }, { t: 'line', a: [246, 186], b: [258, 80], w: 6 }, { t: 'line', a: [258, 80], b: [232, 80], w: 5 }] };
  S.c_cross = {
    cyclic: true,
    pose: p => {
      const ph = p * Math.PI * 2, foot = q => [150 + 22 * Math.cos(q), 176 + 7 * Math.sin(q)], hand = q => [196 + 14 * Math.cos(q), 98 + 3 * Math.sin(q)];
      return { hip: [150, 88 + 3 * Math.sin(ph)], torso: 178, ankle: foot(ph), foot: 90, hand: hand(ph + Math.PI), elbow: 'down',
        far: { ankle: foot(ph + Math.PI), hand: hand(ph) } };
    },
    props: J => [{ t: 'line', a: [100, G], b: [250, G], w: 7 }, { t: 'line', a: [240, G], b: [214, 70], w: 6 }, { t: 'line', a: J.hand, b: [210, 160], w: 4, c: COL.metal }],
  };
  S.c_bike = {
    cyclic: true,
    pose: p => {
      const ph = p * Math.PI * 2, c = [184, 166], ped = q => [c[0] + 16 * Math.cos(q), c[1] + 16 * Math.sin(q)];
      return { hip: [142, 116], torso: 152, ankle: ped(ph), knee: 'fwd', foot: 100, hand: [212, 98], elbow: 'down',
        far: { ankle: ped(ph + Math.PI) } };
    },
    props: () => [{ t: 'box', x: 124, y: 120, w: 34, h: 8, fill: COL.pad }, { t: 'line', a: [142, 128], b: [184, 166], w: 6 }, { t: 'line', a: [184, 166], b: [214, 100], w: 6 },
      { t: 'line', a: [214, 100], b: [222, 96], w: 5 }, { t: 'line', a: [110, G], b: [250, G], w: 7 }, { t: 'line', a: [184, 166], b: [184, G], w: 6 }, { t: 'pad', at: [184, 166], r: 5 }],
  };

  /* =========================================================
     Player
     ========================================================= */
  const VIEW = { side: drawSide, front: drawFront, top: drawTop };
  const TIMING = [['start', 550], ['exec', 1150], ['end', 500], ['exec', 1450]]; // Start halten, hoch, Ende halten, zurück
  const REPS = 3;
  const ease = x => 0.5 - 0.5 * Math.cos(Math.PI * x);

  function frame(spec, p) {
    let body = (VIEW[spec.view || 'side'])(spec, p);
    if (spec.scale) {
      const s = spec.scale;
      body = `<g transform="translate(${f1(160 * (1 - s))} 4) scale(${s})">${body.replace(line([10, G], [310, G], 2, COL.floor), '')}</g>` + line([10, 194], [310, 194], 2, COL.floor);
    }
    return `<svg viewBox="0 0 320 200" class="anim-svg" aria-hidden="true">${body}</svg>`;
  }

  let current = null;

  function mount(host, id) {
    stop();
    const spec = S[id];
    if (!spec || !host) return false;
    const stage = host.querySelector('.anim-stage');
    const state = { host, spec, stage, raf: 0, t0: 0, playing: false };
    current = state;
    draw(state, 0, 'start');
    return true;
  }

  function draw(st, p, phase) {
    st.stage.innerHTML = frame(st.spec, p);
    st.host.querySelectorAll('[data-phase]').forEach(b => b.classList.toggle('on', b.dataset.phase === phase));
    st.host.classList.toggle('playing', st.playing);
  }

  function tick(now) {
    const st = current;
    if (!st || !st.playing) return;
    const el = now - st.t0;
    if (st.spec.cyclic) {
      const cyc = 1300, total = cyc * 4;
      if (el >= total) { st.playing = false; draw(st, 0, 'exec'); return; }
      draw(st, (el % cyc) / cyc, 'exec');
    } else {
      const rep = TIMING.reduce((s, x) => s + x[1], 0);
      if (el >= rep * REPS) { st.playing = false; draw(st, 0, 'start'); return; }
      let r = el % rep, p = 0, phase = 'start';
      for (let i = 0; i < TIMING.length; i++) {
        const [ph, d] = TIMING[i];
        if (r <= d) {
          phase = ph;
          p = i === 0 ? 0 : i === 1 ? ease(r / d) : i === 2 ? 1 : 1 - ease(r / d);
          break;
        }
        r -= d;
      }
      draw(st, p, phase);
    }
    st.raf = requestAnimationFrame(tick);
  }

  function toggle() {
    const st = current;
    if (!st) return;
    if (st.playing) { st.playing = false; cancelAnimationFrame(st.raf); draw(st, 0, st.spec.cyclic ? 'exec' : 'start'); return; }
    st.playing = true;
    st.t0 = performance.now();
    st.host.classList.add('started');
    st.raf = requestAnimationFrame(tick);
  }

  function showPhase(phase) {
    const st = current;
    if (!st) return;
    st.playing = false; cancelAnimationFrame(st.raf);
    st.host.classList.add('started');
    draw(st, phase === 'start' ? 0 : phase === 'end' ? 1 : 0.5, phase);
  }

  function stop() {
    if (current) { current.playing = false; cancelAnimationFrame(current.raf); }
    current = null;
  }

  return { has: id => !!S[id], cyclic: id => !!S[id]?.cyclic, view: id => S[id]?.view || 'side', mount, toggle, showPhase, stop, frame: (id, p) => S[id] ? frame(S[id], p) : '', ids: () => Object.keys(S) };
})();
