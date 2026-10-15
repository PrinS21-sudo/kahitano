(function () {
    'use strict';
    var root = document.querySelector('.hang-card');
    if (!root) return;

    var swing = root.querySelector('.hc-swing');
    var flipEl = root.querySelector('.hc-flip');
    var front = root.querySelector('.hc-front');
    var art = root.querySelector('.hc-art');
    var img = art && art.querySelector('img');
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (img) {
        var miss = function () { art.classList.add('no-photo'); };
        if (img.complete && img.naturalWidth === 0) miss();
        img.addEventListener('error', miss);
    }

    var shine = document.createElement('div');
    shine.className = 'hc-shine';
    shine.setAttribute('aria-hidden', 'true');
    front.appendChild(shine);

    var angle = 16, vel = 0;
    var flipA = 180, flipV = 0;
    var flipTarget = 180;
    var dragging = false, dragTarget = 0, moved = 0, lastPX = 0, lastPT = 0;
    var idleT = 0, tilt = 0;
    var MAX = 40;

    var GRAV = 52;
    var DAMP = 0.55;
    var STEP = 1 / 120;

    function setFlip(back) { flipTarget = back ? 180 : 0; }

    setTimeout(function () { setFlip(false); flipV += 0; }, reduce ? 0 : 650);

    function pivot() {
        var r = root.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top };
    }
    function angleFromPointer(e) {
        var p = pivot();
        var a = Math.atan2(e.clientX - p.x, Math.max(60, e.clientY - p.y)) * 180 / Math.PI;
        return Math.max(-MAX, Math.min(MAX, a));
    }

    swing.addEventListener('pointerdown', function (e) {
        dragging = true; moved = 0;
        dragTarget = angleFromPointer(e);
        lastPX = e.clientX; lastPT = performance.now();
        try { swing.setPointerCapture(e.pointerId); } catch (_) {}
        e.preventDefault();
    });
    window.addEventListener('pointermove', function (e) {
        if (!dragging) return;
        var a = angleFromPointer(e);
        moved += Math.abs(e.clientX - lastPX);
        lastPX = e.clientX;
        dragTarget = a;
    });
    function release() {
        if (!dragging) return;
        dragging = false;
        if (moved < 6) { setFlip(flipTarget === 0); vel += (Math.random() < .5 ? -1 : 1) * 26; }
        vel = Math.max(-320, Math.min(320, vel));
    }
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);

    swing.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFlip(flipTarget === 0); vel += 40; }
        if (e.key === 'ArrowLeft') vel -= 90;
        if (e.key === 'ArrowRight') vel += 90;
    });

    var visible = true;
    if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(root);
    }

    function stepPhysics(dt) {
        if (dragging) {
            var prev = angle;
            angle += (dragTarget - angle) * Math.min(1, dt * 22);
            var v = (angle - prev) / dt;
            vel += (v - vel) * Math.min(1, dt * 14);
        } else {
            var rad = angle * Math.PI / 180;
            var accel = -GRAV * (Math.sin(rad) * 180 / Math.PI) - DAMP * vel;
            vel += accel * dt;
            angle += vel * dt;
            if (angle > MAX) { angle = MAX; vel *= -0.3; }
            if (angle < -MAX) { angle = -MAX; vel *= -0.3; }

            idleT += dt;
            if (idleT > 5 && Math.abs(angle) < 1.5 && Math.abs(vel) < 5) {
                vel += (Math.random() < .5 ? -1 : 1) * 34; idleT = 0;
            }
        }

        var fa = (-95 * (flipA - flipTarget)) - 13 * flipV;
        flipV += fa * dt;
        flipA += flipV * dt;
    }

    var last = performance.now(), acc = 0;
    var lastAngleStr = '', lastFlipStr = '';

    function frame(now) {
        var dt = (now - last) / 1000; last = now;
        if (dt > 0.1) dt = 0.1;

        if (visible && !reduce) {
            acc += dt;
            while (acc >= STEP) { stepPhysics(STEP); acc -= STEP; }

            tilt += ((vel * 0.045) - tilt) * Math.min(1, dt * 8);

            var a = angle.toFixed(2);
            if (a !== lastAngleStr) {
                swing.style.transform = 'rotate(' + a + 'deg)';
                shine.style.transform = 'translate3d(' + (angle * 4).toFixed(1) + '%,0,0)';
                lastAngleStr = a;
            }
            var lift = Math.sin(Math.min(180, Math.max(0, flipA)) * Math.PI / 180) * 18;
            var f = (flipA + tilt).toFixed(2);
            var s = 'translate3d(0,' + (-lift).toFixed(1) + 'px,0) rotateY(' + f + 'deg)';
            if (s !== lastFlipStr) {
                flipEl.style.transform = 'perspective(1200px) ' + s;
                lastFlipStr = s;
            }
        } else if (reduce) {
            flipEl.style.transform = 'rotateY(' + flipTarget + 'deg)';
        }
        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
})();