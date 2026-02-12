const BOOT_KEY = "arios-booted";

const windowDefinitions = {
  about: {
    title: "About Me",
    iconClass: "desktop-icon-about",
    contentTemplateId: "about-content",
    initialPosition: { top: "10vh", left: "12vw" },
  },
  projects: {
    title: "Projects",
    iconClass: "desktop-icon-projects",
    contentTemplateId: "projects-content",
    initialPosition: { top: "12vh", left: "22vw" },
  },
  skills: {
    title: "Skills",
    iconClass: "desktop-icon-skills",
    contentTemplateId: "skills-content",
    initialPosition: { top: "15vh", left: "8vw" },
  },
  experience: {
    title: "Experience",
    iconClass: "desktop-icon-experience",
    contentTemplateId: "experience-content",
    initialPosition: { top: "8vh", left: "32vw" },
  },
  resume: {
    title: "Resume",
    iconClass: "desktop-icon-resume",
    contentTemplateId: "resume-content",
    initialPosition: { top: "18vh", left: "18vw" },
  },
  contact: {
    title: "Contact",
    iconClass: "desktop-icon-contact",
    contentTemplateId: "contact-content",
    initialPosition: { top: "12vh", left: "6vw" },
  },
  github: {
    title: "GitHub",
    iconClass: "desktop-icon-github",
    contentTemplateId: "github-content",
    initialPosition: { top: "16vh", left: "26vw" },
  },
  media: {
    title: "Media",
    iconClass: "desktop-icon-media",
    contentTemplateId: "media-content",
    initialPosition: { top: "20vh", left: "14vw" },
  },
  research: {
    title: "Research",
    iconClass: "desktop-icon-research",
    contentTemplateId: "research-content",
    initialPosition: { top: "11vh", left: "30vw" },
  },
};

let zIndexCounter = 300;
const openWindows = new Map(); // key: windowId -> { element, taskbarItem }

function $(selector, scope = document) {
  return scope.querySelector(selector);
}

function $all(selector, scope = document) {
  return Array.from(scope.querySelectorAll(selector));
}

function initBootScreen() {
  const bootScreen = $("#boot-screen");
  const desktop = $("#desktop");

  const alreadyBooted =
    typeof window !== "undefined" && window.localStorage
      ? window.localStorage.getItem(BOOT_KEY)
      : null;

  const showDesktop = () => {
    if (!bootScreen || !desktop) return;
    bootScreen.style.opacity = "0";
    bootScreen.style.transition = "opacity 350ms ease-out";
    setTimeout(() => {
      bootScreen.style.display = "none";
      desktop.classList.remove("hidden");
    }, 360);
  };

  if (alreadyBooted) {
    // Skip animation on repeat visits
    bootScreen.style.display = "none";
    desktop.classList.remove("hidden");
  } else {
    setTimeout(showDesktop, 1600);
    try {
      window.localStorage.setItem(BOOT_KEY, "1");
    } catch (e) {
      // ignore
    }
  }
}

function initClock() {
  const clockEl = $("#taskbar-clock");
  if (!clockEl) return;

  const updateClock = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    clockEl.textContent = `${hours}:${minutes}`;
  };

  updateClock();
  setInterval(updateClock, 30 * 1000);
}

function focusWindow(win) {
  if (!win) return;
  zIndexCounter += 1;
  win.style.zIndex = String(zIndexCounter);

  // Update taskbar item active state
  const id = win.dataset.windowId;
  openWindows.forEach((entry, key) => {
    if (!entry.taskbarItem) return;
    if (key === id) {
      entry.taskbarItem.classList.add("active");
    } else {
      entry.taskbarItem.classList.remove("active");
    }
  });
}

function createTaskbarItem(windowId, title) {
  const container = $("#taskbar-windows");
  if (!container) return null;

  const item = document.createElement("button");
  item.className = "taskbar-item";
  item.type = "button";
  item.dataset.windowId = windowId;
  item.innerHTML = `<span>${title}</span>`;

  item.addEventListener("click", () => {
    const entry = openWindows.get(windowId);
    if (!entry) return;
    const win = entry.element;
    if (win.classList.contains("minimized")) {
      win.classList.remove("minimized");
      win.style.display = "flex";
    }
    focusWindow(win);
  });

  container.appendChild(item);
  return item;
}

