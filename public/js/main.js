/**
 * RIWAQ — frontend interactivity
 * Kept minimal — most of the app is server-rendered EJS.
 */
(function() {
    'use strict';

    // ----- Smooth scroll for in-page anchors -----
    document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach(a => {
        a.addEventListener('click', e => {
            const target = document.querySelector(a.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // ----- Auto-dismiss flash alerts -----
    setTimeout(() => {
        document.querySelectorAll('.alert-elegant.alert-success, .alert-elegant.alert-warning').forEach(el => {
            el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            el.style.opacity = '0';
            el.style.transform = 'translateY(-10px)';
            setTimeout(() => el.remove(), 400);
        });
    }, 5000);

    // ----- Quantity steppers (cart) — pure HTML form-fallback already works -----
    // (No need for JS here; cart updates use a normal POST form.)

    // ----- Highlight active nav link -----
    const path = window.location.pathname;
    document.querySelectorAll('.nav-links a').forEach(link => {
        if (link.getAttribute('href') === path) {
            link.classList.add('active');
        }
    });

    // ----- Quick console banner -----
    if (window.console) {
        console.log('%c RIWAQ ', 'background:#b8860b;color:#fff;padding:4px 12px;border-radius:4px;font-weight:bold;font-family:serif;', 'Premium Jewellery — Software Architecture Lab Project');
    }
})();
