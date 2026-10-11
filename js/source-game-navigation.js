(function () {
    var transitionDuration = 380;

    var revealItems = document.querySelectorAll('.scroll-reveal');

    function revealVisibleItems() {
        revealItems.forEach(function (item) {
            var bounds = item.getBoundingClientRect();
            if (bounds.top < window.innerHeight * 0.88 && bounds.bottom > 0) {
                item.classList.add('is-visible');
            } else {
                item.classList.remove('is-visible');
            }
        });
    }

    window.addEventListener('scroll', revealVisibleItems, { passive: true });
    document.addEventListener('scroll', revealVisibleItems, { passive: true, capture: true });
    window.setTimeout(revealVisibleItems, 100);
    window.setTimeout(revealVisibleItems, 800);

    document.addEventListener('click', function (event) {
        var link = event.target.closest('a');

        if (!link || event.defaultPrevented || event.button !== 0) {
            return;
        }

        var destination = link.getAttribute('href');
        if (!destination || destination.charAt(0) === '#' || link.target === '_blank') {
            return;
        }

        var destinationUrl;
        try {
            destinationUrl = new URL(destination, window.location.href);
        } catch (error) {
            return;
        }

        if (destinationUrl.origin !== window.location.origin || destinationUrl.href === window.location.href) {
            return;
        }

        event.preventDefault();
        document.body.classList.add('page-leaving');

        window.setTimeout(function () {
            window.location.href = destinationUrl.href;
        }, transitionDuration);
    });
}());