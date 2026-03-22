/*  Custom cursor ─ */
(function(){
  var dot  = document.getElementById('cur-dot');
  var ring = document.getElementById('cur-ring');
  var mx = window.innerWidth / 2, my = window.innerHeight / 2;
  var rx = mx, ry = my;
  dot.style.left  = mx + 'px'; dot.style.top  = my + 'px';
  ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
  document.addEventListener('mousemove', function(e) {
    mx = e.clientX; my = e.clientY;
    dot.style.left = mx + 'px'; dot.style.top = my + 'px';
  });
  (function loop() {
    rx += (mx - rx) * 0.1;
    ry += (my - ry) * 0.1;
    ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
    requestAnimationFrame(loop);
  })();
  document.querySelectorAll('a, button, .b-card, .p-card, .proj-feat, .ach-card, .s-card').forEach(function(el) {
    el.addEventListener('mouseenter', function() { document.body.classList.add('hov'); });
    el.addEventListener('mouseleave', function() { document.body.classList.remove('hov'); });
  });
})();

/*  Nav: scroll shadow + active section highlight ─ */
var navEl = document.getElementById('nav');
var navAs = document.querySelectorAll('.nav-links a');
var secs  = document.querySelectorAll('section[id]');
function updateNav() {
  navEl.classList.toggle('scrolled', window.scrollY > 20);
  var cur = '';
  secs.forEach(function(s) { if (window.scrollY >= s.offsetTop - 100) cur = s.id; });
  navAs.forEach(function(a) { a.classList.toggle('act', a.getAttribute('href') === '#' + cur); });
}
window.addEventListener('scroll', updateNav, {passive: true});
updateNav();

/*  Mobile burger menu  */
var mobEl = document.getElementById('mob');
document.getElementById('burger').addEventListener('click', function() {
  mobEl.classList.toggle('open');
});
document.querySelectorAll('.ml').forEach(function(a) {
  a.addEventListener('click', function() { mobEl.classList.remove('open'); });
});

/*  Scroll-reveal (IntersectionObserver)  */
var ro = new IntersectionObserver(function(entries) {
  entries.forEach(function(e) {
    if (e.isIntersecting) { e.target.classList.add('on'); ro.unobserve(e.target); }
  });
}, { threshold: 0.07, rootMargin: '0px 0px -32px 0px' });
document.querySelectorAll('.r').forEach(function(el) { ro.observe(el); });

