(function () {
  var $ = function (id) { return document.getElementById(id); };
  var PRESETS = {
    football: { v0: 22, ang: 35, h0: 0, g: 9.81, drag: true, m: 0.43, dia: 22, cd: 0.25 },
    cliff: { v0: 15, ang: 30, h0: 40, g: 9.81, drag: false, m: 0.145, dia: 7.4, cd: 0.4 },
    moon: { v0: 20, ang: 45, h0: 0, g: 1.62, drag: false, m: 0.043, dia: 4.3, cd: 0.25 },
    cricket: { v0: 38, ang: 40, h0: 1, g: 9.81, drag: true, m: 0.16, dia: 7.2, cd: 0.45 }
  };

  var S = null;      // current solution
  var tNow = 0;      // current animation time
  var playing = false, lastTs = 0;

  function val(id) { return parseFloat($(id).value); }

  function solve() {
    var v0 = val("v0"), ang = val("ang") * Math.PI / 180, h0 = Math.max(0, val("h0") || 0), g = val("g") || 9.81;
    var vx = v0 * Math.cos(ang), vy = v0 * Math.sin(ang);
    var T = (vy + Math.sqrt(vy * vy + 2 * g * h0)) / g;
    var ideal = {
      T: T, R: vx * T, H: h0 + vy * vy / (2 * g),
      vimp: Math.sqrt(vx * vx + Math.pow(vy - g * T, 2)),
      aimp: Math.atan2(Math.abs(vy - g * T), vx) * 180 / Math.PI,
      pos: function (t) { return { x: vx * t, y: Math.max(0, h0 + vy * t - 0.5 * g * t * t) }; }
    };
    var out = { v0: v0, ang: val("ang"), h0: h0, g: g, vx: vx, vy: vy, ideal: ideal, drag: null };
    if ($("drag").checked) {
      var m = val("m"), d = val("dia") / 100, cd = val("cd"), rho = val("rho");
      var A = Math.PI * d * d / 4, k = 0.5 * rho * cd * A / m;
      var dt = 0.002, t = 0, x = 0, y = h0, ux = vx, uy = vy, H = h0, pts = [{ t: 0, x: 0, y: h0 }], n = 0;
      function acc(ux, uy) { var s = Math.sqrt(ux * ux + uy * uy); return [-k * s * ux, -g - k * s * uy]; }
      while (t < 900) {
        var a1 = acc(ux, uy);
        var a2 = acc(ux + 0.5 * dt * a1[0], uy + 0.5 * dt * a1[1]);
        var a3 = acc(ux + 0.5 * dt * a2[0], uy + 0.5 * dt * a2[1]);
        var a4 = acc(ux + dt * a3[0], uy + dt * a3[1]);
        var kx1 = ux, ky1 = uy;
        var kx2 = ux + 0.5 * dt * a1[0], ky2 = uy + 0.5 * dt * a1[1];
        var kx3 = ux + 0.5 * dt * a2[0], ky3 = uy + 0.5 * dt * a2[1];
        var kx4 = ux + dt * a3[0], ky4 = uy + dt * a3[1];
        var xn = x + dt / 6 * (kx1 + 2 * kx2 + 2 * kx3 + kx4);
        var yn = y + dt / 6 * (ky1 + 2 * ky2 + 2 * ky3 + ky4);
        var uxn = ux + dt / 6 * (a1[0] + 2 * a2[0] + 2 * a3[0] + a4[0]);
        var uyn = uy + dt / 6 * (a1[1] + 2 * a2[1] + 2 * a3[1] + a4[1]);
        if (yn < 0) {
          var f = y / (y - yn);
          xn = x + f * (xn - x); uxn = ux + f * (uxn - ux); uyn = uy + f * (uyn - uy);
          t += f * dt; pts.push({ t: t, x: xn, y: 0 });
          x = xn; ux = uxn; uy = uyn; y = 0;
          break;
        }
        t += dt; x = xn; y = yn; ux = uxn; uy = uyn;
        if (y > H) H = y;
        n++;
        if (n % 5 === 0) pts.push({ t: t, x: x, y: y });
      }
      out.drag = {
        T: t, R: x, H: H, vimp: Math.sqrt(ux * ux + uy * uy),
        aimp: Math.atan2(Math.abs(uy), Math.abs(ux)) * 180 / Math.PI, k: k, pts: pts,
        pos: function (tt) {
          if (tt >= pts[pts.length - 1].t) { var e = pts[pts.length - 1]; return { x: e.x, y: e.y }; }
          var lo = 0, hi = pts.length - 1;
          while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (pts[mid].t <= tt) lo = mid; else hi = mid; }
          var p = pts[lo], q = pts[hi], f = (tt - p.t) / (q.t - p.t || 1);
          return { x: p.x + f * (q.x - p.x), y: p.y + f * (q.y - p.y) };
        }
      };
    }
    return out;
  }

  function fmt(x, d) { return (isFinite(x) ? x : 0).toFixed(d === undefined ? 2 : d); }

  function renderResults() {
    var i = S.ideal, d = S.drag;
    var rows = [
      ["Time of flight", "T", "s", "T", 2],
      ["Horizontal range", "R", "m", "R", 2],
      ["Maximum height", "H", "m", "H", 2],
      ["Impact speed", "vimp", "m/s", "vimp", 2],
      ["Impact angle below horizontal", "aimp", "°", "aimp", 1]
    ];
    var h = "";
    rows.forEach(function (r) {
      h += "<tr><td>" + r[0] + "</td><td class='num ideal'>" + fmt(i[r[3]], r[4]) + " " + r[2] + "</td>" +
        "<td class='num drag'>" + (d ? fmt(d[r[3]], r[4]) + " " + r[2] : "—") + "</td></tr>";
    });
    $("res").innerHTML = h;
    $("thDrag").textContent = d ? "With drag" : "With drag (off)";
    $("legDrag").style.display = d ? "" : "none";
  }

  function renderSteps() {
    var s = S, g = s.g;
    var steps = [
      ["Given", "v₀ = " + fmt(s.v0, 1) + " m/s, θ = " + fmt(s.ang, 1) + "°, h₀ = " + fmt(s.h0, 1) + " m, g = " + fmt(g, 2) + " m/s²."],
      ["Resolve the launch velocity", "vₓ = " + fmt(s.v0, 1) + " cos " + fmt(s.ang, 1) + "° = " + fmt(s.vx, 3) + " m/s, v_y = " + fmt(s.v0, 1) + " sin " + fmt(s.ang, 1) + "° = " + fmt(s.vy, 3) + " m/s."],
      ["Time of flight", "Set y = 0 in y = h₀ + v_y t − ½gt² and take the positive root: T = " + fmt(s.ideal.T, 3) + " s."],
      ["Range", "R = vₓT = " + fmt(s.vx, 3) + " × " + fmt(s.ideal.T, 3) + " = " + fmt(s.ideal.R, 2) + " m."],
      ["Maximum height", "At the top v_y = 0, so H = h₀ + v_y²/2g = " + fmt(s.ideal.H, 2) + " m, reached at t = " + fmt(s.vy / g, 3) + " s."],
      ["Impact", "v_y at landing = v_y − gT = " + fmt(s.vy - g * s.ideal.T, 3) + " m/s, so the speed is " + fmt(s.ideal.vimp, 2) + " m/s at " + fmt(s.ideal.aimp, 1) + "° below the horizontal."]
    ];
    var h = "";
    steps.forEach(function (st) { h += "<li><span class='step'>" + st[0] + "</span><p>" + st[1] + "</p></li>"; });
    $("steps").innerHTML = h;
  }

  /* ---------- drawing ---------- */
  var cv = $("cv"), ctx = cv.getContext("2d");
  function tok(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
  function niceStep(range, target) {
    var raw = range / target, p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p;
    return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * p;
  }

  function draw() {
    if (!S) return;
    var dpr = window.devicePixelRatio || 1;
    var W = cv.clientWidth || 600;
    var padL = 50, padR = 14, padT = 14, padB = 34;
    var xmax = S.ideal.R, ymax = S.ideal.H;
    if (S.drag) { xmax = Math.max(xmax, S.drag.R); ymax = Math.max(ymax, S.drag.H); }
    xmax = Math.max(xmax * 1.06, 1); ymax = Math.max(ymax * 1.12, 1);
    var sc = (W - padL - padR) / xmax;
    var plotH = Math.min(Math.max(ymax * sc, 140), 460);
    sc = Math.min(sc, plotH / ymax);
    var H = Math.round(plotH + padT + padB);
    cv.style.height = H + "px";
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    var X = function (x) { return padL + x * sc; };
    var Y = function (y) { return padT + plotH - y * sc; };
    var cGrid = tok("--grid"), cMuted = tok("--muted"), cIdeal = tok("--ideal"), cDrag = tok("--drag"), cGround = tok("--ground"), cFg = tok("--fg");

    ctx.font = "11px " + tok("--font-mono");
    ctx.textBaseline = "middle";
    var sx = niceStep(xmax, Math.max(3, Math.floor((W - padL - padR) / 90)));
    var sy = niceStep(ymax, Math.max(2, Math.floor(plotH / 55)));
    ctx.lineWidth = 1; ctx.strokeStyle = cGrid; ctx.fillStyle = cMuted;
    ctx.textAlign = "center";
    for (var xv = 0; xv <= xmax; xv += sx) {
      ctx.beginPath(); ctx.moveTo(X(xv) + 0.5, padT); ctx.lineTo(X(xv) + 0.5, padT + plotH); ctx.stroke();
      ctx.fillText(String(Math.round(xv * 100) / 100), X(xv), padT + plotH + 14);
    }
    ctx.textAlign = "right";
    for (var yv = 0; yv <= ymax; yv += sy) {
      ctx.beginPath(); ctx.moveTo(padL, Y(yv) + 0.5); ctx.lineTo(padL + xmax * sc, Y(yv) + 0.5); ctx.stroke();
      ctx.fillText(String(Math.round(yv * 100) / 100), padL - 7, Y(yv));
    }
    ctx.textAlign = "left";
    ctx.fillText("x (m)", W - padR - 32, padT + plotH + 28);
    ctx.save(); ctx.translate(11, padT + 18); ctx.rotate(-Math.PI / 2); ctx.textAlign = "right"; ctx.fillText("y (m)", 0, 0); ctx.restore();

    // ground and launch platform
    ctx.fillStyle = cGround; ctx.fillRect(padL, Y(0), xmax * sc, 3);
    if (S.h0 > 0) { ctx.fillRect(padL - 12, Y(S.h0), 12, Y(0) - Y(S.h0) + 3); }

    // ideal path
    ctx.lineWidth = 2.5; ctx.strokeStyle = cIdeal; ctx.beginPath();
    var N = 120;
    for (var i = 0; i <= N; i++) { var p = S.ideal.pos(S.ideal.T * i / N); if (i) ctx.lineTo(X(p.x), Y(p.y)); else ctx.moveTo(X(p.x), Y(p.y)); }
    ctx.stroke();
    // drag path
    if (S.drag) {
      ctx.strokeStyle = cDrag; ctx.beginPath();
      S.drag.pts.forEach(function (p, i) { if (i) ctx.lineTo(X(p.x), Y(p.y)); else ctx.moveTo(X(p.x), Y(p.y)); });
      ctx.stroke();
    }
    // apex marker (ideal)
    var tApex = S.vy / S.g;
    if (tApex > 0 && tApex < S.ideal.T) {
      var ap = S.ideal.pos(tApex);
      ctx.setLineDash([4, 4]); ctx.lineWidth = 1; ctx.strokeStyle = cMuted;
      ctx.beginPath(); ctx.moveTo(X(ap.x), Y(ap.y)); ctx.lineTo(X(ap.x), Y(0)); ctx.stroke(); ctx.setLineDash([]);
    }
    // balls
    function ball(p, c) {
      ctx.fillStyle = c; ctx.beginPath(); ctx.arc(X(p.x), Y(p.y), 6, 0, 6.2832); ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = tok("--surface"); ctx.stroke();
    }
    ball(S.ideal.pos(Math.min(tNow, S.ideal.T)), cIdeal);
    if (S.drag) ball(S.drag.pos(Math.min(tNow, S.drag.T)), cDrag);
    $("clock").textContent = "t = " + fmt(tNow, 2) + " s";
  }

  function tMax() { return S.drag ? Math.max(S.ideal.T, S.drag.T) : S.ideal.T; }
  function syncScrub() { $("scrub").value = String(Math.round(tNow / tMax() * 1000)); }

  function update(resetTime) {
    ["v0", "ang"].forEach(function (id) { $("o_" + id).textContent = fmt(val(id), 1) + (id === "ang" ? "°" : " m/s"); });
    $("dragFields").hidden = !$("drag").checked;
    S = solve();
    if (resetTime !== false) { tNow = tMax(); }
    tNow = Math.min(tNow, tMax());
    renderResults(); renderSteps(); syncScrub(); draw();
  }

  function frame(ts) {
    if (!playing) return;
    var dt = (ts - lastTs) / 1000; lastTs = ts;
    tNow += dt;
    if (tNow >= tMax()) { tNow = tMax(); playing = false; $("play").textContent = "Replay"; }
    syncScrub(); draw();
    if (playing) requestAnimationFrame(frame);
  }

  $("play").addEventListener("click", function () {
    if (playing) { playing = false; $("play").textContent = "Play"; return; }
    if (tNow >= tMax() - 1e-6) tNow = 0;
    playing = true; $("play").textContent = "Pause"; lastTs = performance.now();
    requestAnimationFrame(frame);
  });
  $("scrub").addEventListener("input", function () {
    playing = false; $("play").textContent = "Play";
    tNow = parseFloat($("scrub").value) / 1000 * tMax(); draw();
  });
  ["v0", "ang", "h0", "g", "m", "dia", "cd", "rho", "drag"].forEach(function (id) {
    $(id).addEventListener("input", function () { playing = false; $("play").textContent = "Play"; update(true); });
  });
  document.querySelectorAll("[data-p]").forEach(function (b) {
    b.addEventListener("click", function () {
      var p = PRESETS[b.getAttribute("data-p")];
      ["v0", "ang", "h0", "g", "m", "dia", "cd"].forEach(function (k) { $(k).value = p[k]; });
      $("drag").checked = p.drag; playing = false; $("play").textContent = "Play"; update(true);
    });
  });
  window.addEventListener("resize", draw);
  if (window.matchMedia) window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", draw);
  new MutationObserver(draw).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  update(true);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
})();
