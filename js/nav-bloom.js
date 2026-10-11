(function () {
    var NS = "http://www.w3.org/2000/svg", T = 2.8;
    var headers = Array.prototype.slice.call(document.querySelectorAll(".portfolio-site-header"));
    if (!headers.length) return;
 
    function el(tag, attrs, parent) {
        var e = document.createElementNS(NS, tag);
        for (var k in attrs) e.setAttribute(k, attrs[k]);
        parent.appendChild(e);
        return e;
    }
 
    
    var PAL = [
        { a: "#ffd23f", b: "#fff2a6", c: "#e5a400", e: "#e0711a" },  
        { a: "#f28ab2", b: "#ffc9de", c: "#cf4a86", e: "#ffd23f" },  
        { a: "#e63946", b: "#ff8089", c: "#a4161a", e: "#ffd23f" },  
        { a: "#ff8c1a", b: "#ffc17a", c: "#d6540a", e: "#7a3b0c" }   
    ];
    var SIZES = [0.45, 0.6, 0.8, 1, 1.25, 1.55];   
    var HANG_SIZES = [0.4, 0.5, 0.6, 0.75, 0.9];   
    var ROSE_PETAL = "M0,0C-10,-3 -13,-13 -5,-16C-1,-17.5 1,-17.5 5,-16C13,-13 10,-3 0,0Z";
 
    
    function rnd(v, m, s) {
        var x = Math.sin(v * 12.9898 + s * 78.233) * 43758.5453;
        return Math.floor((x - Math.floor(x)) * m);
    }
 
    function drawHead(head, type) {
        var i;
        if (type === 0) {                       
            for (i = 0; i < 5; i++)
                el("path", { d: ROSE_PETAL, class: "nb-fc nb-ln", transform: "rotate(" + i * 72 + ")" }, head);
            for (i = 0; i < 5; i++)
                el("path", { d: ROSE_PETAL, class: "nb-fa nb-ln", transform: "rotate(" + (i * 72 + 36) + ") scale(.78)" }, head);
            for (i = 0; i < 4; i++)
                el("path", { d: ROSE_PETAL, class: "nb-fb nb-ln", transform: "rotate(" + (i * 90 + 10) + ") scale(.45)" }, head);
            el("path", { d: "M0,-1C3,-1 4,2 1,3C-3,4 -4,-1 -1,-3C3,-5 6,0 3,4", class: "nb-fn nb-ln" }, head);
        } else if (type === 1) {                
            for (i = 0; i < 12; i++)
                el("path", { d: "M0,0C-3,-6 -3,-16 0,-21C3,-16 3,-6 0,0Z", class: "nb-fb nb-ln", transform: "rotate(" + i * 30 + ")" }, head);
            for (i = 0; i < 12; i++)
                el("path", { d: "M0,0C-2,-4 -2,-10 0,-13C2,-10 2,-4 0,0Z", class: "nb-fa", transform: "rotate(" + (i * 30 + 15) + ")" }, head);
            el("circle", { r: 5, class: "nb-fe" }, head);
            el("circle", { r: 2, class: "nb-fc" }, head);
        } else if (type === 2) {                
            for (i = 0; i < 5; i++)
                el("path", { d: "M0,0C-10,-4 -11,-19 0,-19C11,-19 10,-4 0,0Z", class: "nb-fa nb-ln", transform: "rotate(" + i * 72 + ")" }, head);
            for (i = 0; i < 5; i++)
                el("path", { d: "M0,0C-4,-3 -4,-9 0,-10C4,-9 4,-3 0,0Z", class: "nb-fb", transform: "rotate(" + i * 72 + ")" }, head);
            el("circle", { r: 3.2, class: "nb-fe" }, head);
            for (i = 0; i < 5; i++)
                el("circle", { cx: 0, cy: -6, r: 0.9, class: "nb-fc", transform: "rotate(" + (i * 72 + 36) + ")" }, head);
        } else {                                
            var t = el("g", { transform: "translate(0,8)" }, head);
            el("path", { d: "M0,0C-12,-2 -13,-14 -7,-23C-3,-15 -2,-7 0,0Z", class: "nb-fc nb-ln" }, t);
            el("path", { d: "M0,0C12,-2 13,-14 7,-23C3,-15 2,-7 0,0Z", class: "nb-fc nb-ln" }, t);
            el("path", { d: "M0,0C-9,-4 -9,-17 0,-26C9,-17 9,-4 0,0Z", class: "nb-fa nb-ln" }, t);
            el("path", { d: "M0,-4C-3,-9 -2,-16 0,-20", class: "nb-fn nb-ln" }, t);
        }
    }
 
    
    function flower(parent, x, y, h, scale, t, k, v, big) {
        var lean = (k % 2 ? -1 : 1) * (6 + (k % 3) * 2);
        var type = big ? 0 : rnd(v, 4, 1);
        var pal = PAL[big ? 2 : rnd(v, 4, 2)];
        var size = big ? 0.85 : (h > 0 ? HANG_SIZES[rnd(v, HANG_SIZES.length, 3)] : SIZES[rnd(v, SIZES.length, 3)] * 0.9);
        var cs = "--a:" + pal.a + ";--b:" + pal.b + ";--c:" + pal.c + ";--e:" + pal.e + ";";
        var root = el("g", { transform: "translate(" + x + "," + y + ")" }, parent);
        var g = el("g", { class: "nb-sway", style: "--t:" + t + "s;--sw:" + (4 + (k % 4) * 0.7) + "s" }, root);
        el("path", {
            d: "M0,0C" + lean + "," + h * 0.4 + " " + -lean * 0.6 + "," + h * 0.7 + " " + lean * 0.4 + "," + h,
            pathLength: 1, class: "nb-vine nb-stem", style: "--d:.8s;--t:" + t + "s"
        }, g);
        var hg = el("g", { transform: "translate(" + lean * 0.4 + "," + h + ")" }, g);
        var head = el("g", { class: "nb-head", style: cs + "--s:" + (scale * size).toFixed(2) + ";--t:" + (t + 0.6) + "s" }, hg);
        drawHead(head, type);
        if (h > 0) {
            var pg = el("g", { transform: "translate(" + lean * 0.4 + "," + (h + 6) + ")" }, g);
            el("path", {
                d: "M0,0C-3,-3 -3,-8 0,-10C3,-8 3,-3 0,0Z", class: "nb-fall",
                style: "fill:" + pal.a + ";--t:" + (t + 2 + (k % 5) * 1.3) + "s;--fd:" + (6 + (k % 3)) + "s;--dx:" + ((k % 2 ? -1 : 1) * (10 + (k % 4) * 5)) + "px"
            }, pg);
        }
        for (i = 0; i < 2; i++)
            el("circle", {
                cx: lean * 0.4 + (i ? 20 : -19), cy: h + (i ? -10 : 8) * (h < 0 ? -1 : 1), r: 1.5, class: "nb-spark",
                style: "--t:" + (t + 1.2 + i * 0.7) + "s"
            }, g);
    }
    var i;
 
    
    var LEAF = "M0,0C6,-7 16,-7 24,0C16,7 6,7 0,0Z";
 
    function buildBush(h, svg) {
        svg.innerHTML = "";
        var W = h.clientWidth, H = 64, x, i;
        svg.setAttribute("viewBox", "0 0 " + W + " " + H);
 
        
        for (x = -10, i = 0; x < W + 20; x += 22, i++)
            el("circle", { cx: x + rnd(i, 8, 11), cy: 9 + rnd(i, 7, 12), r: 14 + rnd(i, 7, 13), class: "nb-b1" }, svg);
        for (x = 2, i = 0; x < W + 20; x += 19, i++)
            el("circle", { cx: x + rnd(i, 6, 14), cy: 17 + rnd(i, 6, 15), r: 11 + rnd(i, 5, 16), class: "nb-b2" }, svg);
 
        
        for (x = 0, i = 0; x < W + 10; x += 17, i++)
            el("path", {
                d: LEAF, class: i % 3 ? "nb-b2" : "nb-b4",
                transform: "translate(" + (x + rnd(i, 6, 17)) + "," + (4 + rnd(i, 5, 18)) + ") rotate(" + (-60 - rnd(i, 60, 19)) + ") scale(" + (0.55 + rnd(i, 5, 20) / 10) + ")"
            }, svg);
 
        
        for (x = 0, i = 0; x < W + 10; x += 14, i++)
            el("path", {
                d: LEAF, class: i % 2 ? "nb-b3" : "nb-b4",
                transform: "translate(" + (x + rnd(i, 6, 21)) + "," + (22 + rnd(i, 6, 22)) + ") rotate(" + (45 + rnd(i, 90, 23)) + ") scale(" + (0.7 + rnd(i, 6, 24) / 10) + ")"
            }, svg);
 
        
        var n = Math.max(5, Math.round(W / 110)), j;
        for (j = 0; j < n; j++) {
            var lx = (j + 0.5) / n * W + rnd(j, 40, 31) - 20;
            var fall = el("g", {
                class: "nb-lf",
                transform: "translate(" + lx.toFixed(1) + ",30)",
                style: "--t:" + (3 + rnd(j, 90, 32) / 10) + "s;--fd:" + (7 + rnd(j, 50, 33) / 10) + "s;--fy:" + (170 + rnd(j, 120, 34)) +
                       "px;--dx:" + ((rnd(j, 2, 35) ? 1 : -1) * (30 + rnd(j, 60, 36))) + "px;--rot:" + (200 + rnd(j, 300, 37)) + "deg"
            }, svg);
            var sway = el("g", { class: "nb-ls", style: "--sd:" + (1.8 + rnd(j, 12, 38) / 10) + "s" }, fall);
            var lg = el("g", { transform: "scale(" + (0.55 + rnd(j, 5, 39) / 10) + ")" }, sway);
            el("path", { d: "M-11,0C-6,-6 6,-6 11,0C6,6 -6,6 -11,0Z", class: "nb-fl nb-fl" + (j % 3) }, lg);
            el("path", { d: "M-11,0L9,0", class: "nb-vein" }, lg);
        }
    }
 
    function build(h, svg, animate) {
        svg.innerHTML = "";
        svg.classList.toggle("nb-settled", !animate);
        var W = h.clientWidth, cx = W / 2, B = 20, H = svg.clientHeight || 86;
        svg.setAttribute("viewBox", "0 0 " + W + " " + H);
        var y = function (d) { return B + Math.sin(d / 46) * 3 + Math.sin(d / 17) * 1.2; };
        var gap = W < 600 ? 66 : 88;
        var base = 0.5;
        var at = function (d) { return base + (d / cx) * T * 0.92; };
 
        flower(svg, cx, y(0), 36, 1.25, base, 0, 0, true);
 
        [1, -1].forEach(function (dir) {
            var p = "";
            for (var d = 0; d <= cx; d += 4) p += (d ? "L" : "M") + (cx + dir * d).toFixed(1) + "," + y(d).toFixed(1);
            el("path", { d: p, pathLength: 1, class: "nb-vine", style: "--d:" + T + "s;--t:" + base + "s" }, svg);
 
            var i = 0, d2;
            for (d2 = 22; d2 < cx - 6; d2 += 24, i++) {
                var down = i % 2 === 0;
                var a = down ? 38 + (i % 3) * 10 : -34 - (i % 3) * 8;
                var ang = dir === 1 ? a : 180 - a;
                var s = 0.7 + ((i * 7) % 5) / 10;
                var g = el("g", { transform: "translate(" + (cx + dir * d2) + "," + y(d2) + ") rotate(" + ang + ") scale(" + s + ")" }, svg);
                el("path", { d: "M0,0C6,-7 16,-7 22,0C16,6 6,6 0,0Z", class: "nb-leaf", style: "--t:" + at(d2) + "s" }, g);
                if (i % 2 === 1) {
                    var bd = d2 + 11;
                    var by = y(bd) + (i % 4 === 1 ? 4 : -4);
                    el("circle", {
                        cx: cx + dir * bd, cy: by, r: 2 + (i % 3) * 0.5, class: "nb-bud",
                        style: "fill:" + PAL[rnd(bd, 4, 5)].a + ";--t:" + at(bd) + "s;transform-box:fill-box;transform-origin:center"
                    }, svg);
                }
                if (i % 4 === 3) {
                    var tg = el("g", { transform: "translate(" + (cx + dir * d2) + "," + y(d2) + ") scale(" + dir + ",1)" }, svg);
                    el("path", { d: "M0,0C4,8 12,8 11,2C10,-3 5,-2 6,2", pathLength: 1, class: "nb-vine nb-tendril", style: "--d:.7s;--t:" + (at(d2) + 0.2) + "s" }, tg);
                }
            }
 
            var k = 1;
            for (d2 = gap * 0.75; d2 < cx - 24; d2 += gap, k++) {
                var hang = k % 2 === 1;
                flower(svg, cx + dir * d2, y(d2), hang ? 30 + (k % 3) * 7 : -15, hang ? 1 : 0.8, at(d2), k, k * 2 + (dir === 1 ? 0 : 1));
            }
        });
    }
 
    var states = headers.map(function (h) {
        var bush = document.createElementNS(NS, "svg");
        bush.setAttribute("class", "nb-svg nb-bush");
        bush.setAttribute("aria-hidden", "true");
        h.appendChild(bush);
        var svg = document.createElementNS(NS, "svg");
        svg.setAttribute("class", "nb-svg");
        svg.setAttribute("aria-hidden", "true");
        h.appendChild(svg);
        return { h: h, svg: svg, bush: bush, w: 0 };
    });
 
    function renderAll(animate) {
        states.forEach(function (s) { s.w = s.h.clientWidth; buildBush(s.h, s.bush); build(s.h, s.svg, animate); });
    }
 
    renderAll(true);
 
    var timer;
    window.addEventListener("resize", function () {
        clearTimeout(timer);
        timer = setTimeout(function () {
            states.forEach(function (s) {
                if (Math.abs(s.h.clientWidth - s.w) > 2) { s.w = s.h.clientWidth; buildBush(s.h, s.bush); build(s.h, s.svg, false); }
            });
        }, 200);
    });
 
   
    var wasDark = document.body.classList.contains("dark-mode");
    new MutationObserver(function () {
        var dark = document.body.classList.contains("dark-mode");
        if (dark !== wasDark) { wasDark = dark; renderAll(true); }
    }).observe(document.body, { attributes: true, attributeFilter: ["class"] });
})();
 