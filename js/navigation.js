if (window.lucide) {

    lucide.createIcons();

}





const menuToggle =
    document.getElementById("menuToggle");

const menuClose =
    document.getElementById("menuClose");

const mobileMenu =
    document.getElementById("mobileMenu");



function openMenu() {

    if (!mobileMenu) return;

    mobileMenu.classList.add("active");

    mobileMenu.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.style.overflow =
        "hidden";

}



function closeMenu() {

    if (!mobileMenu) return;

    mobileMenu.classList.remove("active");

    mobileMenu.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.style.overflow =
        "";

}



menuToggle?.addEventListener(
    "click",
    openMenu
);



menuClose?.addEventListener(
    "click",
    closeMenu
);



document
    .querySelectorAll(".mobile-menu a")
    .forEach(link => {

        link.addEventListener(
            "click",
            closeMenu
        );

    });



document.addEventListener(
    "keydown",
    event => {

        if (event.key === "Escape") {

            closeMenu();

        }

    }
);





const themeToggle =
    document.getElementById(
        "themeToggle"
    );



const savedTheme =
    localStorage.getItem(
        "bloomora-theme"
    );



if (savedTheme === "dark") {

    document.body.classList.add(
        "dark-mode"
    );

}



function updateThemeLabel() {

    if (!themeToggle) return;

    const dark =
        document.body.classList.contains(
            "dark-mode"
        );


    themeToggle.setAttribute(
        "aria-label",
        dark
            ? "Switch to light mode"
            : "Switch to dark mode"
    );

}



updateThemeLabel();



themeToggle?.addEventListener(
    "click",
    () => {

        document.body.classList.toggle(
            "dark-mode"
        );


        const dark =
            document.body.classList.contains(
                "dark-mode"
            );


        localStorage.setItem(
            "bloomora-theme",
            dark
                ? "dark"
                : "light"
        );


        updateThemeLabel();

    }
);





document
    .querySelectorAll("[data-split]")
    .forEach(element => {

        const textNodes = [];
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT
        );
        let textNode;

        while ((textNode = walker.nextNode())) {
            textNodes.push(textNode);
        }

        let wordIndex = 0;

        textNodes.forEach(node => {
            const fragment = document.createDocumentFragment();

            node.textContent.split(/(\s+)/).forEach(part => {
                if (!part) return;

                if (/^\s+$/.test(part)) {
                    fragment.appendChild(document.createTextNode(part));
                    return;
                }

                const word = document.createElement("span");
                word.className = "word-span";
                word.style.setProperty("--w-index", wordIndex++);
                word.textContent = part;
                fragment.appendChild(word);
            });

            node.replaceWith(fragment);
        });


    });




const revealObserver =
    new IntersectionObserver(
        entries => {

            entries.forEach(entry => {

                    entry.target.classList.toggle(
                        "revealed",
                        entry.isIntersecting
                    );

                });

            },
            {
                threshold: 0.12,
                rootMargin: "0px 0px -6% 0px"
            }
    );



document
    .querySelectorAll(
        "[data-rev], [data-split]"
    )
    .forEach(element => {

        revealObserver.observe(
            element
        );

    });




const heroStage =
    document.querySelector(
        ".hero-stage"
    );


const revealStage =
    document.querySelector(
        ".reveal-stage"
    );


const notesStage =
    document.querySelector(
        ".notes-stage"
    );


const heroText =
    document.querySelector(
        ".hero-text"
    );


const heroVideo =
    document.querySelector(
        ".background-video"
    );


const heroGlow =
    document.querySelector(
        ".hero-glow"
    );


const revealImageWrap =
    document.querySelector(
        ".reveal-image-wrap"
    );


const revealImage =
    document.querySelector(
        ".reveal-image-wrap img"
    );


const revealTitle =
    document.querySelector(
        ".reveal-title"
    );


const notesImage =
    document.querySelector(
        ".notes-image-wrap"
    );


const flowerRows =
    document.querySelectorAll(
        ".flower-row"
    );





function clamp(
    value,
    min = 0,
    max = 1
) {

    return Math.min(
        Math.max(
            value,
            min
        ),
        max
    );

}




function stageProgress(stage) {

    if (!stage) return 0;


    const rect =
        stage.getBoundingClientRect();


    const travel =
        Math.max(
            rect.height -
            window.innerHeight,
            1
        );


    return clamp(
        -rect.top / travel
    );

}





let targetMouseX = 0;

let targetMouseY = 0;

let smoothMouseX = 0;

let smoothMouseY = 0;



window.addEventListener(
    "pointermove",
    event => {

        targetMouseX =
            (
                event.clientX /
                window.innerWidth -
                .5
            ) * 2;


        targetMouseY =
            (
                event.clientY /
                window.innerHeight -
                .5
            ) * 2;

    },
    {
        passive: true
    }
);