function makeWindowDraggable(win, header) {
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let startTop = 0;
  let startLeft = 0;

  const onPointerDown = (e) => {
    // Only drag with primary button and when not maximized
    if (e.button !== 0 || win.classList.contains("maximized")) return;
    isDragging = true;
    const rect = win.getBoundingClientRect();
    startX = e.clientX;
    startY = e.clientY;
    startTop = rect.top;
    startLeft = rect.left;

    win.style.transition = "none";
    focusWindow(win);

    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
  };

  const onPointerMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const newTop = startTop + dy;
    const newLeft = startLeft + dx;

    // Keep inside viewport
    const maxLeft = window.innerWidth - 120;
    const maxTop = window.innerHeight - 80;

    win.style.top = `${Math.min(Math.max(newTop, 0), maxTop)}px`;
    win.style.left = `${Math.min(Math.max(newLeft, -20), maxLeft)}px`;
  };

  const onPointerUp = () => {
    isDragging = false;
    win.style.transition = "";
    document.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerup", onPointerUp);
  };

  header.addEventListener("pointerdown", onPointerDown);
}

function makeWindowResizable(win, handle) {
  let isResizing = false;
  let startX = 0;
  let startY = 0;
  let startWidth = 0;
  let startHeight = 0;

  const onPointerDown = (e) => {
    if (e.button !== 0 || win.classList.contains("maximized")) return;
    isResizing = true;
    const rect = win.getBoundingClientRect();
    startX = e.clientX;
    startY = e.clientY;
    startWidth = rect.width;
    startHeight = rect.height;

    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
  };

  const onPointerMove = (e) => {
    if (!isResizing) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    const minWidth = 260;
    const minHeight = 180;
    const maxWidth = window.innerWidth - 40;
    const maxHeight = window.innerHeight - 80;

    const newWidth = Math.min(Math.max(startWidth + dx, minWidth), maxWidth);
    const newHeight = Math.min(Math.max(startHeight + dy, minHeight), maxHeight);

    win.style.width = `${newWidth}px`;
    win.style.height = `${newHeight}px`;
  };

  const onPointerUp = () => {
    isResizing = false;
    document.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerup", onPointerUp);
  };

  handle.addEventListener("pointerdown", onPointerDown);
}

function wireWindowControls(win, windowId) {
  const minimizeBtn = $(".window-minimize", win);
  const maximizeBtn = $(".window-maximize", win);
  const closeBtn = $(".window-close", win);

  minimizeBtn.addEventListener("click", () => {
    win.classList.add("minimized");
    win.style.display = "none";
    const entry = openWindows.get(windowId);
    if (entry?.taskbarItem) {
      entry.taskbarItem.classList.remove("active");
    }
  });

  maximizeBtn.addEventListener("click", () => {
    win.classList.toggle("maximized");
    focusWindow(win);
  });

  closeBtn.addEventListener("click", () => {
    const entry = openWindows.get(windowId);
    if (entry?.taskbarItem) {
      entry.taskbarItem.remove();
    }
    win.remove();
    openWindows.delete(windowId);
  });
}

function initContentInsideWindow(win, windowId) {
  if (windowId === "contact") {
    const form = $("#contact-form", win);
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        alert("Contact form is a front-end demo. Wire this up to your backend or email service.");
      });
    }
  }

  if (windowId === "github") {
    const link = $(".github-card .btn-primary", win);
    if (link && !link.getAttribute("href")) {
      // Keep as placeholder for now
      link.setAttribute("href", "#");
    }
  }
}

