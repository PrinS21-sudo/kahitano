const SPREADS = [
  {
    art: { type: "identity", label: "Prince Kyle", c: ["#f87b97", "#f3d6dc", "#1a1114"] },
    text: {
      tag: "Who I am",
      title: "Prince Kyle G. Basco",
      body: "Computer Engineering student (BSCpE2A) and student developer. I like the space where technology, problem-solving and creativity meet.",
      dark: true
    }
  },
  {
    art: { type: "games", label: "Games", c: ["#b7baa9", "#f87b97", "#10120f"] },
    text: {
      tag: "What I build",
      title: "Small games, made to replay",
      body: "Browser games built as web development projects: Color Game, Quiz Game, Flappy Bird and Food Counter.",
      link: { href: "games.html", label: "Play them" },
      dark: false
    }
  },
  {
    art: { type: "tools", label: "Tools", c: ["#f87b97", "#b7baa9", "#17131a"] },
    text: {
      tag: "How I build it",
      title: "HTML, CSS, JavaScript, PHP, MySQL",
      body: "I learn by building, from the page you see to the PHP and MySQL behind it.",
      dark: true
    }
  },
  {
    art: { type: "hello", label: "Say hi", c: ["#f3d6dc", "#f87b97", "#1c1215"] },
    text: {
      tag: "Beyond the code",
      title: "Learning by building",
      body: "I enjoy exploring technology, solving problems, and making each project more polished than the last.",
      dark: false
    }
  }
];
 
