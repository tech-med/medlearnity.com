<!-- start Simple Custom CSS and JS -->
<script type="text/javascript">
(function() {
    function getQueryParam(name) {
        var urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }

    function setCookie(name, value, days) {
        var expires = "";
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + value + "; path=/" + expires;
    }

    // Check if GCLID exists in URL
    var gclid = getQueryParam("gclid");
    if (gclid) {
        setCookie("gclid", gclid, 30); // Store in cookie for 30 days
    }
})();
</script>
<!-- end Simple Custom CSS and JS -->
