<!-- start Simple Custom CSS and JS -->
<script type="text/javascript">

(function () {
  console.log("[UTM] JotForm source-embed injector loaded — will run in 10 seconds");

  const fieldMap = {
    gclid: "input_13",
    utm_source: "input_91",
    utm_medium: "input_92",
    utm_campaign: "input_93",
    utm_adgroup: "input_94"
  };

  function injectUTMFields() {
    let foundOne = false;

    for (const [key, fieldId] of Object.entries(fieldMap)) {
      const value = localStorage.getItem(key);
      const field = document.getElementById(fieldId);

      if (value && field) {
        field.value = value;
        console.log(`[UTM] Injected ${key} into #${fieldId}: ${value}`);
        foundOne = true;
      } else if (!field) {
        console.warn(`[UTM] Field #${fieldId} not found for ${key}`);
      } else {
        console.log(`[UTM] No stored value found for ${key}`);
      }
    }

    if (!foundOne) {
      console.warn("[UTM] No UTM fields injected — either values missing or fields not found.");
    }
  }

  function startAfterDelay() {
    setTimeout(injectUTMFields, 10000); // 10 seconds
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startAfterDelay);
  } else {
    startAfterDelay();
  }
})();

</script>
<!-- end Simple Custom CSS and JS -->
