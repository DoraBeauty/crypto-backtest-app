/**
 * Global Vocabulary Tooltip Logic
 * Displays explanations for specific terms when clicked.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Inject the tooltip container into the body
    const tooltip = document.createElement('div');
    tooltip.className = 'vocab-tooltip';
    tooltip.id = 'global-vocab-tooltip';
    document.body.appendChild(tooltip);

    let activeVocabElement = null;

    // Handle clicks on vocabulary buttons using event delegation
    document.addEventListener('click', (event) => {
        const vocabBtn = event.target.closest('.vocab-btn');

        if (vocabBtn) {
            // If clicking the currently open vocab button, close it
            if (activeVocabElement === vocabBtn && tooltip.classList.contains('show')) {
                hideTooltip();
                return;
            }

            // Extract data securely (no HTML rendering from data attributes to avoid XSS)
            const term = vocabBtn.getAttribute('data-term');
            const definition = vocabBtn.getAttribute('data-def');

            if (term && definition) {
                // Set content safely
                tooltip.innerHTML = '';
                const titleEl = document.createElement('strong');
                titleEl.textContent = term;
                const defEl = document.createElement('span');
                defEl.textContent = definition;

                tooltip.appendChild(titleEl);
                tooltip.appendChild(defEl);

                // Calculate position
                const rect = vocabBtn.getBoundingClientRect();
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

                // Position below the button by default
                let topPos = rect.bottom + scrollTop + 8;
                let leftPos = rect.left + scrollLeft;

                // Adjust if tooltip goes off-screen right
                if (leftPos + 250 > window.innerWidth) {
                    leftPos = window.innerWidth - 270; // 250px width + 20px padding
                }

                // Adjust if tooltip goes off-screen left
                if (leftPos < 10) {
                    leftPos = 10;
                }

                tooltip.style.top = `${topPos}px`;
                tooltip.style.left = `${leftPos}px`;

                // Show tooltip
                tooltip.classList.add('show');
                activeVocabElement = vocabBtn;

                // Prevent event from bubbling up and triggering the document close listener
                event.stopPropagation();
            }
        } else {
            // Clicked somewhere else, hide tooltip
            hideTooltip();
        }
    });

    // Close on escape key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            hideTooltip();
        }
    });

    // Handle scroll - hide tooltip when scrolling to avoid floating off-target
    window.addEventListener('scroll', () => {
        if (tooltip.classList.contains('show')) {
            hideTooltip();
        }
    }, { passive: true });

    function hideTooltip() {
        tooltip.classList.remove('show');
        activeVocabElement = null;
    }
});
