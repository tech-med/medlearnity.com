<!-- start Simple Custom CSS and JS -->
<script type="text/javascript">

(function () {
  console.log("[UTM] Page 2 iframe injector loaded with retry");

  const iframeId = "JotFormIFrame-241902592523455"; // updated for page 2 iframe
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

    // Keep any existing query params already present in the iframe src (like email2, name, etc.)
    const currentSrc = iframe.getAttribute("src");
    const baseSrc = currentSrc.split("?")[0];
    const existingParams = new URLSearchParams(currentSrc.split("?")[1]);

    // Merge with stored UTM params
    for (const [key, val] of Object.entries(params)) {
      if (val) existingParams.set(key, val);
    }

    const newSrc = `${baseSrc}?${existingParams.toString()}`;
    iframe.setAttribute("src", newSrc);
    console.log("[UTM] Updated iframe src on Page 2:", newSrc);
    return true;
  }

  function tryInject(retriesLeft) {
    if (updateIframeSrc()) return;
    if (retriesLeft <= 0) {
      console.warn("[UTM] Page 2 iframe not found after all retries.");
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