function updateScroll() {


    const p1 =
        stageProgress(
            heroStage
        );


    const p2 =
        stageProgress(
            revealStage
        );


    const p3 =
        stageProgress(
            notesStage
        );





    if (heroVideo) {


        const zoom =
            1.04 +
            p1 * .12;


        const driftX =
            smoothMouseX * 1.2;


        const driftY =
            smoothMouseY * 1.2 -
            p1 * 3;


        heroVideo.style.transform =
            `
            scale(${zoom})
            translate3d(
                ${driftX}px,
                ${driftY}%,
                0
            )
            `;

    }



 

    if (heroText) {


        const fade =
            clamp(
                1 -
                p1 * 2.1
            );


        heroText.style.opacity =
            fade;


        heroText.style.transform =
            `
            translate3d(
                ${smoothMouseX * 7}px,
                ${smoothMouseY * 7 - p1 * 55}px,
                0
            )
            scale(
                ${1 - p1 * .045}
            )
            `;

    }





    if (heroGlow) {


        heroGlow.style.transform =
            `
            translate3d(
                ${smoothMouseX * 35}px,
                ${smoothMouseY * 35}px,
                0
            )
            scale(
                ${1 + p1 * .3}
            )
            `;

    }





    if (revealImageWrap) {


        const revealAmount =
            clamp(
                p2 * 1.18
            );


        revealImageWrap.style.clipPath =
            `
            inset(
                0
                0
                ${100 - revealAmount * 100}%
                0
            )
            `;

    }



    if (revealImage) {


        revealImage.style.transform =
            `
            scale(
                ${1.08 - p2 * .08}
            )
            translate3d(
                0,
                ${p2 * -2}%,
                0
            )
            `;

    }



    if (revealTitle) {


        revealTitle.style.opacity =
            clamp(
                1 -
                p2 * 1.45
            );


        revealTitle.style.transform =
            `
            translate3d(
                0,
                ${p2 * -35}px,
                0
            )
            `;

    }





    const activeIndex =
        Math.min(
            3,
            Math.floor(
                p3 * 4.1
            )
        );



    flowerRows.forEach(
        (row, index) => {

            row.classList.toggle(
                "active",
                index <= activeIndex
            );

        }
    );



   

    if (notesImage) {


        notesImage.style.transform =
            `
            scale(
                ${1.06 - p3 * .06}
            )
            translate3d(
                0,
                ${p3 * -2}%,
                0
            )
            `;

    }



    requestAnimationFrame(
        updateScroll
    );

}





function updateMouse() {


    smoothMouseX +=
        (
            targetMouseX -
            smoothMouseX
        ) * .045;


    smoothMouseY +=
        (
            targetMouseY -
            smoothMouseY
        ) * .045;


    requestAnimationFrame(
        updateMouse
    );

}



requestAnimationFrame(
    updateScroll
);


requestAnimationFrame(
    updateMouse
);





document
    .querySelectorAll(
        ".primary-button, .collection-button"
    )
    .forEach(button => {


        button.addEventListener(
            "pointermove",
            event => {


                const rect =
                    button.getBoundingClientRect();


                const x =
                    event.clientX -
                    rect.left -
                    rect.width / 2;


                const y =
                    event.clientY -
                    rect.top -
                    rect.height / 2;


                button.style.transform =
                    `
                    translate(
                        ${x * .06}px,
                        ${y * .06 - 4}px
                    )
                    `;

            }
        );



        button.addEventListener(
            "pointerleave",
            () => {

                button.style.transform =
                    "";

            }
        );

    });





const sections = [
    ...document.querySelectorAll(
        "#home, #about, #journey, #events, #work, #games, #tools"
    )
];


const navLinks = [
    ...document.querySelectorAll(
        ".main-nav .nav-link"
    )
];



const sectionObserver =
    new IntersectionObserver(
        entries => {


            entries.forEach(
                entry => {


                    if (
                        !entry.isIntersecting
                    ) return;


                    const id =
                        entry.target.id;


                    navLinks.forEach(
                        link => {

                            link.classList.toggle(
                                "active",
                                link.getAttribute(
                                    "href"
                                ) ===
                                `#${id}`
                            );

                        }
                    );

                }
            );

        },
        {
            threshold: .35
        }
    );



sections.forEach(
    section => {

        sectionObserver.observe(
            section
        );

    }
);


const siteHeader =
    document.querySelector(
        ".portfolio-site-header"
    );

if (siteHeader && document.querySelector(".hero-stage")?.contains(siteHeader)) {
    document.body.prepend(siteHeader);
    const homeMenu = document.getElementById("mobileMenu");

    if (homeMenu) {
        siteHeader.after(homeMenu);
    }
}

function updateHeaderAppearance() {
    siteHeader?.classList.toggle(
        "is-scrolled",
        window.scrollY > 60
    );
}

window.addEventListener(
    "scroll",
    updateHeaderAppearance,
    { passive: true }
);

updateHeaderAppearance();

const pageTransitionDuration = 280;

document.addEventListener("click", event => {
    const link = event.target.closest("a");

    if (
        !link ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        link.target === "_blank" ||
        link.hasAttribute("download")
    ) {
        return;
    }

    const href = link.getAttribute("href");
    if (!href || href.startsWith("#")) return;

    const destination = new URL(href, window.location.href);
    if (
        destination.origin !== window.location.origin ||
        (destination.pathname === window.location.pathname &&
            destination.search === window.location.search)
    ) {
        return;
    }

    event.preventDefault();
    document.body.classList.add("page-transition-leaving");

    window.setTimeout(() => {
        window.location.assign(destination.href);
    }, pageTransitionDuration);
});

window.requestAnimationFrame(() => {
    document.body.classList.add("page-transition-ready");
});


const backgroundVideo =
    document.querySelector(
        ".background-video"
    );



backgroundVideo?.addEventListener(
    "error",
    () => {

        document.body.classList.add(
            "video-fallback"
        );

    }
);
