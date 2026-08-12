// Keyboard-navigable deck. Left/Right or PageUp/PageDown or Space. No frameworks.
(function () {
  const slides = Array.from(document.querySelectorAll(".slide"));
  const counter = document.getElementById("slide-number");
  let index = 0;

  function show(i) {
    index = Math.max(0, Math.min(slides.length - 1, i));
    slides.forEach((s, n) => s.classList.toggle("active", n === index));
    counter.textContent = index + 1 + " / " + slides.length;
  }

  document.addEventListener("keydown", (e) => {
    if (["ArrowRight", "PageDown", " "].includes(e.key)) show(index + 1);
    if (["ArrowLeft", "PageUp"].includes(e.key)) show(index - 1);
    if (e.key === "Home") show(0);
    if (e.key === "End") show(slides.length - 1);
  });
  document.addEventListener("click", () => show(index + 1));

  // Slide 5 renders remote facts only from window.EVIDENCE (docs/evidence.js).
  const ev = window.EVIDENCE || { verified: false };
  function set(id, value, cls) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = value;
    if (cls) el.className = cls;
  }
  set("ev-verified", ev.verified ? "VERIFIED" : "UNVERIFIED", ev.verified ? "good" : "warn");
  set("ev-branch", ev.branch || "not recorded");
  set("ev-commit", ev.commit || "not recorded");
  set("ev-pr", ev.prUrl || "no PR recorded yet");
  set("ev-ci", ev.ciStatus || "not checked");
  const cmdList = document.getElementById("ev-commands");
  if (cmdList && Array.isArray(ev.commands)) {
    ev.commands.forEach((c) => {
      const li = document.createElement("li");
      li.textContent = c.cmd + " -> " + c.result;
      cmdList.appendChild(li);
    });
  }
  const revList = document.getElementById("ev-reviewers");
  if (revList) {
    if (Array.isArray(ev.reviewers) && ev.reviewers.length > 0) {
      ev.reviewers.forEach((r) => {
        const li = document.createElement("li");
        li.textContent = typeof r === "string" ? r : r.agent + ": " + r.summary;
        revList.appendChild(li);
      });
    } else {
      const li = document.createElement("li");
      li.textContent = "reviewer-agent findings not recorded yet";
      revList.appendChild(li);
    }
  }

  show(0);
})();
