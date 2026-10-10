(function () {
  function initials(name) {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(s => s.replace(/[^\p{L}]/gu, "").charAt(0).toUpperCase())
      .join("");
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function renderPerson(p) {
    const wrap = el("article", "person");

    const photo = el("div", "photo");
    if (p.photo) {
      const img = document.createElement("img");
      img.alt = p.name;
      img.loading = "lazy";
      img.src = p.photo;
      img.onerror = () => {
        photo.classList.add("placeholder");
        photo.setAttribute("data-initials", initials(p.name));
        img.remove();
      };
      photo.appendChild(img);
    } else {
      photo.classList.add("placeholder");
      photo.setAttribute("data-initials", initials(p.name));
    }
    wrap.appendChild(photo);

    wrap.appendChild(el("h4", "", p.name));
    wrap.appendChild(el("p", "aff", p.role ? `${p.role} · ${p.aff}` : p.aff));

    if (p.url) {
      const a = el("a", "weblink", "Website →");
      a.href = p.url;
      a.target = "_blank";
      a.rel = "noopener";
      wrap.appendChild(a);
    }
    return wrap;
  }

  function mountPeople(id, people) {
    const root = document.getElementById(id);
    if (!root) return;
    const frag = document.createDocumentFragment();
    people.forEach(p => frag.appendChild(renderPerson(p)));
    root.appendChild(frag);
  }

  // Hero "wind": streamlines drifting left to right, echoing the workshop figure in
  // which AI capabilities are the wind and evaluation is the sail that steers them.
  function initHeroWind() {
    const canvas = document.getElementById("hero-wind");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const COLORS = ["#1f6fd1", "#1f6fd1", "#14a3a8", "#14a3a8", "#f39c34"];
    const N = 80, TRAIL = 60;
    let w = 0, h = 0, t = 0, raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function spawn(p, anywhere) {
      p.x = anywhere ? Math.random() * w : -20 - Math.random() * 80;
      p.y = Math.random() * h;
      p.v = 0.55 + Math.random() * 0.9;
      p.c = COLORS[(Math.random() * COLORS.length) | 0];
      p.trail = [];
      return p;
    }

    function angle(x, y) {
      return 0.32 * Math.sin(x * 0.0042 + t * 0.004) + 0.22 * Math.cos(y * 0.0065 - t * 0.003);
    }

    resize();
    // Resizing the canvas clears it, so the static (reduced-motion) frame must be redrawn.
    window.addEventListener("resize", function () { resize(); if (reduce) draw(); });
    const pts = [];
    for (let i = 0; i < N; i++) pts.push(spawn({}, true));

    function step() {
      t += 1;
      for (const p of pts) {
        const a = angle(p.x, p.y);
        p.x += Math.cos(a) * p.v * 1.6;
        p.y += Math.sin(a) * p.v * 1.6;
        p.trail.push(p.x, p.y);
        if (p.trail.length > TRAIL * 2) p.trail.splice(0, 2);
        if (p.x > w + 40 || p.y < -40 || p.y > h + 40) spawn(p, false);
      }
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      ctx.lineCap = "round";
      const k = w < 720 ? 0.5 : 1; // text spans the full width on phones

      for (const p of pts) {
        const tr = p.trail;
        if (tr.length < 4) continue;
        ctx.strokeStyle = p.c;
        ctx.lineWidth = 1.4 + p.v;
        for (let i = 2; i < tr.length; i += 2) {
          // Fainter behind the headline on the left, stronger toward the right.
          const fx = Math.min(1, Math.max(0, (tr[i] / w - 0.55) / 0.3));
          ctx.globalAlpha = k * (i / tr.length) * (0.06 + 0.42 * fx);
          ctx.beginPath();
          ctx.moveTo(tr[i - 2], tr[i - 1]);
          ctx.lineTo(tr[i], tr[i + 1]);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    }

    function frame() {
      step();
      draw();
      raf = requestAnimationFrame(frame);
    }

    if (reduce) {
      for (let i = 0; i < TRAIL * 2; i++) step();
      draw();
      return;
    }
    raf = requestAnimationFrame(frame);
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) cancelAnimationFrame(raf);
      else raf = requestAnimationFrame(frame);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    mountPeople("speakers-grid", window.SOE_SPEAKERS || []);
    mountPeople("organizers-grid", window.SOE_ORGANIZERS || []);
    initHeroWind();
  });
})();
