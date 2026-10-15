(function () {
    "use strict";

    
    var BRAND     = "Transporting";               
    var COVER_MS  = { light: 1250, dark: 1350 };   
    var REVEAL_MS = { light: 1500, dark: 1600 };   
    var BLUR_PX   = 3;                             
    var HOLD_MS   = 260;                           
    var FLAG_KEY  = "bloomora-pt";                 

    var reduceMotion = window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var busy = false;
    var state = null;      
    var raf = 0;

    
    function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
    function smooth(a, b, v) { var t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
    function mix(a, b, t) { return a + (b - a) * t; }
    function wrap(v, m) { return ((v % m) + m) % m; }

    function rng(seed) {
        return function () {
            seed |= 0; seed = seed + 0x6D2B79F5 | 0;
            var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }

    function ensureCanvas() {
        var w = window.innerWidth, h = window.innerHeight;
        if (state && state.w === w && state.h === h) return state;
        if (!state) {
            var c = document.createElement("canvas");
            c.setAttribute("aria-hidden", "true");
            c.style.cssText =
                "position:fixed;left:0;top:0;width:100%;height:100%;" +
                "z-index:2147483000;pointer-events:auto;display:block;";
            document.documentElement.appendChild(c);
            state = { c: c, ctx: c.getContext("2d"), w: 0, h: 0, blur: -1 };
        }
        var dpr = clamp(Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(5e6 / (w * h))), 1, 2);
        state.w = w; state.h = h;
        state.c.width = Math.round(w * dpr);
        state.c.height = Math.round(h * dpr);
        state.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        return state;
    }

    function removeCanvas() {
        cancelAnimationFrame(raf);
        if (state && state.c.parentNode) state.c.parentNode.removeChild(state.c);
        state = null;
    }

    
    var THEME = {
        light: {
            base: [255, 232, 238],
            front: {
                body: [[0, [255, 224, 232]], [.35, [255, 237, 241]], [.62, [255, 245, 245]], [1, [255, 228, 234]]],
                lead: [255, 186, 206], trail: [255, 208, 222], rim: [255, 252, 253],
                warm: [250, 198, 214], warmAmt: .45
            },
            back: {
                body: [[0, [255, 192, 208]], [.5, [255, 208, 220]], [1, [255, 198, 212]]],
                lead: [250, 152, 182], trail: [255, 172, 196], rim: [255, 224, 234],
                warm: [246, 174, 198], warmAmt: .30
            }
        },
        dark: {
            base: [9, 42, 50],
            front: {
                body: [[0, [16, 70, 80]], [.40, [10, 50, 60]], [.70, [8, 38, 48]], [1, [6, 30, 40]]],
                lead: [34, 132, 128], trail: [22, 88, 102], rim: [120, 220, 200],
                warm: [3, 18, 28], warmAmt: .55
            },
            back: {
                body: [[0, [26, 120, 118]], [.5, [18, 92, 104]], [1, [14, 76, 96]]],
                lead: [36, 148, 138], trail: [26, 104, 118], rim: [84, 196, 178],
                warm: [8, 40, 58], warmAmt: .30
            }
        }
    };

    var PETAL_COLORS = [
        [[240, 128, 160], [255, 196, 214]],
        [[250, 160, 188], [255, 224, 232]],
        [[255, 244, 247], [250, 190, 208]],
        [[226, 104, 142], [255, 170, 196]],
        [[248, 176, 198], [255, 238, 243]]
    ];

    function gradAt(stops, v) {
        if (v <= stops[0][0]) return stops[0][1];
        for (var i = 1; i < stops.length; i++) {
            if (v <= stops[i][0]) {
                var a = stops[i - 1], b = stops[i], t = (v - a[0]) / (b[0] - a[0]);
                return [mix(a[1][0], b[1][0], t), mix(a[1][1], b[1][1], t), mix(a[1][2], b[1][2], t)];
            }
        }
        return stops[stops.length - 1][1];
    }

    
    function setupScene(w, h, lo) {
        var U = Math.max(w, h * .9);                       
        var F = {
            w: w, h: h, lo: lo, U: U,
            Bw: Math.round(w + U),                         
            ext: Math.round(.3 * U),                       
            f: clamp((lo ? 420 : 620) / h, .28, .62),      
            arch: .07 * U                                  
        };
        F.xStart = -F.ext - .24 * U;                        
        F.xEnd = w + F.Bw + F.ext + .24 * U;                         
        F.xCover = w + .5 * U;                             
        F.sCover = (F.xCover - F.xStart) / (F.xEnd - F.xStart);
        return F;
    }

    
    function edges(F, kind, ny) {
        var back = kind === "back", U = F.U, one = 1 - ny * ny, ph = back ? 1.7 : .4;
        var BwT = back ? F.Bw + 2 * F.ext : F.Bw, k = back ? .12 : .10;
        var wob = Math.sin(ny * 2.2 + ph) * .012 * U + Math.sin(ny * 5.1 + ph * 2.3) * .006 * U;
        var arch = F.arch * (back ? 1.2 : 1);
        return { lead: BwT - k * U + arch * one + wob, trail: k * U - arch * .85 * one + wob * .7 };
    }

    
    function noiseGrid(seed, gw, gh) {
        var r = rng(seed), a = new Float32Array(gw * gh), i;
        for (i = 0; i < a.length; i++) a[i] = r();
        return { a: a, gw: gw };
    }
    function nz(N, ci, cf, ri, rf) {
        var a = N.a, i = ri * N.gw + ci, t = a[i] + (a[i + 1] - a[i]) * cf, j = i + N.gw, u = a[j] + (a[j + 1] - a[j]) * cf;
        return t + (u - t) * rf;
    }

    function bandTexture(F, theme, kind) {
        var TH = THEME[theme][kind], back = kind === "back", U = F.U, h = F.h;
        var BwT = back ? F.Bw + 2 * F.ext : F.Bw, f = back ? F.f * .6 : F.f;
        var tw = Math.ceil(BwT * f), th = Math.ceil(h * f);
        var c = document.createElement("canvas");
        c.width = tw; c.height = th;
        var g = c.getContext("2d"), img = g.createImageData(tw, th), px = img.data;
        var rnd = rng(back ? 11 : 23);
        var feather = (back ? .26 : .18) * U;

        
        var cw1 = .7 * U, ch1 = .3 * U, cw2 = .25 * U, ch2 = .1 * U;
        var N1 = noiseGrid(back ? 31 : 41, Math.ceil(BwT / cw1) + 3, Math.ceil(h / ch1) + 3);
        var N2 = noiseGrid(back ? 32 : 42, Math.ceil(BwT / cw2) + 3, Math.ceil(h / ch2) + 3);

        var Xc = new Float32Array(tw), cr = new Float32Array(tw), cg = new Float32Array(tw), cb = new Float32Array(tw);
        var ci1 = new Int32Array(tw), cf1 = new Float32Array(tw), ci2 = new Int32Array(tw), cf2 = new Float32Array(tw), x, y, p = 0, t;
        for (x = 0; x < tw; x++) {
            var col = gradAt(TH.body, x / (tw - 1)), X0 = x / f;
            Xc[x] = X0; cr[x] = col[0]; cg[x] = col[1]; cb[x] = col[2];
            t = X0 / cw1; ci1[x] = Math.floor(t); t -= ci1[x]; cf1[x] = t * t * (3 - 2 * t);
            t = X0 / cw2; ci2[x] = Math.floor(t); t -= ci2[x]; cf2[x] = t * t * (3 - 2 * t);
        }

        var dspAmt = (back ? .20 : .14) * U;
        for (y = 0; y < th; y++) {
            var Y = y / f, ny = (y / (th - 1)) * 2 - 1, e = edges(F, kind, ny), lead = e.lead, trail = e.trail;
            var vig = smooth(.55, 1.10, Math.abs(ny)) * TH.warmAmt;
            var ri1 = Math.floor(Y / ch1), rf1 = Y / ch1 - ri1; rf1 = rf1 * rf1 * (3 - 2 * rf1);
            var ri2 = Math.floor(Y / ch2), rf2 = Y / ch2 - ri2; rf2 = rf2 * rf2 * (3 - 2 * rf2);
            for (x = 0; x < tw; x++, p += 4) {
                var n = .62 * nz(N1, ci1[x], cf1[x], ri1, rf1) + .38 * nz(N2, ci2[x], cf2[x], ri2, rf2);
                var dsp = (n - .5) * dspAmt;
                var X = Xc[x], d = lead - X + dsp, ee = X - trail - dsp * .6;
                if (d <= 0 || ee <= 0) { px[p + 3] = 0; continue; }
                var a = smooth(0, feather, d) * smooth(0, feather, ee);
                if (a < .004) { px[p + 3] = 0; continue; }

                
                var we = 1 - smooth(0, feather * 1.2, d < ee ? d : ee);
                a *= clamp(mix(1, .55 + .9 * n, we), 0, 1);

                var r = cr[x], gr = cg[x], b = cb[x];

                
                r = mix(r, TH.warm[0], vig); gr = mix(gr, TH.warm[1], vig); b = mix(b, TH.warm[2], vig);

                
                var lw = (1 - smooth(0, feather * 1.5, d)) * .88;
                r = mix(r, TH.lead[0], lw); gr = mix(gr, TH.lead[1], lw); b = mix(b, TH.lead[2], lw);
                var tl = (1 - smooth(0, feather * 1.5, ee)) * .75;
                r = mix(r, TH.trail[0], tl); gr = mix(gr, TH.trail[1], tl); b = mix(b, TH.trail[2], tl);

                
                var q = (d - feather * .34) / (feather * .17), rm = Math.exp(-q * q) * .38;
                r = mix(r, TH.rim[0], rm); gr = mix(gr, TH.rim[1], rm); b = mix(b, TH.rim[2], rm);

                
                var m = 1 + (n - .5) * .11, gn = (rnd() - .5) * 3.4;
                px[p] = r * m + gn; px[p + 1] = gr * m + gn; px[p + 2] = b * m + gn; px[p + 3] = a * 255;
            }
        }
        g.putImageData(img, 0, 0);
        return c;
    }

    
    function dotSprite(rgb) {
        var c = document.createElement("canvas"); c.width = c.height = 64;
        var g = c.getContext("2d"), gd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
        gd.addColorStop(0, "rgba(" + rgb + ",1)");
        gd.addColorStop(.2, "rgba(" + rgb + ",.62)");
        gd.addColorStop(.45, "rgba(" + rgb + ",.2)");
        gd.addColorStop(.75, "rgba(" + rgb + ",.04)");
        gd.addColorStop(1, "rgba(" + rgb + ",0)");
        g.fillStyle = gd; g.fillRect(0, 0, 64, 64);
        return c;
    }

    
    function bokehSprite(rgb) {
        var c = document.createElement("canvas"); c.width = c.height = 96;
        var g = c.getContext("2d"), gd = g.createRadialGradient(48, 48, 0, 48, 48, 46);
        gd.addColorStop(0, "rgba(" + rgb + ",.55)");
        gd.addColorStop(.75, "rgba(" + rgb + ",.75)");
        gd.addColorStop(.93, "rgba(" + rgb + ",1)");
        gd.addColorStop(1, "rgba(" + rgb + ",0)");
        g.fillStyle = gd; g.fillRect(0, 0, 96, 96);
        return c;
    }

    
    function petalSprite(c1, c2, seed, back, soft) {
        var r = rng(seed), S = 96, c = document.createElement("canvas"); c.width = c.height = S;
        var g = c.getContext("2d"), i;
        var L = 39 * (.93 + r() * .14), Wd = 21 * (.88 + r() * .26), sk = (r() - .5) * 5, nt = 3.2 + r() * 3.4;
        var k1 = back ? mixRGB(c1, [255, 255, 255], .42) : c1, k2 = back ? mixRGB(c2, [255, 255, 255], .5) : c2;
        g.translate(S / 2, S / 2);

        function shape() {
            g.beginPath();
            g.moveTo(-L, 0);
            g.bezierCurveTo(-L * .65, -Wd * .9, L * .1, -Wd * 1.3, L * .72, -Wd * .85 + sk * .3);
            g.bezierCurveTo(L * .98, -Wd * .6, L * 1.02, -Wd * .12, L * .86, -nt * .25);
            g.quadraticCurveTo(L * .86 - nt * 1.5, sk * .2, L * .86, nt * .25);
            g.bezierCurveTo(L * 1.02, Wd * .12, L * .98, Wd * .6 + sk, L * .72, Wd * .85 + sk);
            g.bezierCurveTo(L * .1, Wd * 1.3 + sk, -L * .65, Wd * .9, -L, 0);
            g.closePath();
        }

        var gd = g.createRadialGradient(-L * .92, 0, 2, -L * .92, 0, L * 2);      
        gd.addColorStop(0, "rgb(" + k1.join(",") + ")");
        gd.addColorStop(.5, "rgb(" + mixRGB(k1, k2, .6).join(",") + ")");
        gd.addColorStop(1, "rgb(" + k2.join(",") + ")");
        shape(); g.fillStyle = gd; g.fill();

        g.save(); shape(); g.clip();
        g.strokeStyle = "rgba(255,255,255," + (back ? .34 : .30) + ")"; g.lineWidth = Wd * .55; shape(); g.stroke();   
        g.lineCap = "round";
        for (i = -2; i <= 2; i++) {                                               
            g.strokeStyle = "rgba(205,78,118," + (back ? .07 : .13) + ")"; g.lineWidth = 1;
            g.beginPath(); g.moveTo(-L * .96, 0); g.quadraticCurveTo(-L * .1, i * Wd * .16, L * .74, i * Wd * .44 + sk * .3); g.stroke();
        }
        g.strokeStyle = "rgba(206,86,124," + (back ? .08 : .15) + ")"; g.lineWidth = 3.4;      
        g.beginPath(); g.moveTo(-L * .9, 0); g.quadraticCurveTo(0, sk * .3, L * .6, 0); g.stroke();
        var sh = g.createRadialGradient(L * .1, -Wd * .45, 1, L * .1, -Wd * .45, Wd * 1.5);     
        sh.addColorStop(0, "rgba(255,255,255," + (back ? .42 : .50) + ")"); sh.addColorStop(1, "rgba(255,255,255,0)");
        g.fillStyle = sh; g.fillRect(-S / 2, -S / 2, S, S);
        g.restore();

        shape(); g.strokeStyle = "rgba(224,100,140,.22)"; g.lineWidth = 1; g.stroke();

        if (soft) {                                                               
            var t = document.createElement("canvas"); t.width = t.height = 20;
            var tg = t.getContext("2d"); tg.imageSmoothingQuality = "high";
            tg.drawImage(c, 0, 0, 20, 20);
            g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, S, S);
            g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high";
            g.drawImage(t, 0, 0, S, S);
        }
        return c;
    }

    function mixRGB(a, b, t) { return [Math.round(mix(a[0], b[0], t)), Math.round(mix(a[1], b[1], t)), Math.round(mix(a[2], b[2], t))]; }

    
    var cache = { key: "", F: null, themes: {} };
    var lowQuality = false;      

    function getScene(w, h, theme) {
        var key = w + "x" + h + (lowQuality ? "L" : "");
        if (cache.key !== key) { cache.key = key; cache.F = setupScene(w, h, lowQuality); cache.themes = {}; }
        var F = cache.F, T = cache.themes[theme];
        if (!T) {
            T = cache.themes[theme] = {
                front: bandTexture(F, theme, "front"),
                back: bandTexture(F, theme, "back"),
                petals: [], flies: [], sprites: []
            };
            var r = rng(theme === "dark" ? 5 : 8), i, U = F.U;
            var scale = clamp(Math.sqrt(w * h) / 1000, .7, 1.3);
            if (theme === "dark") {
                T.dotG = dotSprite("170,255,80");
                T.dotA = dotSprite("214,255,130");
                T.dotHot = dotSprite("255,255,214");
                T.bokeh = bokehSprite("190,255,110");
                var nf = Math.round(clamp(w * h / 9000, 50, 130) * (lowQuality ? .7 : 1));
                for (i = 0; i < nf; i++) {
                    var z = r();
                    T.flies.push({
                        z: z, off: .26 * U - Math.pow(r(), 1.35) * .95 * F.Bw, y0: r(), par: .72 + z * .7,
                        ph: r() * 6.28, ph2: r() * 6.28, ph3: r() * 6.28,
                        fx: .5 + r() * 1.0, fy: .4 + r() * .9, ax: (16 + r() * 46) * (.6 + z * .7), ay: (10 + r() * 30) * (.6 + z * .7),
                        vy: -(3 + r() * 14) * (.6 + z * .8), P: .9 + r() * 1.7, bp: r(),
                        r: (1.1 + z * 2.4) * scale, a: .62 + r() * .38, dbl: r() < .3
                    });
                }
                T.flies.sort(function (a, b) { return a.z - b.z; });
            } else {
                var PC = PETAL_COLORS.length;
                for (i = 0; i < PC; i++) {
                    var sd = 100 + i * 7;
                    T.sprites.push({
                        f: petalSprite(PETAL_COLORS[i][0], PETAL_COLORS[i][1], sd, false, false),
                        b: petalSprite(PETAL_COLORS[i][0], PETAL_COLORS[i][1], sd, true, false),
                        sf: petalSprite(PETAL_COLORS[i][0], PETAL_COLORS[i][1], sd, false, true),
                        sb: petalSprite(PETAL_COLORS[i][0], PETAL_COLORS[i][1], sd, true, true)
                    });
                }
                var np = Math.round(clamp(w * h / 9000, 54, 130) * (lowQuality ? .7 : 1));
                for (i = 0; i < np; i++) {
                    var zp = r();
                    T.petals.push({
                        z: zp, off: .26 * U - Math.pow(r(), 1.45) * .95 * F.Bw, y0: r(), par: .72 + zp * .7,
                        ph: r() * 6.28, ph2: r() * 6.28, sway: (14 + r() * 40) * (.55 + zp * .8), swF: .8 + r() * 1.3,
                        vy: (12 + r() * 34) * (.55 + zp * .9), size: (22 + Math.pow(zp, 1.6) * 58) * scale * (.85 + r() * .3),
                        rot0: r() * 6.28, rv: (r() - .5) * 2.2, flipSp: .8 + r() * 1.5, flipPh: r() * 6.28,
                        tiltSp: .5 + r() * .9, tiltPh: r() * 6.28,
                        a: (.8 + zp * .15) + r() * .05, sp: (r() * PC) | 0, soft: zp > .88 || zp < .1
                    });
                }
                T.petals.sort(function (a, b) { return a.z - b.z; });             
            }
        }
        return { F: F, T: T, TH: THEME[theme] };
    }

    
    var SECONDS = 3.4;                                      

    function aheadFade(F, Xr, x, y, floor) {                
        var ny = clamp(y / F.h * 2 - 1, -1, 1), lead = Xr - F.Bw + edges(F, "front", ny).lead;
        var ahead = x - lead;
        return ahead > 0 ? 1 - (1 - floor) * smooth(0, .3 * F.U, ahead) : 1;
    }

    function petalPos(F, p, s2) {
        var tm = s2 * SECONDS, Xr = F.xStart + (F.xEnd - F.xStart) * s2, m = F.h + 160;
        var gust = Math.sin(tm * .9 + p.ph) * .6 + Math.sin(tm * 2.3 + p.ph2) * .4;        
        return {
            x: Xr - .08 * F.U + p.off + (p.par - 1) * .22 * (Xr - F.xCover) + Math.sin(tm * p.swF + p.ph) * p.sway + gust * p.sway * .5,
            y: wrap(p.y0 * m + tm * p.vy + Math.sin(tm * p.swF * .8 + p.ph2) * p.sway * .45 + gust * 10, m) - 80
        };
    }

    function drawPetals(ctx, F, T, Xr, s, env, zLo, zHi) {
        var tm = s * SECONDS, P = T.petals, w = F.w, i;
        for (i = 0; i < P.length; i++) {
            var p = P[i]; if (p.z < zLo || p.z >= zHi) continue; var pos = petalPos(F, p, s);
            if (pos.x < -100 || pos.x > w + 100) continue;
            var af = aheadFade(F, Xr, pos.x, pos.y, .22), al = p.a * env * af;
            if (al < .02) continue;

            
            var b = tm * p.flipSp + p.flipPh, fl = Math.cos(b), front = fl >= 0, sy = Math.abs(fl);
            if (sy < .13) sy = .13;
            var sx = .74 + .26 * Math.cos(tm * p.tiltSp + p.tiltPh);
            var rot = p.rot0 + Math.sin(tm * p.swF + p.ph + 1.2) * .9 + tm * p.rv * .4;   
            var spr = T.sprites[p.sp], img = p.soft ? (front ? spr.sf : spr.sb) : (front ? spr.f : spr.b);
            var k = p.size / 80, vis = .5 + .5 * Math.pow(Math.abs(fl), .6);               

            if (p.z > .55) {                                                               
                var g2 = petalPos(F, p, s - .0075);
                ctx.globalAlpha = al * vis * .26;
                ctx.save(); ctx.translate(g2.x, g2.y); ctx.rotate(rot); ctx.scale(k * sx, k * sy);
                ctx.drawImage(img, -48, -48); ctx.restore();
            }
            ctx.globalAlpha = al * vis;
            ctx.save(); ctx.translate(pos.x, pos.y); ctx.rotate(rot); ctx.scale(k * sx, k * sy);
            ctx.drawImage(img, -48, -48); ctx.restore();
        }
        ctx.globalAlpha = 1;
    }

    function flyPos(F, f, s2) {
        var tm = s2 * SECONDS, Xr = F.xStart + (F.xEnd - F.xStart) * s2, m = F.h + 160;
        return {
            x: Xr - .08 * F.U + f.off + (f.par - 1) * .22 * (Xr - F.xCover) +
               Math.sin(tm * f.fx + f.ph) * f.ax + Math.sin(tm * f.fx * 2.1 + f.ph2) * f.ax * .4,
            y: wrap(f.y0 * m + tm * f.vy + Math.sin(tm * f.fy + f.ph2) * f.ay + Math.sin(tm * f.fy * 2.7 + f.ph) * f.ay * .35, m) - 80
        };
    }

    function drawFlies(ctx, F, T, Xr, s, env, zLo, zHi) {
        var tm = s * SECONDS, w = F.w, i;
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        for (i = 0; i < T.flies.length; i++) {
            var f = T.flies[i]; if (f.z < zLo || f.z >= zHi) continue; var pos = flyPos(F, f, s);
            if (pos.x < -80 || pos.x > w + 80) continue;
            var af = aheadFade(F, Xr, pos.x, pos.y, .35), al = f.a * env * af;
            if (al < .02) continue;

            
            var u = wrap(tm / f.P + f.bp, 1), I = u < .16 ? smooth(0, .16, u) : Math.exp(-(u - .16) * 4.6);
            if (f.dbl) { var u2 = (u - .42) / .12; if (u2 > 0 && u2 < 1) I = Math.max(I, .75 * Math.sin(u2 * Math.PI)); }
            var gate = .3 + .7 * smooth(.2, .6, .5 + .5 * Math.sin(tm * .55 + f.ph3));
            var b = (.05 + .95 * I) * gate;
            if (b < .03) continue;

            var rr = f.r * (7 + 11 * I) * (f.z < .28 ? .7 : 1);                            
            ctx.globalAlpha = al * b * .5;
            ctx.drawImage(T.dotG, pos.x - rr * 1.5, pos.y - rr * 1.5, rr * 3, rr * 3);
            ctx.globalAlpha = al * b * .85;
            ctx.drawImage(T.dotA, pos.x - rr, pos.y - rr, rr * 2, rr * 2);
            var hr = f.r * (1.5 + 1.5 * I);
            ctx.globalAlpha = al * Math.min(1, b * 1.15);
            ctx.drawImage(T.dotHot, pos.x - hr, pos.y - hr, hr * 2, hr * 2);
            if (f.z > .86) {                                                                
                var br = f.r * 11;
                ctx.globalAlpha = al * b * .2;
                ctx.drawImage(T.bokeh, pos.x - br, pos.y - br, br * 2, br * 2);
            }
        }
        ctx.restore();
        ctx.globalAlpha = 1;
    }

    
    var grainTile = null;
    function grainPattern(ctx) {
        if (!grainTile) {
            var c = document.createElement("canvas"); c.width = c.height = 160;
            var g = c.getContext("2d"), im = g.createImageData(160, 160), d = im.data, r = rng(99), i;
            for (i = 0; i < d.length; i += 4) { d[i] = d[i + 1] = d[i + 2] = r() > .5 ? 255 : 0; d[i + 3] = r() * 11; }
            g.putImageData(im, 0, 0); grainTile = c;
        }
        return ctx.createPattern(grainTile, "repeat");
    }

    
    var curLabel = "", famCache = "";
    function brandFam() {
        if (famCache) return famCache;
        var fam = "Georgia, 'Times New Roman', serif";
        try {
            var el = document.querySelector(".logo, .brand, .navbar-brand, header h1, h1, h2");
            if (el) { var f = window.getComputedStyle(el).fontFamily; if (f) { fam = f + ", Georgia, serif"; famCache = fam; } }
        } catch (e) {}
        return fam;
    }

    
    function revealText(ctx, str, track, cx, y, t, dir, size, rgb, lead, U) {
        var n = str.length, ws = [], tot = 0, i;
        for (i = 0; i < n; i++) { ws.push(ctx.measureText(str[i]).width); tot += ws[i] + (i < n - 1 ? track : 0); }
        var x = cx - tot / 2, stag = Math.min(.07, .6 / n), den = 1 - (n - 1) * stag;
        ctx.fillStyle = "rgb(" + rgb.join(",") + ")";
        for (i = 0; i < n; i++) {
            var ti = clamp((t - i * stag) / den, 0, 1), e = 1 - Math.pow(1 - ti, 4);
            var cover = smooth(0, .2 * U, lead - x);
            if (e * cover > .003) {
                ctx.globalAlpha = e * cover;
                ctx.fillText(str[i], x, y + (1 - e) * size * .34 * dir);
            }
            x += ws[i] + track;
        }
        return tot;
    }

    function drawWordmark(ctx, F, theme, mode, t, Xr) {
        if (t <= .002 || (!BRAND && !curLabel)) return;
        var dark = theme === "dark", w = F.w, h = F.h, fam = brandFam(), U = F.U, lead = Xr - .1 * U - .06 * U;
        var size = clamp(Math.min(w, h * 1.6) * .052, 30, 70), dir = mode === "in" ? 1 : -1;
        var col = dark ? [222, 248, 239] : [124, 56, 80], col2 = dark ? [152, 208, 198] : [166, 96, 116];
        var cx = w / 2, base = h / 2 + size * .12, tot = 0;
        ctx.save();
        ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";
        if (dark) { ctx.shadowColor = "rgba(120,255,214,.30)"; ctx.shadowBlur = size * .55; }
        if (BRAND) {
            ctx.font = "400 " + size + "px " + fam;
            tot = revealText(ctx, BRAND.toUpperCase(), size * .34, cx, base, t, dir, size, col, lead, U);
        }
        ctx.shadowBlur = 0;
        var hw = Math.min(tot || size * 5, w * .5) * .62, he = 1 - Math.pow(1 - clamp((t - .12) / .88, 0, 1), 3);
        var ly = base + size * .66;
        if (BRAND && he > .002) {                                         
            ctx.globalAlpha = .55 * smooth(0, .2 * U, lead - cx);
            ctx.fillStyle = "rgb(" + col2.join(",") + ")";
            ctx.fillRect(cx - hw * he, ly, hw * 2 * he, 1);
        }
        if (curLabel) {
            var s2 = Math.max(13, size * .3);
            ctx.font = "italic 400 " + s2 + "px " + fam;
            revealText(ctx, curLabel.toLowerCase(), s2 * .16, cx, ly + s2 * (BRAND ? 2.1 : 0), clamp((t - .3) / .7, 0, 1), dir, s2, col2, lead, U);
        }
        ctx.restore();
    }

    function drawFrame(S, theme, s, mode, t) {
        var ctx = S.ctx, w = S.w, h = S.h, sc = getScene(w, h, theme), F = sc.F, T = sc.T, TH = sc.TH;
        var dark = theme === "dark", U = F.U;
        ctx.clearRect(0, 0, w, h);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        var Xr = F.xStart + (F.xEnd - F.xStart) * s;         
        var env = smooth(0, .07, s) * (1 - smooth(.93, 1, s));

        
        var ba = Math.min(smooth(F.sCover - .10, F.sCover, s), 1 - smooth(F.sCover, F.sCover + .10, s));
        if (ba > 0) {
            ctx.globalAlpha = ba; ctx.fillStyle = "rgb(" + TH.base.join(",") + ")"; ctx.fillRect(0, 0, w, h);
            ctx.globalAlpha = 1;
        }

        
        ctx.save();
        ctx.globalAlpha = .5; ctx.translate(0, h); ctx.scale(1, -1);
        ctx.drawImage(T.back, Xr - F.Bw - F.ext + .12 * U, 0, F.Bw + 2 * F.ext, h);
        ctx.restore();
        ctx.drawImage(T.back, Xr - F.Bw - F.ext, 0, F.Bw + 2 * F.ext, h);
        ctx.drawImage(T.front, Xr - F.Bw, 0, F.Bw, h);

        
        if (env > .01) {
            var bx = Xr - .12 * U, by = h * .5, br = .6 * U, bg = ctx.createRadialGradient(bx, by, 0, bx, by, br);
            bg.addColorStop(0, dark ? "rgba(80,220,190," + (.17 * env) + ")" : "rgba(255,200,216," + (.13 * env) + ")");
            bg.addColorStop(1, dark ? "rgba(80,220,190,0)" : "rgba(255,200,216,0)");
            ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = bg;
            ctx.fillRect(bx - br, by - br, br * 2, br * 2); ctx.restore();
        }

        
        ctx.save();
        ctx.globalCompositeOperation = "source-atop";
        var vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .35, w / 2, h / 2, Math.max(w, h) * .78);
        vg.addColorStop(0, "rgba(0,0,0,0)");
        vg.addColorStop(1, dark ? "rgba(0,8,14,.42)" : "rgba(168,64,100,.13)");
        ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);
        ctx.restore();

        
        if (env > .01) {
            if (dark) drawFlies(ctx, F, T, Xr, s, env, 0, .7); else drawPetals(ctx, F, T, Xr, s, env, 0, .7);
        }
        drawWordmark(ctx, F, theme, mode, t, Xr);
        if (env > .01) {
            if (dark) drawFlies(ctx, F, T, Xr, s, env, .7, 2); else drawPetals(ctx, F, T, Xr, s, env, .7, 2);
        }

        
        S.n = (S.n || 0) + 1;
        if (!S.grain) S.grain = grainPattern(ctx);
        ctx.save();
        ctx.globalCompositeOperation = "source-atop";
        ctx.translate((S.n * 73) % 160, (S.n * 131) % 160);
        ctx.fillStyle = S.grain; ctx.fillRect(-160, -160, w + 320, h + 320);
        ctx.restore();
        return F;
    }

    
    function bezier(x1, y1, x2, y2) {                     
        var cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
        return function (t) {
            if (t <= 0) return 0; if (t >= 1) return 1;
            var u = t, i, x, dx;
            for (i = 0; i < 8; i++) {
                x = ((ax * u + bx) * u + cx) * u - t;
                if (Math.abs(x) < 1e-5) break;
                dx = (3 * ax * u + 2 * bx) * u + cx;
                if (Math.abs(dx) < 1e-6) break;
                u = clamp(u - x / dx, 0, 1);
            }
            return ((ay * u + by) * u + cy) * u;
        };
    }
    var EASE_IN = bezier(.66, 0, .18, 1);                 
    var EASE_OUT = bezier(.52, 0, .12, 1);                

    function paint(S, theme, p, mode) {
        var sc = getScene(S.w, S.h, theme), cov = sc.F.sCover, e = (mode === "in" ? EASE_IN : EASE_OUT)(p);
        var s = mode === "in" ? e * cov : cov + e * (1 - cov);
        var t = mode === "in" ? smooth(.6, .99, p) : 1 - smooth(.02, .4, p);      
        drawFrame(S, theme, s, mode, t);

        
        if (BLUR_PX) {
            var k = smooth(.10, cov * .85, s) * (1 - smooth(cov, cov + (1 - cov) * .85, s));
            var b = Math.round(BLUR_PX * k * 2) / 2;
            if (b !== S.blur) {
                S.blur = b;
                var f = b ? "blur(" + b + "px)" : "none";
                S.c.style.backdropFilter = f;
                S.c.style.webkitBackdropFilter = f;
            }
        }
    }

    function run(mode, theme, duration, done) {
        var S = ensureCanvas(), t0 = null;
        S.c.style.pointerEvents = "auto";
        paint(S, theme, 0, mode);

        function frame(now) {
            if (t0 === null) t0 = now;
            var p = clamp((now - t0) / duration, 0, 1);
            paint(S, theme, p, mode);
            if (p < 1) raf = requestAnimationFrame(frame);
            else if (done) done();
        }
        raf = requestAnimationFrame(frame);
    }

    
    function currentTheme() {
        return document.body && document.body.classList.contains("dark-mode") ? "dark" : "light";
    }

    
    function pageKey(url) {
        return url.pathname.replace(/index\.html$/i, "").replace(/\/+$/, "") + url.search;
    }

    
    function labelFor(link, dest) {
        var t = (link.getAttribute("data-transition-label") || link.textContent || "").replace(/\s+/g, " ").trim();
        if (!t || t.length > 22) {
            var seg = (dest.pathname.split("/").filter(Boolean).pop() || "index").replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ").trim();
            t = /^index$/i.test(seg) ? "Home" : seg.replace(/\b\w/g, function (c) { return c.toUpperCase(); });
        }
        return t;
    }

    
    var prefetched = {};
    function prefetch(ev) {
        var a = ev.target.closest && ev.target.closest("a"), href = a && a.getAttribute("href"), u;
        if (!href || href.charAt(0) === "#" || !document.head) return;
        try { u = new URL(href, window.location.href); } catch (e) { return; }
        if (u.origin !== window.location.origin || prefetched[u.href] || pageKey(u) === pageKey(window.location)) return;
        prefetched[u.href] = 1;
        var l = document.createElement("link"); l.rel = "prefetch"; l.href = u.href; document.head.appendChild(l);
    }
    document.addEventListener("pointerover", prefetch, { passive: true });
    document.addEventListener("touchstart", prefetch, { passive: true });

    document.addEventListener("click", function (event) {
        if (reduceMotion || busy) return;

        var link = event.target.closest && event.target.closest("a");
        if (!link || event.defaultPrevented || event.button !== 0 ||
            event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
            link.target === "_blank" || link.hasAttribute("download") ||
            link.hasAttribute("data-no-transition")) return;

        var href = link.getAttribute("href");

        
        if (!href || href.charAt(0) === "#" || /^(mailto:|tel:|javascript:)/i.test(href)) return;

        var dest;
        try { dest = new URL(href, window.location.href); } catch (e) { return; }

        
        if (dest.origin !== window.location.origin ||
            pageKey(dest) === pageKey(window.location)) return;

        
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        busy = true;

        var theme = currentTheme();
        curLabel = labelFor(link, dest);
        famCache = "";
        try { sessionStorage.setItem(FLAG_KEY, theme + ":" + Date.now() + ":" + encodeURIComponent(curLabel)); } catch (e) {}

        run("in", theme, COVER_MS[theme], function () {
            window.location.assign(dest.href);
        });
    }, true);   

    
    (function arrive() {
        if (reduceMotion) return;

        var theme = null;
        try {
            var raw = sessionStorage.getItem(FLAG_KEY) || "";
            sessionStorage.removeItem(FLAG_KEY);
            var parts = raw.split(":");
            if ((parts[0] === "dark" || parts[0] === "light") && Date.now() - Number(parts[1]) < 5000) {
                theme = parts[0];
                try { curLabel = decodeURIComponent(parts.slice(2).join(":")); } catch (e) { curLabel = ""; }
            }
        } catch (e) {}
        if (!theme) return;

        lowQuality = true;                  
        var S = ensureCanvas();
        paint(S, theme, 0, "out");          

        var started = false, minAt = Date.now() + HOLD_MS;
        function go() {
            if (started) return;
            started = true;
            famCache = "";                  
            paint(ensureCanvas(), theme, 0, "out");
            run("out", theme, REVEAL_MS[theme], function () {
                removeCanvas();
                lowQuality = false;
                setTimeout(warmUp, 300);    
            });
        }
        function ready() {
            
            var fonts = [];
            try { if (document.fonts) { fonts.push(document.fonts.ready); fonts.push(document.fonts.load("400 40px " + brandFam())); } } catch (e) {}
            var cap = new Promise(function (res) { setTimeout(res, 600); });
            Promise.race([Promise.all(fonts), cap]).then(function () { setTimeout(go, Math.max(0, minAt - Date.now())); });
        }

        if (document.readyState === "complete") ready();
        else {
            window.addEventListener("load", ready);
            setTimeout(ready, 1100);        
        }
    })();

    
    function warmUp() {
        if (reduceMotion || busy || lowQuality) return;
        try { getScene(window.innerWidth, window.innerHeight, currentTheme()); } catch (e) {}
    }
    if (!reduceMotion) {
        window.addEventListener("load", function () { setTimeout(warmUp, 400); });
    }

    
    window.addEventListener("pageshow", function (event) {
        if (!event.persisted) return;
        busy = false;
        removeCanvas();
        var menu = document.getElementById("mobileMenu");
        if (menu) { menu.classList.remove("active"); menu.setAttribute("aria-hidden", "true"); }
        if (document.body) document.body.style.overflow = "";
    });
})();
