
/* Returning members must not watch the landing page flash past on every
   visit, so the class that hides it goes on before the first paint. */
(function () {
  try {
    var seen = localStorage.getItem("ggpartner.seenApp") === "1";
    if (seen) document.documentElement.classList.add("app-mode");
  } catch (e) {}
})();