(function () {
  const stage = document.getElementById("pbStage");
  const book = document.getElementById("pbBook");
  if (!stage || !book) return;
 
  const W = 336, H = 300, SL = 6, SW = W / SL;      
  const BEND = 6.5;                                
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
 
  /* ---------- page content ---------- */
  const flower = '<svg viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M20 18C16 10 10 8 7 11C4 14 6 20 14 22C7 24 5 30 8 33C11 36 17 33 20 26C23 33 29 36 32 33C35 30 33 24 26 22C34 20 36 14 33 11C30 8 24 10 20 18Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="20" cy="22" r="2.5" fill="currentColor"/></svg>';
  const words = (str, fn) => str.split(" ").map(fn).join(" ");
 
  const MOTIF = {
    identity: () => '<div class="a-rings"><i></i><i></i><i></i></div><div class="a-orbit"></div><div class="a-mono">PK</div>',
    games: () => {
      let t = "";
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++)
        t += `<i class="a-tile${r === 1 && c === 2 ? " odd" : ""}" style="--r:${r};--c:${c}"></i>`;
      return `<div class="a-grid">${t}</div>`;
    },
    tools: () => [["HTML", -76, -62, -9], ["CSS", 56, -72, 7], ["JS", -84, 8, 6], ["PHP", 62, 6, -6], ["SQL", -6, 62, 4]]
      .map((c, i) => `<span class="a-chip" style="--i:${i};--x:${c[1]}px;--y:${c[2]}px;--r:${c[3]}deg">${c[0]}</span>`).join(""),
    hello: () => {
      let p = "";
      for (let k = 0; k < 6; k++) p += `<ellipse class="a-pet" style="--i:${k};--r:${k * 60}deg" cx="50" cy="27" rx="10.5" ry="22"/>`;
      return `<svg class="a-flower" viewBox="0 0 100 100" aria-hidden="true"><g class="a-sway">${p}<circle cx="50" cy="50" r="7" fill="#f2c14e"/></g></svg>`;
    }
  };
 
  const artPage = a => {
    const lab = [...a.label].map((ch, i) => `<span style="--i:${i}">${ch === " " ? "&nbsp;" : ch}</span>`).join("");
    return `<div class="pb-art" style="--a:${a.c[0]};--b:${a.c[1]};--c:${a.c[2]}"><i class="a-blob b1"></i><i class="a-blob b2"></i>${MOTIF[a.type]()}<div class="a-lab">${lab}</div><i class="t-glow"></i></div>`;
  };
 
  const textPage = t => {
    const dk = t.dark;
    const title = words(t.title, (w, i) => `<span class="wm"><span class="w" style="--i:${i}">${w}</span></span>`);
    const body = words(t.body, (w, i) => `<span class="bw" style="--i:${i}">${w}</span>`);
    return `<div class="pb-txt" style="--bg:${dk ? "#11110f" : "#f7f7f4"};--fg:${dk ? "#f8f8f5" : "#090909"};--ac:${dk ? "#f87b97" : "#e0527a"}">
      <i class="t-glow"></i>
      <svg class="t-sprig" viewBox="0 0 120 120" aria-hidden="true"><path class="sp-v" pathLength="1" d="M10 112C38 92 62 62 100 14"/><path class="sp-l" d="M40 86c-14-1-23-11-25-22 14 0 23 8 25 22ZM64 60c14 1 24-8 28-20-14-2-25 6-28 20ZM86 36c10-2 17-10 18-19-10 1-17 8-18 19Z"/></svg>
      <small class="t-tag">${t.tag}</small><h3>${title}</h3><p>${body}</p>
      ${t.link ? `<a class="t-link" href="${t.link.href}" tabindex="-1">${t.link.label}</a>` : ""}</div>`;
  };
 
  const left = (sp, k) => (k % 2 ? textPage(sp.text) : artPage(sp.art));
  const right = (sp, k) => (k % 2 ? artPage(sp.art) : textPage(sp.text));
  const cover = `<div class="pb-cover"><span>${flower}PRINS</span><i class="c-shine"></i></div>`;
 
 
  const lights = '<i class="pb-sh"></i><i class="pb-sp"></i>';
  const flat = (front, back) =>
    `<div class="pb-ff" data-side="f"><div class="pb-pg">${front}</div><i class="pb-gut"></i>${lights}</div>` +
    (back ? `<div class="pb-fb" data-side="b"><div class="pb-pg">${back}</div><i class="pb-gut"></i>${lights}</div>` : "");
  function chain(front, back) {
    let inner = "";
    for (let k = SL - 1; k >= 0; k--) {
      const f = front ? `<div class="pb-part pb-f"><div class="pb-pg" style="left:${-k * SW}px">${front}</div><i class="pb-gut"></i>${lights}</div>` : "";
      const b = back ? `<div class="pb-part pb-b"><div class="pb-pg" style="left:${-(W - (k + 1) * SW)}px">${back}</div><i class="pb-gut"></i>${lights}</div>` : "";
      inner = `<div class="pb-sl" data-k="${k}">${f}${b}${inner}</div>`;
    }
    return inner;
  }
 
 
  const n = SPREADS.length;
  const N = n + 1;                                   
  const leaves = [], flatEl = [], flatOv = [], slices = [], chainOv = [], chainParts = [], casts = [];
 
  book.insertAdjacentHTML("beforeend", '<div class="pb-shadow l"></div><div class="pb-slab l"></div><div class="pb-slab r"></div>');
  const shadowL = book.querySelector(".pb-shadow.l"), slabL = book.querySelector(".pb-slab.l");
  const ov = el => (el ? { sh: el.querySelector(".pb-sh"), sp: el.querySelector(".pb-sp") } : null);
 
  for (let i = 0; i < N; i++) {
    const el = document.createElement("div");
    el.className = "pb-leaf";
    el.innerHTML = flat(i === 0 ? cover : right(SPREADS[i - 1], i - 1), i < n ? left(SPREADS[i], i) : "") +
                   chain(i === 0 ? cover : right(SPREADS[i - 1], i - 1), i < n ? left(SPREADS[i], i) : "");
    book.appendChild(el);
    leaves.push(el);
    const ff = el.querySelector(".pb-ff"), fb = el.querySelector(".pb-fb");
    flatEl.push({ f: ff, b: fb });
    flatOv.push({ f: ov(ff), b: ov(fb) });
    const sl = [...el.querySelectorAll(".pb-sl")];
    slices.push(sl);
    chainOv.push(sl.map(s => ({ f: ov(s.querySelector(":scope>.pb-f")), b: ov(s.querySelector(":scope>.pb-b")) })));
    chainParts.push({ f: [...el.querySelectorAll(".pb-f")], b: [...el.querySelectorAll(".pb-b")] });
    const c = document.createElement("div");
    c.className = "pb-cast";
    book.appendChild(c);
    casts.push(c);
  }
 
  
  const table = stage.querySelector(".pb-table"), desk = stage.querySelector(".pb-desk");
  const pool = document.createElement("div"); pool.className = "pb-pool";
  if (desk) desk.insertAdjacentElement("afterend", pool);
  const glare = document.createElement("div"); glare.className = "pb-glare";
  stage.appendChild(glare);
 
 
  const fitEl = stage.querySelector(".pb-fit");
  if (fitEl) fitEl.setAttribute("aria-hidden", "true");
  stage.insertAdjacentHTML("afterend", '<div class="pb-sr">' + SPREADS.map(sp =>
    `<h3>${sp.text.title}</h3><p>${sp.text.tag}. ${sp.text.body}</p>${sp.text.link ? `<a href="${sp.text.link.href}">${sp.text.link.label}</a>` : ""}`).join("") + "</div>");
 
  
  let s = 0;                                        
  const st = leaves.map(() => ({ a: 0, cur: 0, tw: null, pa: NaN, pb: NaN, pz: NaN, fly: false }));
  const hov = leaves.map(() => null), aut = leaves.map(() => null), autoT = [];
  const tar = { lx: 0, ly: 0, tx: 0, ty: 0, gx: 50, gy: 40 };
  const cur = { lx: 0, ly: 0, tx: 0, ty: 0, gx: 50, gy: 40 };
  let raf = 0, last = 0, needIntro = false, closingAll = false;
 
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = p => (p < 0.5 ? 8 * p ** 4 : 1 - (-2 * p + 2) ** 4 / 2);
  const restZ = (i, flipped) => (flipped ? i + 1 : N - i) * 3;
  const RAD = Math.PI / 180;
 
 
  function lightOf(front, deg) {
    const p = deg * RAD, sn = Math.sin(p), cs = Math.cos(p);
    const il = front ? -0.5 * sn + 0.85 * cs : 0.5 * sn - 0.85 * cs;     // how directly the face points at the lamp
    const r = front ? (-0.27 * sn + 0.9 * cs) / 0.94 : (0.27 * sn - 0.9 * cs) / 0.94;   // how close to a mirror glint
    const r2 = r * r, r4 = r2 * r2, r8 = r4 * r4, r16 = r8 * r8;
    return [Math.min(0.6, Math.max(0, 0.85 - il) * 0.85), 0.3 * r16 * r16];
  }
  
  function paint(o, front, l0, l1) {
    if (!o) return;
    const d = front ? "90deg" : "270deg";
    o.sh.style.background = `linear-gradient(${d},rgba(0,0,0,${l0[0].toFixed(3)}),rgba(0,0,0,${l1[0].toFixed(3)}))`;
    o.sp.style.background = `linear-gradient(${d},rgba(255,255,255,${l0[1].toFixed(3)}),rgba(255,255,255,${l1[1].toFixed(3)}))`;
  }
  function lightFlat(i, a) {
    const front = Math.cos(a * RAD) >= 0, l = lightOf(front, a);
    paint(flatOv[i][front ? "f" : "b"], front, l, l);
  }
  function lightChain(i, a, b) {
    for (let k = 0; k < SL; k++) {
      const front = Math.cos((a + k * b) * RAD) >= 0;
      paint(chainOv[i][k][front ? "f" : "b"], front, lightOf(front, a + (k - 0.5) * b), lightOf(front, a + (k + 0.5) * b));
    }
  }
 
  
  function paintHot(i) {
    ["f", "b"].forEach(sd => {
      const el = flatEl[i][sd];
      if (el) el.classList.toggle("hot", hov[i] === sd || aut[i] === sd);
    });
  }
  function clearHot() {
    leaves.forEach((_, i) => { hov[i] = null; aut[i] = null; clearTimeout(autoT[i]); paintHot(i); });
  }
  
  function introduce() {
    if (reduce) return;
    const vis = [];
    if (s === 0) vis.push([0, "f"]);
    else {
      const k = s - 1;                              
      if (k % 2 === 0) vis.push([s - 1, "b"]); else vis.push([Math.min(s, N - 1), "f"]);
    }
    vis.forEach(([i, sd]) => {
      aut[i] = sd; paintHot(i);
      clearTimeout(autoT[i]);
      autoT[i] = setTimeout(() => { aut[i] = null; paintHot(i); }, 2600);
    });
  }
 
  
  function apply(i, a, b, z, fly) {
    const L = st[i], el = leaves[i];
    if (fly !== L.fly) {
      L.fly = fly;
      el.classList.toggle("fl", fly);
      L.pa = NaN; L.pb = NaN;
      if (!fly) {
        slices[i].forEach((sl, k) => { if (k) sl.style.transform = ""; });
        chainParts[i].f.concat(chainParts[i].b).forEach(p => p.classList.remove("hold"));
      }
    }
    const first = isNaN(L.pa);
    const da = Math.abs(a - L.pa), db = Math.abs(b - L.pb);
    if (first || da > 0.004 || Math.abs(z - L.pz) > 0.01) {
      el.style.transform = `translate3d(0,0,${z.toFixed(2)}px) rotateY(${a.toFixed(3)}deg)`;
      L.pz = z;
    }
    if (first || da > 0.004 || db > 0.004) {
      if (fly) {
        if (first || db > 0.004) {
          const t = `rotateY(${b.toFixed(3)}deg)`;
          for (let k = 1; k < SL; k++) slices[i][k].style.transform = t;
        }
        lightChain(i, a, b);
      } else lightFlat(i, a);
      L.pa = a; L.pb = b;
    }
  }
 
  
  function castShadow(i, a, b, amt) {
    const c = casts[i];
    if (amt < 0.01) { if (c.on) { c.style.opacity = 0; c.on = false; } return; }
    let x = 0, h = 0;
    for (let k = 0; k < SL; k++) {
      const th = (a + k * b) * RAD;
      x += SW * Math.cos(th); h += -SW * Math.sin(th);
    }
    h = Math.max(0, h);
    const dx = h * 0.5, dy = h * 0.22;
    const lo = Math.min(0, x) + dx, hi = Math.max(0, x) + dx;
    c.style.transform = `translate3d(${lo.toFixed(1)}px,${dy.toFixed(1)}px,-1px) scaleX(${(Math.max(6, hi - lo) / W).toFixed(3)})`;
    c.style.opacity = (Math.min(0.55, h / 90 * 0.9) * Math.min(1, amt)).toFixed(3);
    c.on = true;
  }
 
  
  function frame(now) {
    raf = 0;
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
    const k = 1 - Math.exp(-dt * 7);
    let busy = false, anyTween = false;
 
    let moved = false;
    for (const key in cur) {
      const d = tar[key] - cur[key];
      if (Math.abs(d) > 0.004) { cur[key] += d * k; moved = true; }
    }
    if (moved) {
      busy = true;
      if (table) table.style.transform = `rotateX(${(52 + cur.ty).toFixed(3)}deg) rotateZ(${cur.tx.toFixed(3)}deg)`;
      pool.style.transform = `translate3d(${(cur.lx * 18).toFixed(1)}px,${(cur.ly * 14).toFixed(1)}px,-1.9px)`;
      glare.style.transform = `translate3d(${(cur.gx / 100 * stage.clientWidth).toFixed(1)}px,${(cur.gy / 100 * stage.clientHeight).toFixed(1)}px,0)`;
    }
 
    leaves.forEach((el, i) => {
      const L = st[i];
      let tw = L.tw, a = L.a, bend = 0, flying = false;
      let z = restZ(i, L.a <= -90);
      if (tw) {
        const p = (now - tw.t0 - tw.delay) / tw.dur;
        if (p >= 1) { L.a = a = tw.to; L.tw = tw = null; z = restZ(i, a <= -90); }
        else {
          busy = anyTween = true;
          const zf = restZ(i, tw.from <= -90), zt = restZ(i, tw.to <= -90);
          z = zf; a = tw.from;
          if (p > 0) {
            flying = true;
            const e = ease(p);
            a = tw.from + (tw.to - tw.from) * e;
            bend = -Math.sign(tw.to - tw.from) * BEND * Math.sin(Math.PI * e);
            z = zf + (zt - zf) * e;
          }
        }
      }
      L.cur = a;
      apply(i, a, bend, z, flying);
      castShadow(i, a, bend, flying ? 1 : 0);
    });
 
    if (!anyTween && needIntro) { needIntro = false; introduce(); }
    if (busy || needIntro) raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }
 
  
  const hint = document.getElementById("pbHint");
 
  function ui(opening, closing) {
    book.classList.toggle("open", s > 0);
    const show = s > 0 ? 1 : 0;
    if (opening) slabL.style.transition = shadowL.style.transition = "opacity .35s ease .85s";
    else if (closing) slabL.style.transition = shadowL.style.transition = `opacity .2s ease ${s === 0 && closingAll ? 0.85 : 0.55}s`;
    slabL.style.opacity = shadowL.style.opacity = show;
    hint.textContent = s ? "Click a page to turn it. Hover to look closer." : "Click the book to open it.";
  }
 
  function go(d) {
    const prev = s;
    const ns = d > 0 ? (s === n ? 0 : s + 1) : Math.max(0, s - 1);
    if (ns === prev) return;
    s = ns;
    const closing = ns === 0 && prev > 1;
    const now = performance.now();
    leaves.forEach((el, i) => {
      const want = i < s ? -180 : 0, L = st[i];
      const target = L.tw ? L.tw.to : L.a;
      if (target === want) return;
      
      const sd = hov[i] || aut[i];
      if (sd) chainParts[i][sd].forEach(p => p.classList.add("hold"));
      L.tw = { from: L.cur, to: want, t0: now, delay: closing ? (N - 2 - i) * 110 : 0, dur: reduce ? 1 : closing ? 1050 : 1300 };
    });
    clearHot();
    needIntro = true;
    closingAll = closing;
    ui(prev === 0, ns === 0); kick();
  }
 
  leaves.forEach((el, i) => {
    el.addEventListener("click", e => {
      if (e.target.closest("a")) return;             
      go(i < s ? -1 : 1);
    });
    el.addEventListener("pointerover", e => {
      const face = e.target.closest && e.target.closest(".pb-ff,.pb-fb");
      if (!face || st[i].tw || reduce) return;
      const sd = face.dataset.side;
      if (!((sd === "f" && i === s) || (sd === "b" && i === s - 1))) return;   
      if (hov[i] !== sd) { hov[i] = sd; paintHot(i); }
    });
    el.addEventListener("pointerleave", () => {
      if (hov[i] === null) return;
      hov[i] = null; paintHot(i);
    });
  });
 
  stage.addEventListener("keydown", e => {
    if (e.key === "ArrowRight") go(1);
    if (e.key === "ArrowLeft") go(-1);
  });
 
 
  if (!reduce) {
    stage.addEventListener("pointermove", e => {
      const r = stage.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
      tar.lx = nx * 10; tar.ly = ny * 8;
      tar.tx = nx * 3; tar.ty = -ny * 2.2;
      tar.gx = (nx + 0.5) * 100; tar.gy = (ny + 0.5) * 100;
      kick();
    });
    stage.addEventListener("pointerleave", () => {
      tar.lx = tar.ly = tar.tx = tar.ty = 0; tar.gx = 50; tar.gy = 40; kick();
    });
  }
  glare.style.transform = `translate3d(${stage.clientWidth * 0.5}px,${stage.clientHeight * 0.4}px,0)`;
 
  
  function fit() {
    const k = Math.min(stage.clientWidth / 800, stage.clientHeight / 610) * 1.1;
    stage.style.setProperty("--s", k.toFixed(3));
    stage.style.setProperty("--fz", Math.min(1.25, Math.max(1, 0.55 / k)).toFixed(2));   // keep text readable on small screens
  }
  if (window.ResizeObserver) new ResizeObserver(fit).observe(stage);
  else addEventListener("resize", fit);
  fit();
 
  leaves.forEach((el, i) => apply(i, 0, 0, restZ(i, false), false));
  ui();
})();
 