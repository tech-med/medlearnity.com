<!-- start Simple Custom CSS and JS -->
<script type="text/javascript">

(function () {
  console.log("[UTM] First-touch tracker loaded");

  function getParam(param) {
    const params = new URLSearchParams(window.location.search);
    return params.get(param);
  }

  function detectFallback() {
    const ref = document.referrer;
    if (!ref) return { source: 'direct', medium: 'none' };

    const refHost = new URL(ref).hostname;
    const currentHost = window.location.hostname;

    if (refHost === currentHost) return { source: 'direct', medium: 'none' };
    if (refHost.includes('google.')) return { source: 'google', medium: 'organic' };
    if (refHost.includes('bing.')) return { source: 'bing', medium: 'organic' };
    if (refHost.includes('yahoo.')) return { source: 'yahoo', medium: 'organic' };
    if (refHost.includes('duckduckgo.')) return { source: 'duckduckgo', medium: 'organic' };
    if (refHost.includes('facebook.')) return { source: 'facebook', medium: 'social' };
    if (refHost.includes('twitter.')) return { source: 'twitter', medium: 'social' };
    if (refHost.includes('linkedin.')) return { source: 'linkedin', medium: 'social' };

    return { source: refHost, medium: 'referral' };
  }

  const keys = ['gclid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_adgroup'];

  keys.forEach(key => {
    const existing = localStorage.getItem(key);
    const urlValue = getParam(key);

    if (existing) {
      console.log(`[UTM] Found existing ${key}: ${existing}`);
    } else if (urlValue) {
      localStorage.setItem(key, urlValue);
      console.log(`[UTM] Stored ${key}: ${urlValue}`);
    } else if (key === 'utm_source' || key === 'utm_medium') {
      const fallback = detectFallback();
      const fallbackVal = key === 'utm_source' ? fallback.source : fallback.medium;
      localStorage.setItem(key, fallbackVal);
      console.log(`[UTM] Fallback ${key}: ${fallbackVal}`);
    } else {
      console.log(`[UTM] No ${key} found in URL or storage`);
    }
  });
})();

</script>
<!-- end Simple Custom CSS and JS -->
