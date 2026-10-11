(function () {
    /* Load the stylesheet from this script's own folder, so a page only needs the
       one <script> line and can never be missing (or mis-pathing) the CSS link. */
    try {
        var hasCss = Array.prototype.some.call(
            document.querySelectorAll('link[rel="stylesheet"]'),
            function (link) { return /mobile-menu\.css/.test(link.getAttribute("href") || ""); }
        );
        var me = document.currentScript;
        if (!hasCss && me && me.src) {
            var css = document.createElement("link");
            css.rel = "stylesheet";
            css.href = me.src.replace(/\/js\/mobile-menu\.js.*$/, "/css/mobile-menu.css");
            document.head.appendChild(css);
        }
    } catch (error) {}
 
    var menu = document.getElementById("mobileMenu");
    if (!menu) return;
 
    var nav = menu.querySelector("nav");
 
    function close() {
        menu.classList.remove("active");
        menu.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
    }
 
    /* tap the dimmed area to close */
    menu.addEventListener("click", function (event) {
        if (nav && !nav.contains(event.target) && !event.target.closest(".mobile-menu-close")) {
            close();
        }
    });
 
    /* Escape closes it */
    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && menu.classList.contains("active")) close();
    });
 
    /* swipe the drawer to the right to close */
    if (nav) {
        var startX = null;
        nav.addEventListener("touchstart", function (event) {
            startX = event.touches[0].clientX;
        }, { passive: true });
        nav.addEventListener("touchend", function (event) {
            if (startX === null) return;
            var dx = event.changedTouches[0].clientX - startX;
            startX = null;
            if (dx > 70) close();
        }, { passive: true });
    }
 
    /* highlight the page you are on */
    var path = window.location.pathname;
    var inGames = /\/games\//.test(path) || /(games|quiz)\.html$/.test(path);
    var inAbout = /about\.html$/.test(path);
    menu.querySelectorAll("nav a").forEach(function (link) {
        var href = link.getAttribute("href") || "";
        var current = /games\.html/.test(href) ? inGames
            : /about\.html/.test(href) ? inAbout
            : (!inGames && !inAbout);
        link.classList.toggle("current", current);
        if (current) link.setAttribute("aria-current", "page");
    });
 
    /* focus the close button once the drawer is open */
    new MutationObserver(function () {
        if (!menu.classList.contains("active")) return;
        var closeButton = menu.querySelector(".mobile-menu-close");
        if (closeButton) setTimeout(function () { closeButton.focus({ preventScroll: true }); }, 350);
    }).observe(menu, { attributes: true, attributeFilter: ["class"] });
})();
 