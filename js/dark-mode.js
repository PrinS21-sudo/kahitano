(function () {
 
    const body = document.body;
    const toggle = document.getElementById("themeToggle");
    const hero = document.querySelector(".hero-frame");
 
    const reduceMotion =
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
 
 
    
 
    const pageCanvas = document.createElement("canvas");
    pageCanvas.className = "night-stars night-stars--page";
    pageCanvas.setAttribute("aria-hidden", "true");
    body.prepend(pageCanvas);
 
    let heroCanvas = null;
 
    if (hero) {
 
    const tint = document.createElement("div");
    tint.className = "night-tint";
    hero.appendChild(tint);
 
    heroCanvas = document.createElement("canvas");
    heroCanvas.className = "night-stars night-stars--hero";
    heroCanvas.setAttribute("aria-hidden", "true");
    hero.appendChild(heroCanvas);
 
    const orb = document.createElement("div");
    orb.className = "sky-orb";
    orb.setAttribute("aria-hidden", "true");
 
    const rays = Array.from({ length: 16 }, (_, i) =>
        `<line x1="50" y1="${i % 2 ? 12 : 8}" x2="50" y2="${i % 2 ? 17 : 19}" transform="rotate(${i * 22.5} 50 50)"/>`
    ).join("");
 
    orb.innerHTML = `
        <div class="night-moon"></div>
        <div class="day-sun">
            <svg viewBox="0 0 100 100">
                <defs>
                    <radialGradient id="sunGrad" cx="42%" cy="40%" r="62%">
                        <stop offset="0%" stop-color="#fffaf0"/>
                        <stop offset="65%" stop-color="#f8e6c0"/>
                        <stop offset="100%" stop-color="#f1cf94"/>
                    </radialGradient>
                </defs>
                <g class="sun-rays" stroke="#fbeccb" stroke-width="1.3" stroke-linecap="round" opacity=".85">${rays}</g>
                <circle cx="50" cy="50" r="27" fill="none" stroke="#fbeccb" stroke-width=".8" opacity=".45"/>
                <circle cx="50" cy="50" r="19" fill="url(#sunGrad)"/>
            </svg>
        </div>`;
    hero.appendChild(orb);
 
}
 
 
    
 
    function createField(canvas, getSize) {
 
        const ctx = canvas.getContext("2d");
        let w = 0, h = 0, stars = [], shoot = null;
 
        function resize() {
 
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const size = getSize();
 
            w = size.w;
            h = size.h;
 
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            canvas.style.width = w + "px";
            canvas.style.height = h + "px";
 
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
 
            const count = Math.round((w * h) / 9000);
 
            stars = Array.from({ length: count }, () => ({
                x: Math.random() * w,
                y: Math.random() * h,
                r: .4 + Math.random() * 1.2,
                p: Math.random() * Math.PI * 2,
                s: .6 + Math.random() * 1.6,
                warm: Math.random() < .18
            }));
 
        }
 
        function draw(t) {
 
            ctx.clearRect(0, 0, w, h);
 
            for (const s of stars) {
 
                const twinkle = reduceMotion
                    ? .75
                    : .35 + .65 * (.5 + .5 * Math.sin(t * .001 * s.s + s.p));
 
                ctx.globalAlpha = twinkle;
                ctx.fillStyle = s.warm ? "#ffe9c4" : "#dfe8ff";
 
                if (s.r > 1.1) {
                    ctx.shadowColor = s.warm ? "#ffe9c4" : "#bcd0ff";
                    ctx.shadowBlur = 6;
                }
 
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                ctx.fill();
 
                ctx.shadowBlur = 0;
 
            }
 
            ctx.globalAlpha = 1;
 
            
 
            if (!reduceMotion) {
 
                if (!shoot && Math.random() < .0025) {
                    shoot = {
                        x: w * .25 + Math.random() * w * .7,
                        y: Math.random() * h * .35,
                        life: 0
                    };
                }
 
                if (shoot) {
 
                    const x2 = shoot.x + 70;
                    const y2 = shoot.y - 35;
 
                    const grad = ctx.createLinearGradient(shoot.x, shoot.y, x2, y2);
                    grad.addColorStop(0, "rgba(255,255,255,.95)");
                    grad.addColorStop(1, "rgba(255,255,255,0)");
 
                    ctx.strokeStyle = grad;
                    ctx.lineWidth = 1.4;
                    ctx.beginPath();
                    ctx.moveTo(shoot.x, shoot.y);
                    ctx.lineTo(x2, y2);
                    ctx.stroke();
 
                    shoot.x -= 8;
                    shoot.y += 4;
 
                    if (++shoot.life > 45) shoot = null;
 
                }
 
            }
 
        }
 
        return { resize, draw };
 
    }
 
 
    const fields = [
        createField(pageCanvas, () => ({
            w: window.innerWidth,
            h: window.innerHeight
        }))
    ];
 
    if (heroCanvas) {
        fields.push(
            createField(heroCanvas, () => ({
                w: hero.clientWidth,
                h: hero.clientHeight
            }))
        );
    }
 
 
    
 
    let running = false;
 
    function resizeAll() {
        fields.forEach(f => f.resize());
        if (reduceMotion) fields.forEach(f => f.draw(0));
    }
 
    function loop(t) {
 
        if (!running) return;
 
        fields.forEach(f => f.draw(t));
 
        if (!reduceMotion) requestAnimationFrame(loop);
 
    }
 
       let wasDark = body.classList.contains("dark-mode");
    let ready = false;
    let skyTimer;
 
    setTimeout(() => { ready = true; }, 400); 
 
    function playSkyTransition(dark) {
 
        if (!hero) return;
 
        body.classList.remove("sky-to-dark", "sky-to-light");
        void body.offsetWidth; 
        body.classList.add(dark ? "sky-to-dark" : "sky-to-light");
 
        clearTimeout(skyTimer);
        skyTimer = setTimeout(() => {
            body.classList.remove("sky-to-dark", "sky-to-light");
        }, 2400);
 
    }
 
    function apply() {
 
        const dark = body.classList.contains("dark-mode");
 
        toggle?.setAttribute("aria-pressed", String(dark));
 
        if (dark !== wasDark) {
            if (ready) playSkyTransition(dark);
            wasDark = dark;
        }
 
        if (dark && !running) {
 
            running = true;
            resizeAll();
 
            if (!reduceMotion) requestAnimationFrame(loop);
 
        } else if (!dark) {
 
            running = false;
 
        }
 
    }
 
    window.addEventListener("resize", () => {
        if (running) resizeAll();
    });
 
    new MutationObserver(apply).observe(body, {
        attributes: true,
        attributeFilter: ["class"]
    });
 
    apply();
 
})();