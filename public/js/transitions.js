// Check if the View Transitions API is supported
function getNavigationType(fromPath, toPath) {
    if (toPath.includes(fromPath)) return 'forward';
    if (fromPath.includes(toPath)) return 'back';
    return 'navigate';
}

document.addEventListener('DOMContentLoaded', () => {
    // Add staggered animation classes to main content children automatically for "Juice"
    const mainContent = document.querySelector('main') || document.body;
    // Don't animate everything, just direct children that are block-level containers usually
    const potentiallyAnimate = mainContent.querySelectorAll('section, .card, .dashboard-grid > div, .hero-content');

    potentiallyAnimate.forEach((el, index) => {
        el.classList.add('animate-enter');
        // Cap delay at 500ms to avoid waiting too long
        const delay = Math.min((index + 1) * 100, 500);
        el.style.animationDelay = `${delay}ms`;
    });

    // Intercept link clicks for View Transitions
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');

        // Ignore if no link, or if it has target="_blank", or specific ignoring class
        if (!link || link.target === '_blank' || link.hasAttribute('data-no-transition')) return;

        // Ignore hash links on the same page
        const url = new URL(link.href);
        if (url.origin !== location.origin) return; // External link
        if (url.pathname === location.pathname && url.hash) return; // Anchor link
        if (url.pathname === location.pathname && !url.hash) return; // Same page refresh (optional, but usually we let it reload)

        e.preventDefault();

        const navigate = () => {
            window.location.href = link.href;
        };

        if (document.startViewTransition) {
            document.startViewTransition(() => {
                navigate();
            });
        } else {
            // Fallback: slight delay to allow any localized exit animations if we had them, 
            // but fundamentally just navigate.
            // We could simulate a fade out here manually if we wanted extra juice.
            document.body.style.opacity = '0';
            document.body.style.transition = 'opacity 0.2s ease';
            setTimeout(navigate, 200);
        }
    });
});
