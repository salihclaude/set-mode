// SET Mode – Anatomie-Prüfung der Animationen: node tools/anim-check.js
// Prüft für jede Übung (Seitenansicht) über die ganze Bewegung:
//  - Knie/Ellbogen beugen nur in die natürliche Richtung (keine Überstreckung, kein Umklappen)
//  - Hüft- und Schulterwinkel im menschlichen Bewegungsumfang
//  - Füße erreichen ihr Ziel (Pedal, Plattform, Boden)
//  - keine Gliedmaßen unter dem Boden
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const ctx = { console, Math, performance: { now: () => 0 } };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'anim.js'), 'utf8') + ';this.ANIM = ANIM;', ctx);
const A = ctx.ANIM;

const ang = (P, Q) => Math.atan2(Q[0] - P[0], Q[1] - P[1]) * 180 / Math.PI;
const norm = a => { a = ((a % 360) + 360) % 360; return a > 180 ? a - 360 : a; };
const dist = (P, Q) => Math.hypot(P[0] - Q[0], P[1] - Q[1]);

// Gelenkgrenzen (Grad). Knie: Oberschenkel→Schienbein, Ellbogen: Oberarm→Unterarm.
const LIM = { knee: [-4, 160], elbow: [-4, 155], hip: [-35, 145], shoulder: [-70, 185] };

function check(id) {
  const out = [];
  for (let k = 0; k <= 40; k++) {
    const p = k / 40, J = A._joints(id, p);
    if (!J) return null;
    const down = J.torso - 180; // Rumpfachse nach unten = „neutral“ für Bein und Arm
    const sides = [['', J.hip, J.knee, J.ankle, J.sh, J.elbow, J.hand, J.tHand, J.tAnkle],
      ['hinten ', J.fhip, J.fknee, J.fankle, J.fsh, J.felbow, J.fhand, J.tfHand, J.tfAnkle]];
    for (const [s, H, K, An, Sh, E, Ha, tH, tA] of sides) {
      const th = ang(H, K), sh = ang(K, An), ua = ang(Sh, E), fa = ang(E, Ha);
      const v = {
        knee: norm(th - sh), elbow: norm(fa - ua),
        hip: norm(th - down), shoulder: norm(ua - down),
      };
      for (const [j, [lo, hi]] of Object.entries(LIM)) if (!(J.armsOut && (j === 'elbow' || j === 'shoulder')) && (v[j] < lo || v[j] > hi)) out.push(`p=${p.toFixed(2)} ${s}${j} ${v[j].toFixed(0)}°`);
      if (tA && dist(An, tA) > 5) out.push(`p=${p.toFixed(2)} ${s}Fuß erreicht Ziel nicht (${dist(An, tA).toFixed(0)})`);
      for (const P of [K, An, E, Ha]) if ((P[1] * (J.scale || 1) + (J.scale ? 4 : 0)) > 192) out.push(`p=${p.toFixed(2)} ${s}unter dem Boden`);
    }
  }
  return out;
}

let bad = 0;
for (const id of A.ids()) {
  const r = check(id);
  if (r === null) continue;
  // gleiche Meldungen zusammenfassen
  const kinds = {};
  r.forEach(m => { const key = m.replace(/^p=\S+ /, '').replace(/-?\d+°|\(\d+\)/, '#'); (kinds[key] = kinds[key] || []).push(m); });
  if (r.length) { bad++; console.log(`✗ ${id}: ` + Object.values(kinds).map(l => `${l[0]}${l.length > 1 ? ` (+${l.length - 1})` : ''}`).join(' | ')); }
}
console.log(bad ? `\n${bad} Übungen mit Auffälligkeiten` : '✓ alle Animationen anatomisch plausibel');
process.exitCode = bad ? 1 : 0;
