const techList = document.querySelector(".portfolio-tech-list");

if (techList) {
    const techButtons = [...techList.querySelectorAll(".portfolio-tech-button")];

    function closeTechDescriptions(except) {
        techButtons.forEach(button => {
            if (button === except) return;
            button.setAttribute("aria-expanded", "false");
            button.closest("li").classList.remove("is-open");
        });
    }

    techButtons.forEach(button => {
        button.addEventListener("click", () => {
            const isOpen = button.getAttribute("aria-expanded") === "true";
            closeTechDescriptions(button);
            button.setAttribute("aria-expanded", String(!isOpen));
            button.closest("li").classList.toggle("is-open", !isOpen);
        });
    });

    document.addEventListener("click", event => {
        if (!techList.contains(event.target)) closeTechDescriptions();
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") closeTechDescriptions();
    });
}
