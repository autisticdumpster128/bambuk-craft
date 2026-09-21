(function () {
  /* ——— scroll reveal ———
     Each element's stagger position is fixed at setup time, based on its order among
     its own sibling .reveal elements (i.e. its position within its own row/grid) —
     not on how the browser happens to batch IntersectionObserver callbacks. Batching
     varies with scroll speed, so a grid of many photos could reveal as one tidy wave
     or as several uneven clumps depending on how fast the person scrolled; a fixed
     sibling-based index cascades the same way every time. */
  var items = document.querySelectorAll('.reveal');
  items.forEach(function (el) {
    var siblings = Array.prototype.filter.call(el.parentElement.children, function (c) {
      return c.classList.contains('reveal');
    });
    var idx = siblings.indexOf(el);
    el.style.transitionDelay = Math.min(idx * 0.05, 0.4) + 's';
  });

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  /* ——— modals ——— */
  document.querySelectorAll('[data-open]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var dlg = document.getElementById(btn.getAttribute('data-open'));
      if (dlg && dlg.showModal) dlg.showModal();
    });
  });
  document.querySelectorAll('dialog').forEach(function (dlg) {
    dlg.querySelectorAll('[data-close]').forEach(function (b) {
      b.addEventListener('click', function () { dlg.close(); });
    });
    /* click outside the panel closes */
    dlg.addEventListener('click', function (e) {
      if (e.target === dlg || e.target.hasAttribute('data-lb-close')) dlg.close();
    });
  });

  /* ——— lightbox ——— */
  var lb = document.getElementById('lightbox');
  var lbImg = document.getElementById('lbImg');
  document.querySelectorAll('.zoom').forEach(function (box) {
    box.addEventListener('click', function () {
      var img = box.querySelector('img');
      if (!img || !lb.showModal) return;
      lbImg.src = img.currentSrc || img.src;
      lbImg.alt = img.alt || '';
      lb.showModal();
    });
  });

  /* ——— quantity stepper ——— */
  document.querySelectorAll('[data-step]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var input = btn.parentElement.querySelector('input[type="number"]');
      var step = parseInt(btn.getAttribute('data-step'), 10);
      var val = parseInt(input.value, 10);
      if (isNaN(val)) val = 1;
      input.value = Math.max(1, val + step);
    });
  });

  /* ——— hero parallax: background trails the scroll instead of moving 1:1 ——— */
  var heroWrap = document.getElementById('heroParallax');
  var heroSection = document.querySelector('section');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function heroParallax() {
    if (!heroWrap || !heroSection || reduceMotion) return;
    var h = heroSection.offsetHeight;
    var y = window.scrollY;
    if (y > h) return; // hero is out of view, nothing to update
    var offset = Math.min(y * 0.22, h * 0.06); // capped so the extended wrapper never runs out of cover
    heroWrap.style.transform = 'translateY(' + offset + 'px)';
  }

  /* ——— header: transparent over the hero, solid once you scroll past it ——— */
  var header = document.getElementById('siteHeader');
  var headerLogo = document.getElementById('headerLogo');
  function headerState() {
    var hero = document.querySelector('section');
    var limit = (hero ? hero.offsetHeight : window.innerHeight) - 90;
    var solid = window.scrollY > limit;
    header.classList.toggle('is-solid', solid);
    if (headerLogo) {
      headerLogo.src = solid ? 'images/logo/bambuk-logo.svg' : 'images/logo/bambuk-logo-white.svg';
    }
  }
  headerState();
  heroParallax();
  window.addEventListener('scroll', function () { headerState(); heroParallax(); }, { passive: true });
  window.addEventListener('resize', headerState);

  /* ——— order form: block submit until every required field is filled ——— */
  var orderForm = document.getElementById('orderForm');
  if (orderForm) {
    var requiredFields = ['o_name', 'o_phone', 'o_qty', 'o_msg'];

    function markField(id, bad) {
      var field = document.getElementById(id);
      var label = orderForm.querySelector('label[for="' + id + '"]');
      if (field) field.classList.toggle('field-invalid', bad);
      if (label) label.classList.toggle('lbl-invalid', bad);
    }

    function markWho(bad) {
      var fieldset = orderForm.querySelector('legend[data-req="who"]').closest('fieldset');
      var legend = orderForm.querySelector('legend[data-req="who"]');
      fieldset.classList.toggle('group-invalid', bad);
      legend.classList.toggle('lbl-invalid', bad);
    }

    orderForm.addEventListener('submit', function (evt) {
      var hasError = false;

      requiredFields.forEach(function (id) {
        var field = document.getElementById(id);
        var bad = field.value.trim() === '';
        markField(id, bad);
        if (bad) hasError = true;
      });

      var whoChosen = !!orderForm.querySelector('input[name="who"]:checked');
      markWho(!whoChosen);
      if (!whoChosen) hasError = true;

      if (hasError) {
        evt.preventDefault();
        var firstBad = orderForm.querySelector('.field-invalid, .group-invalid');
        if (firstBad) firstBad.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    });

    /* clear the red state the moment a field is fixed */
    requiredFields.forEach(function (id) {
      document.getElementById(id).addEventListener('input', function () {
        if (this.value.trim() !== '') markField(id, false);
      });
    });
    orderForm.querySelectorAll('input[name="who"]').forEach(function (radio) {
      radio.addEventListener('change', function () { markWho(false); });
    });
  }

  /* ——— language switcher ——— */
  var langButtons = document.querySelectorAll('[data-lang]');
  var heroBg = document.getElementById('heroBg');

  function updateHeroBg(code) {
    if (!heroBg) return;
    var src = heroBg.getAttribute('data-bg-' + code);
    if (src) heroBg.src = src;
  }

  /* ——— contact facts that differ per language: different phone numbers, a different
     sales contact person, and Telegram vs WhatsApp. This is data, not translation —
     kept separate from i18n.js on purpose. `cz` is filled in for when Czech text is
     ready; it's not wired to a header button yet. ——— */
  var CONTACTS = {
    ua: {
      social: 'telegram',
      officePhoneText: '+38 (093) 623 34 52', officePhoneTel: '+380936233452',
      salesPhone1Text: '+38 (068) 348 75 89', salesPhone1Tel: '+380683487589',
      salesPhone2Text: null, salesPhone2Tel: null,
      showZoreslavaPhone: true
    },
    en: {
      social: 'whatsapp',
      officePhoneText: '+48 535 678 099', officePhoneTel: '+48535678099',
      salesPhone1Text: '+38 093 728 18 23', salesPhone1Tel: '+380937281823',
      salesPhone2Text: null, salesPhone2Tel: null,
      showZoreslavaPhone: false
    },
    pl: {
      social: 'whatsapp',
      officePhoneText: '+48 535 678 099', officePhoneTel: '+48535678099',
      salesPhone1Text: '+48 535 678 099', salesPhone1Tel: '+48535678099',
      salesPhone2Text: '+38 067 208 86 82', salesPhone2Tel: '+380672088682',
      showZoreslavaPhone: false
    },
    cz: {
      social: 'whatsapp',
      officePhoneText: '+48 535 678 099', officePhoneTel: '+48535678099',
      salesPhone1Text: '+420 773 291 761', salesPhone1Tel: '+420773291761',
      salesPhone2Text: null, salesPhone2Tel: null,
      showZoreslavaPhone: false
    }
  };

  function setPhoneLink(id, text, tel) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    el.href = 'tel:' + tel;
  }

  function applyContactData(code) {
    var c = CONTACTS[code];
    if (!c) return;

    setPhoneLink('officePhone', c.officePhoneText, c.officePhoneTel);
    setPhoneLink('salesPhone1', c.salesPhone1Text, c.salesPhone1Tel);

    var p2 = document.getElementById('salesPhone2');
    if (p2) {
      if (c.salesPhone2Text) {
        setPhoneLink('salesPhone2', c.salesPhone2Text, c.salesPhone2Tel);
        p2.classList.remove('hidden');
      } else {
        p2.classList.add('hidden');
      }
    }

    var zw = document.getElementById('zoreslavaPhoneWrap');
    if (zw) zw.classList.toggle('hidden', !c.showZoreslavaPhone);

    ['hdr', 'contact'].forEach(function (prefix) {
      var tg = document.getElementById(prefix + 'Telegram');
      var wa = document.getElementById(prefix + 'Whatsapp');
      if (!tg || !wa) return;
      tg.classList.toggle('hidden', c.social !== 'telegram');
      wa.classList.toggle('hidden', c.social !== 'whatsapp');
    });
  }

  function setLang(code) {
    var dict = (window.I18N || {})[code];
    if (!dict) return;

    document.documentElement.lang = { ua: 'uk', cz: 'cs' }[code] || code;
    updateHeroBg(code);
    applyContactData(code);

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var v = dict[el.getAttribute('data-i18n')];
      if (v !== undefined) el.textContent = v;
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var v = dict[el.getAttribute('data-i18n-html')];
      if (v !== undefined) el.innerHTML = v;
    });

    langButtons.forEach(function (b) {
      var on = b.getAttribute('data-lang') === code;
      b.classList.toggle('is-active', on);
      if (on) b.setAttribute('aria-current', 'true');
      else b.removeAttribute('aria-current');
    });
  }
  langButtons.forEach(function (b) {
    b.addEventListener('click', function () { setLang(b.getAttribute('data-lang')); });
  });
})();