/*  Blog carousel ─ */
/*  Blog carousel ─ */
(function() {
  var track = document.getElementById('ctrack');
  var dots  = document.getElementById('cdots');
  var prev  = document.getElementById('cprev');
  var next  = document.getElementById('cnext');
  if (!track) return;
  var cards = Array.from(track.querySelectorAll('.b-card'));
  var idx = 0;
  var GAP = 20;

  cards.forEach(function(_, i) {
    var d = document.createElement('button');
    d.className = 'c-dot' + (i === 0 ? ' on' : '');
    d.setAttribute('aria-label', 'Slide ' + (i + 1));
    d.addEventListener('click', function() { go(i); });
    dots.appendChild(d);
  });

  function cw() { return (cards[0] ? cards[0].offsetWidth : 460) + GAP; }
  function maxI() {
    var vpW = track.parentElement.offsetWidth;
    var vis = Math.max(1, Math.floor((vpW + GAP) / cw()));
    return Math.max(0, cards.length - vis);
  }
  function go(n) {
    idx = Math.max(0, Math.min(n, maxI()));
    track.style.transform = 'translateX(-' + (idx * cw()) + 'px)';
    Array.from(dots.querySelectorAll('.c-dot')).forEach(function(d, i) {
      d.classList.toggle('on', i === idx);
    });
    prev.disabled = idx === 0;
    next.disabled = idx >= maxI();
  }

  prev.addEventListener('click', function() { go(idx - 1); });
  next.addEventListener('click', function() { go(idx + 1); });
  window.addEventListener('resize', function() { go(idx); });

  /* touch swipe */
  var sx = 0, sy = 0, drag = false;
  track.addEventListener('touchstart', function(e) {
    sx = e.touches[0].clientX; sy = e.touches[0].clientY; drag = true;
  }, { passive: true });
  track.addEventListener('touchmove', function(e) {
    if (!drag) return;
    var dx = Math.abs(e.touches[0].clientX - sx);
    var dy = Math.abs(e.touches[0].clientY - sy);
    if (dx > dy && dx > 8) e.preventDefault();
  }, { passive: false });
  track.addEventListener('touchend', function(e) {
    if (!drag) return; drag = false;
    var dx = sx - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 40) go(idx + (dx > 0 ? 1 : -1));
  });

  /*  overlay: horizontal drag to slide, vertical scroll passes through  */
  var odx = 0, ody = 0, odown = false, isHoriz = null;
  document.querySelectorAll('.li-overlay').forEach(function(ov) {
    ov.addEventListener('mousedown', function(e) {
      odown = true; odx = e.clientX; ody = e.clientY; isHoriz = null;
    });
    ov.addEventListener('mousemove', function(e) {
      if (!odown) return;
      var dx = e.clientX - odx;
      var dy = e.clientY - ody;
      if (isHoriz === null && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        isHoriz = Math.abs(dx) > Math.abs(dy);
      }
      if (isHoriz && Math.abs(dx) > 40) {
        go(idx + (dx < 0 ? 1 : -1));
        odown = false;
      }
    });
    ov.addEventListener('mouseup',    function() { odown = false; isHoriz = null; });
    ov.addEventListener('mouseleave', function() { odown = false; isHoriz = null; });

    /*  wheel: horizontal = slide, vertical = pass to page  */
    ov.addEventListener('wheel', function(e) {
      var absDX = Math.abs(e.deltaX);
      var absDY = Math.abs(e.deltaY);
      if (absDX > absDY && absDX > 5) {
        /* horizontal swipe — handle carousel */
        e.preventDefault();
        e.stopPropagation();
        var now = Date.now();
        if (now - lastWheel < 500) return;
        lastWheel = now;
        if (e.deltaX > 0) go(idx + 1);
        else              go(idx - 1);
      }
      /* vertical scroll — do nothing, browser handles it naturally */
    }, { passive: false });
  });

  /*  viewport wheel fallback (outside overlay area)  */
  var vp = track.parentElement;
  var lastWheel = 0;
  vp.addEventListener('wheel', function(e) {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    e.preventDefault();
    var now = Date.now();
    if (now - lastWheel < 500) return;
    lastWheel = now;
    if (e.deltaX > 20)       go(idx + 1);
    else if (e.deltaX < -20) go(idx - 1);
  }, { passive: false });

  go(0);
})();


/*  Contact form  */
function validEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

async function sendForm() {
  var fn = document.getElementById('fn').value.trim();
  var ln = document.getElementById('ln').value.trim();
  var em = document.getElementById('em').value.trim();
  var tp = document.getElementById('tp') ? document.getElementById('tp').value : 'General';
  var mg = document.getElementById('mg').value.trim();

  /* clear previous errors */
  ['fn', 'em', 'mg'].forEach(function(id) {
    document.getElementById(id).classList.remove('err');
    document.getElementById(id + '-e').classList.remove('show');
  });

  /* client-side validation */
  var ok = true;
  if (!fn)             { document.getElementById('fn').classList.add('err'); document.getElementById('fn-e').classList.add('show'); ok = false; }
  if (!validEmail(em)) { document.getElementById('em').classList.add('err'); document.getElementById('em-e').classList.add('show'); ok = false; }
  if (!mg)             { document.getElementById('mg').classList.add('err'); document.getElementById('mg-e').classList.add('show'); ok = false; }
  if (!ok) return;

  var btn  = document.getElementById('fbtn');
  var lbl  = document.getElementById('flbl');
  var spin = document.getElementById('fspin');
  var ico  = document.getElementById('fico');
  var fok  = document.getElementById('fok');

  btn.disabled = true;
  lbl.textContent = 'Sending\u2026';
  spin.style.display = 'block';
  ico.style.display  = 'none';

  try {
    var response = await fetch('/api/contact', {
      method  : 'POST',
      headers : { 'Content-Type': 'application/json' },
      body    : JSON.stringify({ firstName: fn, lastName: ln, email: em, topic: tp, message: mg })
    });
    var data = await response.json();

    if (data.ok) {
      lbl.textContent = 'Sent!';
      spin.style.display = 'none';
      fok.classList.add('show');
      setTimeout(function() {
        ['fn', 'ln', 'em', 'mg'].forEach(function(id) { document.getElementById(id).value = ''; });
        if (document.getElementById('tp')) document.getElementById('tp').selectedIndex = 0;
        btn.disabled = false;
        lbl.textContent = 'Send Message';
        ico.style.display = 'block';
        fok.classList.remove('show');
      }, 3000);
    } else {
      if (data.errors) {
        if (data.errors.firstName) { document.getElementById('fn').classList.add('err'); document.getElementById('fn-e').textContent = data.errors.firstName; document.getElementById('fn-e').classList.add('show'); }
        if (data.errors.email)     { document.getElementById('em').classList.add('err'); document.getElementById('em-e').textContent = data.errors.email;     document.getElementById('em-e').classList.add('show'); }
        if (data.errors.message)   { document.getElementById('mg').classList.add('err'); document.getElementById('mg-e').textContent = data.errors.message;   document.getElementById('mg-e').classList.add('show'); }
      }
      btn.disabled = false;
      lbl.textContent = 'Send Message';
      spin.style.display = 'none';
      ico.style.display  = 'block';
      if (data.error) alert(data.error);
    }
  } catch (err) {
    console.error('sendForm error:', err);
    btn.disabled = false;
    lbl.textContent = 'Send Message';
    spin.style.display = 'none';
    ico.style.display  = 'block';
    alert('Network error. Please email me directly at saichakrritadikonda@gmail.com');
  }
}

