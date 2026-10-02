(function () {
  var PASSWORD = "MSpecLeeDrafts2026";
  var SESSION_KEY = "mspec-lee-drafts-auth";

  var gate = document.getElementById("gate");
  var gateForm = document.getElementById("gate-form");
  var gateError = document.getElementById("gate-error");
  var passwordInput = document.getElementById("password");
  var app = document.getElementById("app");
  var listEl = document.getElementById("list");
  var statsEl = document.getElementById("stats");
  var introEl = document.getElementById("intro");
  var lightbox = document.getElementById("lightbox");
  var lbImg = document.getElementById("lb-img");
  var lbTitle = document.getElementById("lb-title");
  var lbCount = document.getElementById("lb-count");

  var state = { drafts: [], updated: "", filter: "all" };
  var lb = { images: [], index: 0, title: "" };

  function el(tag, attrs, kids) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        var value = attrs[key];
        if (value == null || value === false) return;
        if (key === "class") node.className = value;
        else if (key === "text") node.textContent = value;
        else node.setAttribute(key, value);
      });
    }
    (kids || []).forEach(function (kid) {
      if (kid) node.appendChild(kid);
    });
    return node;
  }

  function imagesOf(draft) {
    return Array.isArray(draft.images) ? draft.images.filter(Boolean) : [];
  }

  function showError(message) {
    listEl.textContent = "";
    statsEl.textContent = "";
    var box = el("div", { class: "load-error mono", text: message });
    var retry = el("button", { class: "copy", type: "button", text: "Retry" });
    retry.addEventListener("click", loadDrafts);
    box.appendChild(document.createTextNode(" "));
    box.appendChild(retry);
    listEl.appendChild(box);
  }

  function copyText(text, button) {
    var previous = button.textContent;
    function done() {
      button.textContent = "Copied";
      setTimeout(function () { button.textContent = previous; }, 1200);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(function () {
        fallbackCopy(text);
        done();
      });
    } else {
      fallbackCopy(text);
      done();
    }
  }

  function fallbackCopy(text) {
    var area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.left = "-999px";
    document.body.appendChild(area);
    area.select();
    try { document.execCommand("copy"); } catch (err) {}
    document.body.removeChild(area);
  }

  function openLightbox(images, index, title) {
    lb.images = images;
    lb.index = index;
    lb.title = title;
    paintLightbox();
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function paintLightbox() {
    var src = lb.images[lb.index];
    lbImg.src = src;
    lbImg.alt = lb.title + " photo " + (lb.index + 1);
    lbTitle.textContent = lb.title;
    lbCount.textContent = (lb.index + 1) + " / " + lb.images.length;
  }

  function closeLightbox() {
    lightbox.hidden = true;
    lbImg.removeAttribute("src");
    document.body.style.overflow = "";
  }

  function stepLightbox(delta) {
    if (!lb.images.length) return;
    lb.index = (lb.index + delta + lb.images.length) % lb.images.length;
    paintLightbox();
  }

  function buildGallery(draft) {
    var images = imagesOf(draft);
    if (!images.length) {
      return el("div", { class: "ph" }, [
        el("div", { class: "ph-kicker display", text: "No site images" }),
        el("p", { class: "ph-note", text: draft.imageNote || "Add image paths in drafts.json." })
      ]);
    }

    var current = 0;
    var main = el("img", { class: "hero-img", src: images[0], alt: draft.title + " photo 1" });
    var counter = el("div", { class: "counter mono", text: "1 / " + images.length });
    var frame = el("button", { class: "frame", type: "button", "aria-label": "Open " + draft.title + " photos" }, [main, counter]);
    var thumbButtons = [];

    function select(index) {
      current = index;
      main.src = images[index];
      main.alt = draft.title + " photo " + (index + 1);
      counter.textContent = (index + 1) + " / " + images.length;
      thumbButtons.forEach(function (button, i) {
        button.classList.toggle("on", i === index);
      });
    }

    var startX = 0;
    var startY = 0;
    var swiped = false;
    frame.addEventListener("touchstart", function (event) {
      startX = event.changedTouches[0].clientX;
      startY = event.changedTouches[0].clientY;
      swiped = false;
    }, { passive: true });
    frame.addEventListener("touchend", function (event) {
      var dx = event.changedTouches[0].clientX - startX;
      var dy = event.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
        var next = dx < 0 ? current + 1 : current - 1;
        if (next >= 0 && next < images.length) {
          swiped = true;
          select(next);
        }
      }
    }, { passive: true });
    frame.addEventListener("click", function () {
      if (swiped) {
        swiped = false;
        return;
      }
      openLightbox(images, current, draft.title);
    });

    var thumbs = null;
    if (images.length > 1) {
      thumbs = el("div", { class: "thumbs" });
      images.forEach(function (src, index) {
        var button = el("button", {
          class: "thumb" + (index === 0 ? " on" : ""),
          type: "button",
          "aria-label": "Photo " + (index + 1)
        }, [
          el("img", { src: src, alt: "", loading: "lazy" })
        ]);
        button.addEventListener("click", function () { select(index); });
        thumbButtons.push(button);
        thumbs.appendChild(button);
      });
    }

    return el("div", { class: "gallery" }, [frame, thumbs]);
  }

  function buildCard(draft) {
    var images = imagesOf(draft);
    var status = (draft.status || "draft").toLowerCase();
    var card = el("article", { class: "card" });
    card.appendChild(el("div", { class: "card-top" }, [
      el("div", { class: "sched mono", text: draft.schedule || draft.date || "Unscheduled" }),
      el("div", { class: "status mono " + status, text: status })
    ]));
    card.appendChild(buildGallery(draft));

    var body = el("div", { class: "body" });
    body.appendChild(el("h2", { class: "display", text: draft.title || draft.pack || "Untitled" }));
    if (draft.fit) body.appendChild(el("div", { class: "fit mono", text: draft.fit }));
    if (draft.size) body.appendChild(el("div", { class: "size mono", text: draft.size }));
    if (draft.asking || draft.location) {
      body.appendChild(el("div", { class: "price-row" }, [
        draft.asking ? el("div", { class: "asking display", text: draft.asking }) : el("div"),
        draft.location ? el("div", { class: "loc mono", text: draft.location }) : null
      ]));
    }
    if (draft.structural || draft.cosmetic) {
      var parts = [];
      if (draft.structural) parts.push("STRUCTURAL: " + draft.structural);
      if (draft.cosmetic) parts.push("COSMETIC: " + draft.cosmetic);
      body.appendChild(el("div", { class: "grades mono", text: parts.join(" · ") }));
    }
    if (images.length) {
      body.appendChild(el("p", {
        class: "hosted mono",
        text: images.length + (images.length === 1 ? " photo" : " photos") + " · hosted on this site"
      }));
    }
    if (draft.bufferId) {
      var copy = el("button", { class: "copy mono", type: "button", text: "Copy" });
      copy.addEventListener("click", function () { copyText(draft.bufferId, copy); });
      var id = el("div", { class: "buffer-id mono" });
      id.appendChild(el("span", { text: "BUFFER ID" }));
      id.appendChild(document.createTextNode(draft.bufferId));
      body.appendChild(el("div", { class: "buffer" }, [id, copy]));
    }
    if (draft.caption) body.appendChild(el("p", { class: "caption", text: draft.caption }));
    if (draft.forumUrl && /^https?:\/\//i.test(draft.forumUrl)) {
      body.appendChild(el("a", {
        class: "forum mono",
        href: draft.forumUrl,
        target: "_blank",
        rel: "noopener noreferrer",
        text: "Forum listing"
      }));
    }
    if (draft.notes) body.appendChild(el("p", { class: "notes", text: draft.notes }));
    card.appendChild(body);
    return card;
  }

  function visibleDrafts() {
    if (state.filter === "missing") {
      return state.drafts.filter(function (draft) { return imagesOf(draft).length === 0; });
    }
    if (state.filter === "ready") {
      return state.drafts.filter(function (draft) { return imagesOf(draft).length > 0; });
    }
    return state.drafts.slice();
  }

  function render() {
    var drafts = state.drafts;
    var withImages = drafts.filter(function (draft) { return imagesOf(draft).length > 0; }).length;
    var missing = drafts.length - withImages;
    introEl.textContent = "Buffer review for the live cadence. Photos load from this site, not Imgur.";

    statsEl.textContent = "";
    [
      ["all", drafts.length + " packs"],
      ["ready", withImages + " with photos"],
      ["missing", missing + " missing photos"]
    ].forEach(function (pair) {
      var button = el("button", {
        class: "filter mono" + (state.filter === pair[0] ? " on" : ""),
        type: "button",
        text: pair[1]
      });
      button.addEventListener("click", function () {
        state.filter = pair[0];
        render();
      });
      statsEl.appendChild(button);
    });

    listEl.textContent = "";
    var shown = visibleDrafts();
    var lastDate = null;
    if (!shown.length) {
      listEl.appendChild(el("p", { class: "intro", text: "Nothing in this filter." }));
      return;
    }
    shown.forEach(function (draft) {
      var dateKey = draft.date || "unscheduled";
      if (dateKey !== lastDate) {
        lastDate = dateKey;
        listEl.appendChild(el("div", { class: "day mono", text: draft.schedule || dateKey }));
      }
      listEl.appendChild(buildCard(draft));
    });
  }

  function loadDrafts() {
    listEl.textContent = "";
    listEl.appendChild(el("p", { class: "intro", text: "Loading drafts…" }));
    fetch("drafts.json", { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) throw new Error("Could not load drafts.json (" + response.status + ")");
        return response.json();
      })
      .then(function (data) {
        state.drafts = Array.isArray(data.drafts) ? data.drafts : [];
        state.updated = data.updated || "";
        render();
      })
      .catch(function (err) {
        showError(err.message || "Could not load drafts.");
      });
  }

  function unlock() {
    gate.hidden = true;
    app.hidden = false;
    loadDrafts();
  }

  gateForm.addEventListener("submit", function (event) {
    event.preventDefault();
    if (passwordInput.value === PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "1");
      gateError.hidden = true;
      passwordInput.value = "";
      unlock();
    } else {
      gateError.hidden = false;
      passwordInput.value = "";
      passwordInput.focus();
    }
  });

  document.getElementById("lock").addEventListener("click", function () {
    sessionStorage.removeItem(SESSION_KEY);
    closeLightbox();
    app.hidden = true;
    gate.hidden = false;
    listEl.textContent = "";
    passwordInput.focus();
  });

  document.getElementById("lb-close").addEventListener("click", closeLightbox);
  document.getElementById("lb-prev").addEventListener("click", function () { stepLightbox(-1); });
  document.getElementById("lb-next").addEventListener("click", function () { stepLightbox(1); });
  document.addEventListener("keydown", function (event) {
    if (lightbox.hidden) return;
    if (event.key === "Escape") closeLightbox();
    if (event.key === "ArrowRight") stepLightbox(1);
    if (event.key === "ArrowLeft") stepLightbox(-1);
  });

  var touchX = 0;
  lightbox.addEventListener("touchstart", function (event) {
    touchX = event.changedTouches[0].clientX;
  }, { passive: true });
  lightbox.addEventListener("touchend", function (event) {
    var dx = event.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) stepLightbox(dx < 0 ? 1 : -1);
  }, { passive: true });

  if (sessionStorage.getItem(SESSION_KEY) === "1") unlock();
  else passwordInput.focus();
})();
