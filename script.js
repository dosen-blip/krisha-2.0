(() => {
  const ACTIVE_CLASS = "is-active";
  const COMPLETE_CLASS = "sequence-complete";
  const REVEALED_CLASS = "is-revealed";
  const FRAME_DELAY = 1000;

  const preloadImage = (src) =>
    new Promise((resolve) => {
      if (!src) {
        resolve();
        return;
      }

      const image = new Image();
      image.onload = resolve;
      image.onerror = resolve;
      image.src = src;
    });

  const setActiveFrame = (frames, activeIndex) => {
    frames.forEach((frame, index) => {
      const isActive = index === activeIndex;
      const isRevealed = index <= activeIndex;
      frame.classList.toggle(ACTIVE_CLASS, isActive);
      frame.classList.toggle(REVEALED_CLASS, isRevealed);
      frame.setAttribute("aria-hidden", String(!isActive));
    });
  };

  const markComplete = (sequence) => {
    sequence.classList.add(COMPLETE_CLASS);
    sequence.closest(".landing-stage, .figma-stage")?.classList.add(COMPLETE_CLASS);
    document.body?.classList.add(COMPLETE_CLASS);
  };

  const setupPageTransitions = () => {
    const localLinks = Array.from(
      document.querySelectorAll('a[href="#"], a[href*=".html"], a[href^="./"]'),
    );
    const getPageName = (url) => url.pathname.split("/").pop() || "index.html";

    localLinks.forEach((link) => {
      link.addEventListener("click", (event) => {
        const href = link.getAttribute("href");
        const currentUrl = new URL(window.location.href);
        let targetUrl = null;

        if (href && href !== "#") {
          try {
            targetUrl = new URL(href, window.location.href);
          } catch {
            targetUrl = null;
          }
        }

        if (
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          event.button !== 0 ||
          link.target
        ) {
          return;
        }

        if (targetUrl && targetUrl.origin !== currentUrl.origin) {
          return;
        }

        const isSamePage =
          targetUrl && getPageName(targetUrl) === getPageName(currentUrl);

        if (!href || href === "#" || isSamePage || document.body.classList.contains("is-leaving")) {
          event.preventDefault();
          return;
        }

        event.preventDefault();
        document.body.classList.add("is-leaving");
        window.setTimeout(() => {
          window.location.assign(targetUrl.href);
        }, 220);
      });
    });
  };

  const setupCustomCursor = () => {
    const canUseCursor =
      window.matchMedia?.("(hover: hover) and (pointer: fine)").matches &&
      !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (!canUseCursor) {
      return;
    }

    const cursor = document.createElement("div");
    cursor.className = "cursor-orb";
    cursor.setAttribute("aria-hidden", "true");
    document.body.append(cursor);
    document.body.classList.add("has-custom-cursor");

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;

    const interactiveSelector = "a, button, input, textarea, select, label";

    window.addEventListener(
      "pointermove",
      (event) => {
        targetX = event.clientX;
        targetY = event.clientY;
        document.body.classList.add("cursor-ready");
        document.body.classList.toggle(
          "is-cursor-hover",
          Boolean(document.elementFromPoint(targetX, targetY)?.closest(interactiveSelector)),
        );
      },
      { passive: true },
    );

    document.addEventListener("pointerover", (event) => {
      if (event.target.closest(interactiveSelector)) {
        document.body.classList.add("is-cursor-hover");
      }
    });

    document.addEventListener("pointerout", (event) => {
      if (event.target.closest(interactiveSelector)) {
        document.body.classList.remove("is-cursor-hover");
      }
    });

    const render = () => {
      currentX += (targetX - currentX) * 0.22;
      currentY += (targetY - currentY) * 0.22;
      cursor.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
      window.requestAnimationFrame(render);
    };

    render();
  };

  const setupProductInquiry = () => {
    const params = new URLSearchParams(window.location.search);
    const product = params.get("product");

    if (!product) {
      return;
    }

    const price = params.get("price");
    const message = [
      "Hi, I'm interested in ordering:",
      "",
      `${product}${price ? ` - ${price}` : ""}`,
      "",
      "Please let me know the next steps.",
    ].join("\n");

    document.querySelectorAll('textarea[name="message"]').forEach((field) => {
      if (!field.value.trim()) {
        field.value = message;
      }
    });
  };

  const setupSequence = () => {
    const sequence = document.querySelector("[data-sequence]");

    if (!sequence) {
      return;
    }

    const frames = Array.from(sequence.querySelectorAll("img.sequence-frame"));

    if (frames.length === 0) {
      markComplete(sequence);
      return;
    }

    frames.forEach((frame) => {
      frame.decoding = "async";
    });

    Promise.all(frames.map((frame) => preloadImage(frame.currentSrc || frame.src)));

    const prefersReducedMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion || frames.length === 1) {
      setActiveFrame(frames, frames.length - 1);
      markComplete(sequence);
      return;
    }

    let activeIndex = 0;
    setActiveFrame(frames, activeIndex);

    const timer = window.setInterval(() => {
      activeIndex += 1;
      setActiveFrame(frames, activeIndex);

      if (activeIndex === frames.length - 1) {
        window.clearInterval(timer);
        markComplete(sequence);
      }
    }, FRAME_DELAY);
  };

  document.addEventListener("DOMContentLoaded", () => {
    setupSequence();
    setupPageTransitions();
    setupCustomCursor();
    setupProductInquiry();
  });
})();