/*  Portrait slideshow — scroll driven  */
(function() {
  var slides  = document.querySelectorAll('.port-slide');
  var section = document.getElementById('about');
  if (!slides.length || !section) return;

  var current = 0;
  var total   = slides.length;
  var lastIdx = -1;

  function activate(idx) {
    if (idx === lastIdx) return;
    slides[lastIdx >= 0 ? lastIdx : 0].classList.remove('active');
    slides[idx].classList.add('active');
    lastIdx = idx;
  }

  window.addEventListener('scroll', function() {
    var rect     = section.getBoundingClientRect();
    var secH     = section.offsetHeight;
    // progress: 0 when section top hits viewport top → 1 when section bottom leaves
    var progress = Math.min(1, Math.max(0, -rect.top / (secH - window.innerHeight)));
    var idx      = Math.min(total - 1, Math.floor(progress * total));
    activate(idx);
  }, { passive: true });

  activate(0);
})();

/*  Hello cycling animation ─ */
(function () {
  var words = [
    { text: 'Hello',      lang: 'English'  },
    { text: 'नमस्ते',      lang: 'Hindi'    },
    { text: 'Hola',       lang: 'Spanish'  },
    { text: 'こんにちは',   lang: 'Japanese' },
    { text: 'Bonjour',    lang: 'French'   },
    { text: '你好',         lang: 'Chinese'  },
  ];

  var stage   = document.getElementById('helloStage');
  var wordEl  = document.getElementById('helloWord');
  var subEl   = document.getElementById('helloSub');
  var dotsEl  = document.getElementById('helloDots');
  if (!stage) return;

  var current = 0;
  var busy    = false;

  /* Build dots */
  words.forEach(function (_, i) {
    var d = document.createElement('span');
    d.className = 'hello-dot' + (i === 0 ? ' active' : '');
    dotsEl.appendChild(d);
  });

  var dots = dotsEl.querySelectorAll('.hello-dot');

  /* Set first word immediately */
  wordEl.textContent = words[0].text;
  wordEl.classList.add('enter');

  function advance() {
    if (busy) return;
    busy = true;

    var next = (current + 1) % words.length;

    /* Exit current */
    wordEl.classList.remove('enter');
    wordEl.classList.add('exit');

    setTimeout(function () {
      /* Swap text, reset classes, enter new */
      wordEl.classList.remove('exit');
      wordEl.textContent = words[next].text;

      /* Force reflow so animation restarts */
      void wordEl.offsetWidth;
      wordEl.classList.add('enter');

      /* Update sub-label and dots */
      subEl.textContent = 'a simple ' + words[next].lang + ' greeting';
      dots[current].classList.remove('active');
      dots[next].classList.add('active');

      current = next;
      busy = false;
    }, 420);
  }

  /* Auto-cycle every 1.8s */
  setInterval(advance, 1800);

  /* Also allow click/tap to advance */
  stage.style.cursor = 'pointer';
  stage.addEventListener('click', advance);
})();