(function () {
  'use strict';

  var RZP_KEY = 'rzp_live_TBJWqDQ742pLrm';

  // ── Load Razorpay checkout script ──────────────────────────────────────────
  var rzpScript = document.createElement('script');
  rzpScript.src = 'https://checkout.razorpay.com/v1/checkout.js';
  document.head.appendChild(rzpScript);

  var root = document.getElementById('shop-root');
  if (!root || typeof CLASSY_YOU_PRODUCTS === 'undefined') return;

  var category = root.dataset.category;
  var currentSort = 'featured';

  // ── Filter & sort ──────────────────────────────────────────────────────────
  function getProducts(sort) {
    var list = category === 'new-arrivals'
      ? CLASSY_YOU_PRODUCTS.slice()
      : CLASSY_YOU_PRODUCTS.filter(function (p) { return p.category === category; });

    if (sort === 'price-asc') list.sort(function (a, b) { return a.price - b.price; });
    else if (sort === 'price-desc') list.sort(function (a, b) { return b.price - a.price; });
    else list.sort(function (a, b) { return (b.featured ? 1 : 0) - (a.featured ? 1 : 0); });

    return list;
  }

  function fmt(n) {
    return '₹' + n.toLocaleString('en-IN');
  }

  // ── Render toolbar ─────────────────────────────────────────────────────────
  function renderToolbar(count) {
    return '<div class="shop-toolbar">'
      + '<p class="shop-count">' + count + ' item' + (count !== 1 ? 's' : '') + '</p>'
      + '<select class="shop-sort" id="cyShopSort">'
      + '<option value="featured">Featured</option>'
      + '<option value="price-asc">Price: Low to High</option>'
      + '<option value="price-desc">Price: High to Low</option>'
      + '</select>'
      + '</div>';
  }

  // ── Render single card ─────────────────────────────────────────────────────
  function renderCard(p, idx) {
    var delay = (idx % 6) * 60;
    return '<div class="shop-card reveal" style="transition-delay:' + delay + 'ms" data-id="' + p.id + '">'
      + '<div class="shop-card-img">'
      + (p.badge ? '<span class="shop-card-badge">' + p.badge + '</span>' : '')
      + '<img src="' + p.image + '" alt="' + p.name + '" loading="lazy" />'
      + '<button class="shop-card-quick cy-quick-btn">Buy Now</button>'
      + '</div>'
      + '<div class="shop-card-body">'
      + '<h3 class="shop-card-name">' + p.name + '</h3>'
      + '<p class="shop-card-price">' + fmt(p.price) + '</p>'
      + '<button class="shop-card-cta cy-order-btn">Buy Now</button>'
      + '</div>'
      + '</div>';
  }

  // ── Render grid ────────────────────────────────────────────────────────────
  function render() {
    var products = getProducts(currentSort);
    root.innerHTML = renderToolbar(products.length)
      + '<div class="shop-grid">' + products.map(renderCard).join('') + '</div>';

    var sel = document.getElementById('cyShopSort');
    if (sel) {
      sel.value = currentSort;
      sel.addEventListener('change', function () {
        currentSort = this.value;
        render();
      });
    }

    root.querySelectorAll('.cy-quick-btn, .cy-order-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openModal(btn.closest('.shop-card').dataset.id);
      });
    });

    requestAnimationFrame(function () {
      root.querySelectorAll('.reveal').forEach(function (el) {
        el.classList.add('revealed');
      });
    });
  }

  // ── Size picker modal ──────────────────────────────────────────────────────
  function openModal(id) {
    var p = CLASSY_YOU_PRODUCTS.find(function (x) { return x.id === id; });
    if (!p) return;

    var existing = document.getElementById('cyModal');
    if (existing) existing.remove();

    var sizeButtons = p.sizes.map(function (s) {
      return '<button class="size-btn cy-size-btn" data-size="' + s + '">' + s + '</button>';
    }).join('');

    var modal = document.createElement('div');
    modal.id = 'cyModal';
    modal.className = 'size-modal-overlay';
    modal.innerHTML =
      '<div class="size-modal" role="dialog" aria-modal="true">'
      + '<button class="size-modal-close" id="cyModalClose" aria-label="Close">'
      + '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
      + '</button>'
      + '<img src="' + p.image + '" alt="' + p.name + '" class="size-modal-img" />'
      + '<div class="size-modal-body">'
      + (p.badge ? '<span class="size-modal-badge">' + p.badge + '</span>' : '')
      + '<h3 class="size-modal-name">' + p.name + '</h3>'
      + '<p class="size-modal-price">' + fmt(p.price) + '</p>'
      + '<p class="size-modal-desc">' + p.description + '</p>'
      + '<p class="size-modal-label">Select your size</p>'
      + '<div class="size-options">' + sizeButtons + '</div>'
      + '<div id="cyPayBtn" style="display:none;margin-top:16px;">'
      + '<button class="cy-rzp-pay-btn">Pay ' + fmt(p.price) + ' — Secure Checkout</button>'
      + '</div>'
      + '<p class="size-modal-secure">🔒 Secured by Razorpay · UPI · Cards · NetBanking</p>'
      + '</div>'
      + '</div>';

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    requestAnimationFrame(function () { modal.classList.add('open'); });

    document.getElementById('cyModalClose').addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', handleEsc);

    var selectedSize = null;

    modal.querySelectorAll('.cy-size-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        modal.querySelectorAll('.cy-size-btn').forEach(function (b) { b.classList.remove('selected'); });
        btn.classList.add('selected');
        selectedSize = btn.dataset.size;
        document.getElementById('cyPayBtn').style.display = '';
      });
    });

    modal.querySelector('.cy-rzp-pay-btn').addEventListener('click', function () {
      if (!selectedSize) return;
      closeModal();
      openRazorpay(p, selectedSize);
    });
  }

  // ── Razorpay checkout ──────────────────────────────────────────────────────
  function openRazorpay(p, size) {
    var options = {
      key: RZP_KEY,
      amount: p.price * 100,
      currency: 'INR',
      name: 'Classy You',
      description: p.name + ' — Size ' + size,
      image: 'WhatsApp Image 2026-07-01 at 14.09.15.jpeg',
      handler: function (response) {
        showSuccess(p, size, response.razorpay_payment_id);
      },
      prefill: { name: '', email: '', contact: '' },
      theme: { color: '#8B6B4A' },
      modal: { backdropclose: false }
    };

    var rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function (response) {
      alert('Payment failed: ' + response.error.description + '\nPlease try again.');
    });
    rzp.open();
  }

  // ── Order success screen ───────────────────────────────────────────────────
  function showSuccess(p, size, paymentId) {
    var existing = document.getElementById('cySuccess');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.id = 'cySuccess';
    overlay.className = 'success-overlay';
    overlay.innerHTML =
      '<div class="success-box">'
      + '<div class="success-icon">✓</div>'
      + '<h2>Order Confirmed!</h2>'
      + '<p>Thank you for your purchase.</p>'
      + '<div class="success-details">'
      + '<p><strong>' + p.name + '</strong> — Size ' + size + '</p>'
      + '<p>' + fmt(p.price) + '</p>'
      + '<p class="success-pid">Payment ID: ' + paymentId + '</p>'
      + '</div>'
      + '<p class="success-note">We\'ll reach out on WhatsApp shortly to confirm your delivery address.</p>'
      + '<button class="success-close" id="cySuccessClose">Continue Shopping</button>'
      + '</div>';

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    requestAnimationFrame(function () { overlay.classList.add('open'); });

    document.getElementById('cySuccessClose').addEventListener('click', function () {
      overlay.classList.remove('open');
      setTimeout(function () { overlay.remove(); document.body.style.overflow = ''; }, 300);
    });
  }

  function closeModal() {
    var modal = document.getElementById('cyModal');
    if (!modal) return;
    modal.classList.remove('open');
    setTimeout(function () { modal.remove(); document.body.style.overflow = ''; }, 250);
    document.removeEventListener('keydown', handleEsc);
  }

  function handleEsc(e) { if (e.key === 'Escape') closeModal(); }

  render();
})();
