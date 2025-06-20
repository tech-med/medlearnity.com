<!-- start Simple Custom CSS and JS -->
<script type="text/javascript">
(function() {
    function getQueryParam(name) {
        var urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }

    var gclid = getQueryParam("gclid") || sessionStorage.getItem("gclid");

    if (gclid && !window.location.search.includes("gclid=")) {
        var url = new URL(window.location.href);
        url.searchParams.set("gclid", gclid);
        window.history.replaceState({}, "", url.toString());
    }
})();

</script>
<!-- end Simple Custom CSS and JS -->
