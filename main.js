// Main JavaScript for Global Interactions

document.addEventListener('DOMContentLoaded', () => {
    console.log('App Initialized');
    
    // Set active nav link based on current URL
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-item');
    navLinks.forEach(link => {
        const anchor = link.querySelector('a');
        if (anchor && anchor.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });

    // Global Modal Handling
    const modals = document.querySelectorAll('.modal-overlay');
    const modalTriggers = document.querySelectorAll('[data-modal-target]');
    const modalCloses = document.querySelectorAll('[data-modal-close]');

    modalTriggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            const targetId = trigger.getAttribute('data-modal-target');
            const modal = document.getElementById(targetId);
            if (modal) {
                modal.classList.add('active');
            }
        });
    });

    modalCloses.forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            const modal = closeBtn.closest('.modal-overlay');
            if (modal) {
                modal.classList.remove('active');
            }
        });
    });

    // Close modal on outside click
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
});

// Utility to create HTML for status badges
function getStatusBadge(status) {
    status = status.toLowerCase();
    let type = 'primary';
    
    if (status.includes('delivered') || status.includes('in stock') || status.includes('shipped')) {
        type = 'success';
    } else if (status.includes('pending') || status.includes('low stock') || status.includes('processing')) {
        type = 'warning';
    } else if (status.includes('out of stock') || status.includes('cancelled') || status.includes('failed')) {
        type = 'danger';
    }
    
    return `<span class="badge ${type}">${status}</span>`;
}
