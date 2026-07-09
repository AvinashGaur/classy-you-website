(function () {
  'use strict';

  var RZP_KEY = 'rzp_live_TBJWqDQ742pLrm';
  var SHEET_URL = 'https://script.google.com/macros/s/AKfycbzucPByCxE2U-Vb3Y-YhWDLzrrm062TUClOSh6kx7XrvqtToCiXEzjWyCgPeEDH_Xeb/exec';

  var rzpScript = document.createElement('script');
  rzpScript.src = 'https://checkout.razorpay.com/v1/checkout.js';
  document.head.appendChild(rzpScript);

  if (typeof CLASSY_YOU_PRODUCTS === 'undefined') return;

  var root = document.getElementById('shop-root');
  var category = root ? root.dataset.category : null;
  var currentSort = 'featured';

  function fmt(n) { return '₹' + n.toLocaleString('en-IN'); }

  // ── Cart ──────────────────────────────────────────────────────────────────────
  function getCart() {
    try { return JSON.parse(localStorage.getItem('cy_cart') || '[]'); } catch (e) { return []; }
  }

  function saveCart(cart) {
    try { localStorage.setItem('cy_cart', JSON.stringify(cart)); } catch (e) {}
    updateCartBadge();
  }

  function addToCart(p, size) {
    var cart = getCart();
    var existing = cart.find(function (i) { return i.id === p.id && i.size === size; });
    if (existing) {
      existing.qty = (existing.qty || 1) + 1;
    } else {
      cart.push({ id: p.id, name: p.name, price: p.price, size: size, image: p.image, qty: 1 });
    }
    saveCart(cart);
    showAddedToast(p.name, size);
  }

  function removeCartItem(index) {
    var cart = getCart();
    cart.splice(index, 1);
    saveCart(cart);
    renderCartDrawer();
  }

  function cartTotal() {
    return getCart().reduce(function (s, i) { return s + i.price * (i.qty || 1); }, 0);
  }

  function updateCartBadge() {
    var badge = document.getElementById('cyCartBadge');
    if (!badge) return;
    var count = getCart().reduce(function (s, i) { return s + (i.qty || 1); }, 0);
    badge.textContent = count;
    badge.style.display = count > 0 ? '' : 'none';
  }

  // ── Toast ─────────────────────────────────────────────────────────────────────
  function showAddedToast(name, size) {
    var existing = document.getElementById('cyToast');
    if (existing) existing.remove();
    var toast = document.createElement('div');
    toast.id = 'cyToast';
    toast.className = 'cart-toast';
    toast.textContent = name + ' (Size ' + size + ') added to cart!';
    document.body.appendChild(toast);
    requestAnimationFrame(function () { toast.classList.add('show'); });
    setTimeout(function () {
      toast.classList.remove('show');
      setTimeout(function () { if (toast.parentNode) toast.remove(); }, 300);
    }, 2500);
  }

  // ── Cart Drawer ───────────────────────────────────────────────────────────────
  function injectCartDrawer() {
    if (document.getElementById('cyCartDrawer')) return;
    var el = document.createElement('div');
    el.id = 'cyCartDrawer';
    el.className = 'cart-drawer';
    el.innerHTML =
      '<div class="cart-drawer-overlay" onclick="closeCart()"></div>'
      + '<div class="cart-drawer-panel">'
      + '<div class="cart-drawer-header"><h3>Your Cart</h3>'
      + '<button class="cart-drawer-close" onclick="closeCart()">✕</button></div>'
      + '<div class="cart-drawer-items" id="cyCartItems"></div>'
      + '<div class="cart-drawer-footer" id="cyCartFooter"></div>'
      + '</div>';
    document.body.appendChild(el);
  }

  function renderCartDrawer() {
    var cart = getCart();
    var itemsEl = document.getElementById('cyCartItems');
    var footerEl = document.getElementById('cyCartFooter');
    if (!itemsEl || !footerEl) return;

    if (!cart.length) {
      itemsEl.innerHTML = '<p class="cart-empty">Your cart is empty.</p>';
      footerEl.innerHTML = '';
      return;
    }

    itemsEl.innerHTML = cart.map(function (item, i) {
      return '<div class="cart-item">'
        + '<img src="' + item.image + '" class="cart-item-img" />'
        + '<div class="cart-item-info">'
        + '<p class="cart-item-name">' + item.name + '</p>'
        + '<p class="cart-item-meta">Size: ' + item.size + ' &times; ' + (item.qty || 1) + '</p>'
        + '<p class="cart-item-price">' + fmt(item.price * (item.qty || 1)) + '</p>'
        + '</div>'
        + '<button class="cart-item-remove" onclick="removeCartItem(' + i + ')">✕</button>'
        + '</div>';
    }).join('');

    footerEl.innerHTML =
      '<div class="cart-total"><span>Total</span><span>' + fmt(cartTotal()) + '</span></div>'
      + '<button class="cart-checkout-btn" onclick="startCartCheckout()">Proceed to Checkout</button>'
      + '<p class="cart-secure">🔒 Secured by Razorpay</p>';
  }

  function openCart() {
    injectCartDrawer();
    renderCartDrawer();
    requestAnimationFrame(function () {
      document.getElementById('cyCartDrawer').classList.add('open');
    });
    document.body.style.overflow = 'hidden';
  }

  function closeCart() {
    var drawer = document.getElementById('cyCartDrawer');
    if (drawer) drawer.classList.remove('open');
    document.body.style.overflow = '';
  }

  // ── Cart Checkout ─────────────────────────────────────────────────────────────
  function startCartCheckout() {
    var cart = getCart();
    if (!cart.length) return;
    closeCart();
    openCartCheckoutModal(cart);
  }

  function openCartCheckoutModal(cart) {
    var existing = document.getElementById('cyModal');
    if (existing) existing.remove();

    var itemsList = cart.map(function (i) {
      return '<div class="cart-summary-item"><span>' + i.name + ' (Size ' + i.size + ') &times;' + (i.qty || 1) + '</span><span>' + fmt(i.price * (i.qty || 1)) + '</span></div>';
    }).join('');

    var total = cartTotal();
    var modal = document.createElement('div');
    modal.id = 'cyModal';
    modal.className = 'size-modal-overlay';
    modal.innerHTML =
      '<div class="size-modal" role="dialog" aria-modal="true">'
      + '<button class="size-modal-close" id="cyModalClose" aria-label="Close">'
      + '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
      + '</button>'
      + '<div class="size-modal-body" style="padding-top:40px">'
      + '<h3 class="size-modal-name">Order Summary</h3>'
      + '<div class="cart-summary-list">' + itemsList + '</div>'
      + '<div class="cart-summary-total"><span>Total</span><span>' + fmt(total) + '</span></div>'
      + '<p class="cy-form-title">Delivery Details</p>'
      + '<input class="cy-field" id="cyName" type="text" placeholder="Full Name *" autocomplete="name" />'
      + '<input class="cy-field" id="cyPhone" type="tel" placeholder="Mobile Number *" autocomplete="tel" />'
      + '<textarea class="cy-field" id="cyAddress" placeholder="Street / House Address *" rows="2"></textarea>'
      + '<div class="cy-field-row">'
      + '<input class="cy-field" id="cyCity" type="text" placeholder="City *" />'
      + '<input class="cy-field" id="cyPincode" type="text" placeholder="Pincode *" maxlength="6" />'
      + '</div>'
      + '<div id="cyPayBtn" style="display:none;margin-top:16px;">'
      + '<button class="cy-rzp-pay-btn">Pay ' + fmt(total) + ' — Secure Checkout</button>'
      + '</div>'
      + '<p class="size-modal-secure">🔒 Secured by Razorpay · UPI · Cards · NetBanking</p>'
      + '</div></div>';

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () { modal.classList.add('open'); });

    document.getElementById('cyModalClose').addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', handleEsc);

    function checkReady() {
      var name = (document.getElementById('cyName').value || '').trim();
      var phone = (document.getElementById('cyPhone').value || '').trim();
      var address = (document.getElementById('cyAddress').value || '').trim();
      var city = (document.getElementById('cyCity').value || '').trim();
      var pincode = (document.getElementById('cyPincode').value || '').trim();
      document.getElementById('cyPayBtn').style.display =
        (name && phone.length >= 10 && address && city && pincode.length >= 6) ? '' : 'none';
    }

    ['cyName', 'cyPhone', 'cyAddress', 'cyCity', 'cyPincode'].forEach(function (fid) {
      document.getElementById(fid).addEventListener('input', checkReady);
    });

    modal.querySelector('.cy-rzp-pay-btn').addEventListener('click', function () {
      var customer = {
        name: document.getElementById('cyName').value.trim(),
        phone: document.getElementById('cyPhone').value.trim(),
        address: document.getElementById('cyAddress').value.trim(),
        city: document.getElementById('cyCity').value.trim(),
        pincode: document.getElementById('cyPincode').value.trim()
      };
      closeModal();
      openCartRazorpay(cart, customer);
    });
  }

  function openCartRazorpay(cart, customer) {
    var total = cartTotal();
    var desc = cart.map(function (i) { return i.name + '(' + i.size + ')'; }).join(', ');
    var options = {
      key: RZP_KEY,
      amount: total * 100,
      currency: 'INR',
      name: 'Classy You',
      description: desc,
      image: 'WhatsApp Image 2026-07-01 at 14.09.15.jpeg',
      handler: function (response) {
        var pid = response.razorpay_payment_id;
        cart.forEach(function (item) {
          saveOrder(item, item.size, customer, pid);
        });
        saveCart([]);
        var itemLines = cart.map(function (i) {
          return '• ' + i.name + ' (Size ' + i.size + ') ×' + (i.qty || 1) + ' — ' + fmt(i.price * (i.qty || 1));
        }).join('\n');
        var waMsg = 'New Order! 🛍️'
          + '\n\n' + itemLines
          + '\n\nTotal: ' + fmt(total)
          + '\nPayment ID: ' + pid
          + '\n\n👤 Customer:'
          + '\nName: ' + customer.name
          + '\nPhone: ' + customer.phone
          + '\nAddress: ' + customer.address + ', ' + customer.city + ' — ' + customer.pincode;
        openWhatsApp(waMsg);
        showCartSuccess(cart, total, customer, pid, waMsg);
      },
      prefill: { name: customer.name, email: '', contact: customer.phone },
      theme: { color: '#8B6B4A' },
      modal: { backdropclose: false }
    };
    var rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function (r) { alert('Payment failed: ' + r.error.description + '\nPlease try again.'); });
    rzp.open();
  }

  function showCartSuccess(cart, total, customer, paymentId, waMsg) {
    var existing = document.getElementById('cySuccess');
    if (existing) existing.remove();
    var waUrl = 'https://wa.me/917042299855?text=' + encodeURIComponent(waMsg);
    var itemLines = cart.map(function (i) {
      return '<p>' + i.name + ' (Size ' + i.size + ') &times;' + (i.qty || 1) + ' — ' + fmt(i.price * (i.qty || 1)) + '</p>';
    }).join('');
    var overlay = document.createElement('div');
    overlay.id = 'cySuccess';
    overlay.className = 'success-overlay';
    overlay.innerHTML =
      '<div class="success-box">'
      + '<div class="success-icon">✓</div>'
      + '<h2>Order Confirmed!</h2>'
      + '<p>Thank you, <strong>' + customer.name + '</strong>!</p>'
      + '<div class="success-details">' + itemLines
      + '<p>' + fmt(total) + '</p>'
      + '<p>Deliver to: ' + customer.address + ', ' + customer.city + ' ' + customer.pincode + '</p>'
      + '<p class="success-pid">Payment ID: ' + paymentId + '</p>'
      + '</div>'
      + '<a href="' + waUrl + '" target="_blank" class="success-wa-btn">📲 Send Order on WhatsApp</a>'
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

  // ── WhatsApp helper ───────────────────────────────────────────────────────────
  function openWhatsApp(msg) {
    var a = document.createElement('a');
    a.href = 'https://wa.me/917042299855?text=' + encodeURIComponent(msg);
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { if (a.parentNode) a.remove(); }, 200);
  }

  // ── Shop Grid ─────────────────────────────────────────────────────────────────
  function getProducts(sort) {
    var list = category === 'new-arrivals'
      ? CLASSY_YOU_PRODUCTS.slice()
      : CLASSY_YOU_PRODUCTS.filter(function (p) { return p.category === category; });
    if (sort === 'price-asc') list.sort(function (a, b) { return a.price - b.price; });
    else if (sort === 'price-desc') list.sort(function (a, b) { return b.price - a.price; });
    else list.sort(function (a, b) { return (b.featured ? 1 : 0) - (a.featured ? 1 : 0); });
    return list;
  }

  function renderToolbar(count) {
    return '<div class="shop-toolbar">'
      + '<p class="shop-count">' + count + ' item' + (count !== 1 ? 's' : '') + '</p>'
      + '<select class="shop-sort" id="cyShopSort">'
      + '<option value="featured">Featured</option>'
      + '<option value="price-asc">Price: Low to High</option>'
      + '<option value="price-desc">Price: High to Low</option>'
      + '</select></div>';
  }

  function renderCard(p, idx) {
    var delay = (idx % 6) * 60;
    return '<div class="shop-card reveal" style="transition-delay:' + delay + 'ms" data-id="' + p.id + '">'
      + '<div class="shop-card-img">'
      + (p.badge ? '<span class="shop-card-badge">' + p.badge + '</span>' : '')
      + '<img src="' + p.image + '" alt="' + p.name + '" loading="lazy" />'
      + '<button class="shop-card-quick cy-quick-btn">Quick View</button>'
      + '</div>'
      + '<div class="shop-card-body">'
      + '<h3 class="shop-card-name">' + p.name + '</h3>'
      + '<p class="shop-card-price">' + fmt(p.price) + '</p>'
      + '<button class="shop-card-cta cy-order-btn">Add to Cart</button>'
      + '</div></div>';
  }

  function render() {
    if (!root) return;
    var products = getProducts(currentSort);
    root.innerHTML = renderToolbar(products.length)
      + '<div class="shop-grid">' + products.map(renderCard).join('') + '</div>';
    var sel = document.getElementById('cyShopSort');
    if (sel) {
      sel.value = currentSort;
      sel.addEventListener('change', function () { currentSort = this.value; render(); });
    }
    root.querySelectorAll('.cy-quick-btn, .cy-order-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openModal(btn.closest('.shop-card').dataset.id);
      });
    });
    requestAnimationFrame(function () {
      root.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('revealed'); });
    });
  }

  // ── Single Product Modal ──────────────────────────────────────────────────────
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
      + '<p class="size-modal-label">Select your size</p>'
      + '<div class="size-options">' + sizeButtons + '</div>'
      // Add to Cart button — shown once size is selected
      + '<div id="cyAddToCartBtn" style="display:none;margin-top:14px;">'
      + '<button class="cy-add-cart-btn">Add to Cart</button>'
      + '</div>'
      // Delivery form — shown after size selected
      + '<div id="cyDeliveryForm" style="display:none">'
      + '<p class="cy-form-title">— or Buy Now — Delivery Details</p>'
      + '<input class="cy-field" id="cyName" type="text" placeholder="Full Name *" autocomplete="name" />'
      + '<input class="cy-field" id="cyPhone" type="tel" placeholder="Mobile Number *" autocomplete="tel" />'
      + '<textarea class="cy-field" id="cyAddress" placeholder="Street / House Address *" rows="2"></textarea>'
      + '<div class="cy-field-row">'
      + '<input class="cy-field" id="cyCity" type="text" placeholder="City *" />'
      + '<input class="cy-field" id="cyPincode" type="text" placeholder="Pincode *" maxlength="6" />'
      + '</div>'
      + '</div>'
      + '<div id="cyPayBtn" style="display:none;margin-top:16px;">'
      + '<button class="cy-rzp-pay-btn">Pay ' + fmt(p.price) + ' — Secure Checkout</button>'
      + '</div>'
      + '<p class="size-modal-secure">🔒 Secured by Razorpay · UPI · Cards · NetBanking</p>'
      + '</div></div>';

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () { modal.classList.add('open'); });

    document.getElementById('cyModalClose').addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', handleEsc);

    var selectedSize = null;

    function checkReady() {
      var name = (document.getElementById('cyName').value || '').trim();
      var phone = (document.getElementById('cyPhone').value || '').trim();
      var address = (document.getElementById('cyAddress').value || '').trim();
      var city = (document.getElementById('cyCity').value || '').trim();
      var pincode = (document.getElementById('cyPincode').value || '').trim();
      document.getElementById('cyPayBtn').style.display =
        (selectedSize && name && phone.length >= 10 && address && city && pincode.length >= 6) ? '' : 'none';
    }

    modal.querySelectorAll('.cy-size-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        modal.querySelectorAll('.cy-size-btn').forEach(function (b) { b.classList.remove('selected'); });
        btn.classList.add('selected');
        selectedSize = btn.dataset.size;
        document.getElementById('cyAddToCartBtn').style.display = '';
        document.getElementById('cyDeliveryForm').style.display = '';
        checkReady();
      });
    });

    ['cyName', 'cyPhone', 'cyAddress', 'cyCity', 'cyPincode'].forEach(function (fid) {
      document.getElementById(fid).addEventListener('input', checkReady);
    });

    // Add to Cart button
    modal.querySelector('.cy-add-cart-btn').addEventListener('click', function () {
      if (!selectedSize) return;
      addToCart(p, selectedSize);
      closeModal();
    });

    modal.querySelector('.cy-rzp-pay-btn').addEventListener('click', function () {
      if (!selectedSize) return;
      var customer = {
        name: document.getElementById('cyName').value.trim(),
        phone: document.getElementById('cyPhone').value.trim(),
        address: document.getElementById('cyAddress').value.trim(),
        city: document.getElementById('cyCity').value.trim(),
        pincode: document.getElementById('cyPincode').value.trim()
      };
      closeModal();
      openRazorpay(p, selectedSize, customer);
    });
  }

  // ── Single Product Razorpay ───────────────────────────────────────────────────
  function openRazorpay(p, size, customer) {
    var options = {
      key: RZP_KEY,
      amount: p.price * 100,
      currency: 'INR',
      name: 'Classy You',
      description: p.name + ' — Size ' + size,
      image: 'WhatsApp Image 2026-07-01 at 14.09.15.jpeg',
      handler: function (response) {
        var pid = response.razorpay_payment_id;
        saveOrder(p, size, customer, pid);
        var waMsg = 'New Order! 🎉'
          + '\n\nProduct: ' + p.name + ' (Size ' + size + ')'
          + '\nAmount: ' + fmt(p.price)
          + '\nPayment ID: ' + pid
          + '\n\n👤 Customer:'
          + '\nName: ' + customer.name
          + '\nPhone: ' + customer.phone
          + '\nAddress: ' + customer.address + ', ' + customer.city + ' — ' + customer.pincode;
        openWhatsApp(waMsg);
        showSuccess(p, size, customer, pid, waMsg);
      },
      prefill: { name: customer.name, email: '', contact: customer.phone },
      theme: { color: '#8B6B4A' },
      modal: { backdropclose: false }
    };
    var rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function (r) {
      alert('Payment failed: ' + r.error.description + '\nPlease try again.');
    });
    rzp.open();
  }

  // ── Save Order ────────────────────────────────────────────────────────────────
  function saveOrder(p, size, customer, paymentId) {
    var address = customer.address + ', ' + customer.city + ' — ' + customer.pincode;
    var params = new URLSearchParams({
      action: 'saveOrder',
      paymentId: paymentId,
      product: p.name,
      size: size,
      price: p.price,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerAddress: address
    });
    fetch(SHEET_URL + '?' + params.toString()).catch(function () {});
    try {
      var orders = JSON.parse(localStorage.getItem('cy_orders') || '[]');
      orders.unshift({ date: new Date().toISOString(), paymentId: paymentId, product: p.name, size: size, price: p.price, customerName: customer.name, customerPhone: customer.phone, customerAddress: address });
      if (orders.length > 300) orders = orders.slice(0, 300);
      localStorage.setItem('cy_orders', JSON.stringify(orders));
    } catch (e) {}
  }

  // ── Success Screen ────────────────────────────────────────────────────────────
  function showSuccess(p, size, customer, paymentId, waMsg) {
    var existing = document.getElementById('cySuccess');
    if (existing) existing.remove();
    var waUrl = 'https://wa.me/917042299855?text=' + encodeURIComponent(waMsg);
    var overlay = document.createElement('div');
    overlay.id = 'cySuccess';
    overlay.className = 'success-overlay';
    overlay.innerHTML =
      '<div class="success-box">'
      + '<div class="success-icon">✓</div>'
      + '<h2>Order Confirmed!</h2>'
      + '<p>Thank you, <strong>' + customer.name + '</strong>!</p>'
      + '<div class="success-details">'
      + '<p><strong>' + p.name + '</strong> — Size ' + size + '</p>'
      + '<p>' + fmt(p.price) + '</p>'
      + '<p>Deliver to: ' + customer.address + ', ' + customer.city + ' ' + customer.pincode + '</p>'
      + '<p class="success-pid">Payment ID: ' + paymentId + '</p>'
      + '</div>'
      + '<a href="' + waUrl + '" target="_blank" class="success-wa-btn">📲 Send Order on WhatsApp</a>'
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

  // ── Init ──────────────────────────────────────────────────────────────────────
  updateCartBadge();
  window.openModal = openModal;
  window.openCart = openCart;
  window.closeCart = closeCart;
  window.removeCartItem = removeCartItem;
  window.startCartCheckout = startCartCheckout;
  if (root) render();
})();
