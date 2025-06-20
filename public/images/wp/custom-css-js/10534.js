<!-- start Simple Custom CSS and JS -->
<script type="text/javascript">

(function () {
  console.log("[UTM] JotForm iframe injector for Form ID 241902608612452");

  const iframeSelector = "iframe[src*='form.jotform.com/241902608612452']";
  const maxRetries = 10;
  const retryDelay = 3000;

  const utmParams = {
    utm_source: localStorage.getItem("utm_source"),
    utm_medium: localStorage.getItem("utm_medium"),
    utm_campaign: localStorage.getItem("utm_campaign"),
    utm_adgroup: localStorage.getItem("utm_adgroup"),
    gclid: localStorage.getItem("gclid")
  };

  function updateIframeSrc() {
    const iframe = document.querySelector(iframeSelector);
    if (!iframe) return false;

    const baseSrc = iframe.getAttribute("src").split("?")[0];
    const existingParams = new URLSearchParams(iframe.getAttribute("src").split("?")[1] || "");

    for (const [key, value] of Object.entries(utmParams)) {
      if (value) existingParams.set(key, value);
    }

    const newSrc = `${baseSrc}?${existingParams.toString()}`;
    iframe.setAttribute("src", newSrc);
    console.log("[UTM] Updated iframe src with UTM params:", newSrc);
    return true;
  }

  function tryInject(retriesLeft) {
    if (updateIframeSrc()) return;
    if (retriesLeft <= 0) {
      console.warn("[UTM] Iframe not found after all retries.");
      return;
    }
    setTimeout(() => tryInject(retriesLeft - 1), retryDelay);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => tryInject(maxRetries));
  } else {
    tryInject(maxRetries);
  }
})();

</script>
<!-- end Simple Custom CSS and JS -->
