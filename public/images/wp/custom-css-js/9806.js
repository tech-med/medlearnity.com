<!-- start Simple Custom CSS and JS -->
<script type="text/javascript">
(function() {
    function getQueryParam(name) {
        var urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }

    function updateLinks(gclid) {
        if (!gclid) return;

        document.querySelectorAll("a[href^='/'], a[href^='https://www.medlearnity.com']").forEach(function(link) {
            var url = new URL(link.href, window.location.origin);
            if (!url.searchParams.has("gclid")) {
                url.searchParams.set("gclid", gclid);
                link.href = url.toString();
            }
        });
    }

    var gclid = getQueryParam("gclid");

    if (gclid) {
        sessionStorage.setItem("gclid", gclid); // Store it temporarily
    } else {
        gclid = sessionStorage.getItem("gclid"); // Retrieve it if missing
    }

    updateLinks(gclid);
})();

</script>
<!-- end Simple Custom CSS and JS -->
