<!-- start Simple Custom CSS and JS -->
<script type="text/javascript">
(function () {
  console.log("[UTM] Dynamic iframe injector loaded with retry");

  const iframeId = "JotFormIFrame-250783611516456";
  const maxRetries = 50;
  const delay = 300;

  function updateIframeSrc() {
    const iframe = document.getElementById(iframeId);
    if (!iframe) return null;

    const params = {
      utm_source: localStorage.getItem("utm_source"),
      utm_medium: localStorage.getItem("utm_medium"),
      utm_campaign: localStorage.getItem("utm_campaign"),
      utm_adgroup: localStorage.getItem("utm_adgroup"),
      gclid: localStorage.getItem("gclid")
    };

    const queryString = Object.entries(params)
      .filter(([_, v]) => v)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join("&");

    const baseSrc = iframe.getAttribute("src").split("?")[0];
    const newSrc = `${baseSrc}?${queryString}`;

    iframe.setAttribute("src", newSrc);
    console.log("[UTM] Updated iframe src:", newSrc);
    return true;
  }

  function tryInject(retriesLeft) {
    if (updateIframeSrc()) return;
    if (retriesLeft <= 0) {
      console.warn("[UTM] Iframe not found after all retries.");
      return;
    }
    setTimeout(() => tryInject(retriesLeft - 1), delay);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => tryInject(maxRetries));
  } else {
    tryInject(maxRetries);
  }
})();

</script>
<!-- end Simple Custom CSS and JS -->
