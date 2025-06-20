<!-- start Simple Custom CSS and JS -->
<script type="text/javascript">
jQuery(function () {
    function getCookie(name) {
        var match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
        return match ? decodeURIComponent(match[2]) : "";
    }

    function extractGclid(cookieValue) {
        var match = cookieValue.match(/[?&]gclid=([^&]+)/);
        return match ? match[1] : ""; // Extract only the GCLID value
    }

    function setGclid() {
        var rawCookieValue = getCookie("gclid");
        var gclid = extractGclid(rawCookieValue); // Get clean GCLID value
        var gclidField = document.querySelector("input[name='q13_gclid1']");

        if (gclidField && gclid) {
            gclidField.value = gclid;
            console.log("✅ GCLID Passed to JotForm:", gclid);
        } else {
            console.warn("⚠️ GCLID not found or field missing");
        }
    }

    // Run only if JotForm is present
    document.addEventListener("DOMContentLoaded", function () {
        if (document.querySelector("form.jotform-form")) {
            setTimeout(setGclid, 1000);
        }
    });
});

</script>
<!-- end Simple Custom CSS and JS -->
