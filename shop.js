(function () {
  'use strict';

  var root = document.getElementById('shop-root');
  if (!root || typeof CLASSY_YOU_PRODUCTS === 'undefined') return;

  var category = root.dataset.category;
  var currentSort = 'featured';
  var selectedSizes = {};

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

  // ── Format price ───────────────────────────────────────────────────────────
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
      + '<button class="shop-card-quick cy-quick-btn">Order Now</button>'
      + '</div>'
      + '<div class="shop-card-body">'
      + '<h3 class="shop-card-name">' + p.name + '</h3>'
      + '<p class="shop-card-price">' + fmt(p.price) + '</p>'
      + '<button class="shop-card-cta cy-order-btn">Order on WhatsApp</button>'
      + '</div>'
      + '</div>';
  }

  // ── Render grid ────────────────────────────────────────────────────────────
  function render() {
    var products = getProducts(currentSort);
    root.innerHTML = renderToolbar(products.length)
      + '<div class="shop-grid">' + products.map(renderCard).join('') + '</div>';

    // Set sort dropdown to current value
    var sel = document.getElementById('cyShopSort');
    if (sel) sel.value = currentSort;

    // Bind sort change
    if (sel) {
      sel.addEventListener('change', function () {
        currentSort = this.value;
        render();
      });
    }

    // Bind card buttons
    root.querySelectorAll('.cy-quick-btn, .cy-order-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var card = btn.closest('.shop-card');
        openModal(card.dataset.id);
      });
    });

    // Trigger reveal
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
      '<div class="size-modal" role="dialog" aria-modal="true" aria-label="Select size for ' + p.name + '">'
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
      + '<div class="size-modal-confirm" id="cyOrderConfirm" style="display:none">'
      + '<a href="#" class="btn-primary cy-confirm-order" target="_blank">Confirm Order on WhatsApp</a>'
      + '</div>'
      + '<a href="https://wa.me/917042299855?text=' + encodeURIComponent('Hi Classy You! I\'m interested in the ' + p.name + '.') + '" target="_blank" class="size-modal-wa-link">Chat without selecting size</a>'
      + '</div>'
      + '</div>';

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    // Animate in
    requestAnimationFrame(function () {
      modal.classList.add('open');
    });

    // Close button
    document.getElementById('cyModalClose').addEventListener('click', closeModal);

    // Click outside
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal();
    });

    // ESC key
    document.addEventListener('keydown', handleEsc);

    // Size selection
    modal.querySelectorAll('.cy-size-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        modal.querySelectorAll('.cy-size-btn').forEach(function (b) { b.classList.remove('selected'); });
        btn.classList.add('selected');
        var size = btn.dataset.size;
        var msg = 'Hi Classy You! I\'d like to order the ' + p.name + ' in size ' + size + '. 😊';
        var confirm = document.getElementById('cyOrderConfirm');
        var link = confirm.querySelector('.cy-confirm-order');
        link.href = 'https://wa.me/917042299855?text=' + encodeURIComponent(msg);
        confirm.style.display = '';
      });
    });
  }

  function closeModal() {
    var modal = document.getElementById('cyModal');
    if (!modal) return;
    modal.classList.remove('open');
    setTimeout(function () {
      modal.remove();
      document.body.style.overflow = '';
    }, 250);
    document.removeEventListener('keydown', handleEsc);
  }

  function handleEsc(e) {
    if (e.key === 'Escape') closeModal();
  }

  // ── Boot ───────────────────────────────────────────────────────────────────
  render();
})();