function openWindow(windowId) {
  const def = windowDefinitions[windowId];
  if (!def) return;

  const existing = openWindows.get(windowId);
  if (existing) {
    const win = existing.element;
    if (win.classList.contains("minimized")) {
      win.classList.remove("minimized");
      win.style.display = "flex";
    }
    focusWindow(win);
    return;
  }

  const template = $("#window-template");
  const contentTemplate = document.getElementById(def.contentTemplateId);
  if (!template || !contentTemplate) return;

  const fragment = template.content.cloneNode(true);
  const win = fragment.querySelector(".window");
  const header = fragment.querySelector(".window-header");
  const resizeHandle = fragment.querySelector(".window-resize-handle");
  const titleIcon = fragment.querySelector(".window-title-icon");
  const titleText = fragment.querySelector(".window-title-text");
  const content = fragment.querySelector(".window-content");

  if (!win || !header || !resizeHandle || !titleIcon || !titleText || !content) {
    return;
  }

  titleText.textContent = def.title;
  titleIcon.classList.add(def.iconClass);

  const contentNode = contentTemplate.content.cloneNode(true);
  content.appendChild(contentNode);

  win.dataset.windowId = windowId;

  // Initial position
  if (window.innerWidth <= 720) {
    win.style.top = "4px";
    win.style.left = "4px";
    win.style.width = "calc(100vw - 8px)";
    win.style.height = "calc(100vh - 60px)";
  } else {
    if (def.initialPosition?.top) {
      win.style.top = def.initialPosition.top;
    }
    if (def.initialPosition?.left) {
      win.style.left = def.initialPosition.left;
    }
  }

  document.body.appendChild(win);

  makeWindowDraggable(win, header);
  makeWindowResizable(win, resizeHandle);
  wireWindowControls(win, windowId);
  initContentInsideWindow(win, windowId);

  // Focus on click
  win.addEventListener("mousedown", () => focusWindow(win));

  const taskbarItem = createTaskbarItem(windowId, def.title);
  openWindows.set(windowId, { element: win, taskbarItem });

  focusWindow(win);
}

function initDesktopIcons() {
  const icons = $all(".desktop-icon");
  const desktop = $("#desktop");

  const defaultPositions = {
    about: { top: 70, left: 60 },
    projects: { top: 70, left: 220 },
    skills: { top: 70, left: 380 },
    experience: { top: 190, left: 60 },
    research: { top: 190, left: 220 },
    media: { top: 190, left: 380 },
    resume: { top: 310, left: 60 },
    contact: { top: 310, left: 220 },
    github: { top: 310, left: 380 },
  };

  const isMobile = window.matchMedia("(max-width: 720px)").matches;

  icons.forEach((icon) => {
    const id = icon.dataset.window;
    if (!id) return;

    // Position icons on desktop for non-mobile layouts
    if (!isMobile) {
      const pos = defaultPositions[id];
      if (pos) {
        icon.style.top = `${pos.top}px`;
        icon.style.left = `${pos.left}px`;
      }
    }

    icon.addEventListener("dblclick", () => openWindow(id));
    icon.addEventListener("click", (e) => {
      // On mobile, single tap to open; on desktop, use double-click
      if (window.matchMedia("(max-width: 720px)").matches) {
        openWindow(id);
      }
    });

    // Drag icons around the desktop (desktop only)
    if (!isMobile && desktop) {
      let dragging = false;
      let startX = 0;
      let startY = 0;
      let startTop = 0;
      let startLeft = 0;

      const onPointerDown = (e) => {
        if (e.button !== 0) return;
        dragging = true;
        const rect = icon.getBoundingClientRect();
        startX = e.clientX;
        startY = e.clientY;
        startTop = rect.top;
        startLeft = rect.left;

        document.addEventListener("pointermove", onPointerMove);
        document.addEventListener("pointerup", onPointerUp);
      };

      const onPointerMove = (e) => {
        if (!dragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        const desktopRect = desktop.getBoundingClientRect();
        const iconRect = icon.getBoundingClientRect();

        let newTop = startTop + dy;
        let newLeft = startLeft + dx;

        const minTop = desktopRect.top + 20;
        const minLeft = desktopRect.left + 16;
        const maxTop = desktopRect.bottom - iconRect.height - 70;
        const maxLeft = desktopRect.right - iconRect.width - 16;

        newTop = Math.min(Math.max(newTop, minTop), maxTop);
        newLeft = Math.min(Math.max(newLeft, minLeft), maxLeft);

        icon.style.top = `${newTop - desktopRect.top}px`;
        icon.style.left = `${newLeft - desktopRect.left}px`;
      };

      const onPointerUp = () => {
        dragging = false;
        document.removeEventListener("pointermove", onPointerMove);
        document.removeEventListener("pointerup", onPointerUp);
      };

      icon.addEventListener("pointerdown", onPointerDown);
    }
  });
}

function initStartButton() {
  const startButton = document.querySelector(".start-button");
  if (!startButton) return;

  startButton.addEventListener("click", () => {
    // Open About + Projects as a default "workspace"
    openWindow("about");
    openWindow("projects");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initBootScreen();
  initClock();
  initDesktopIcons();
  initStartButton();
});

