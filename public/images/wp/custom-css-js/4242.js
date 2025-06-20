<!-- start Simple Custom CSS and JS -->
<script type="text/javascript">
    (function ($) {
        $(window).load(function () {
            $form = $('.gform_wrapper');
            if($form.length > 0) {
                setTimeout(function() {
                    if(typeof MCFX === "object" && typeof MCFX.getUTMParams === "function") {
                        var referrer = MCFX.Cookie.get('fx_referrer') || '';
                        $.ajax('//api.leadmanagerfx.com/visitor/information', {
                            'type': 'post',
                            'data': {'referrer': referrer},
                            'success': function(data) {
                                var $source = $form.find('.js-utm-source');
                                var $medium = $form.find('.js-utm-medium');
                                var $campaign = $form.find('.js-utm-campaign');
                                var $content = $form.find('.js-utm-content');
                                var $term = $form.find('.js-utm-term');

                                // ref: https://docs.gravityforms.com/gform_field_input/
                                // Please note: if you use a custom name attribute then Gravity Forms won’t know how to access the value so it will not be saved during form submission.
                                var $GFsource = $form.find('.gf-utm-source input');
                                var $GFmedium = $form.find('.gf-utm-medium input');
                                var $GFcampaign = $form.find('.gf-utm-campaign input');
                                var $GFcontent = $form.find('.gf-utm-content input');
                                var $GFterm = $form.find('.gf-utm-term input');

                                $source.val(data.source);
                                $medium.val(data.medium);
                                $term.val(data.term);

                                $GFsource.val(data.source);
                                $GFmedium.val(data.medium);
                                $GFterm.val(data.term);

                                var utms = MCFX.getUTMParams();
                                $.each(utms, function(index, utm) {
                                    switch(utm.key) {
                                        case 'utm_source':
                                            $source.val(utm.value);
                                            $GFsource.val(utm.value);
                                            break;
                                        case 'utm_medium':
                                            $medium.val(utm.value);
                                            $GFmedium.val(utm.value);
                                            break;
                                        case 'utm_campaign':
                                            $campaign.val(utm.value);
                                            $GFcampaign.val(utm.value);
                                            break;
                                        case 'utm_content':
                                            $content.val(utm.value);
                                            $GFcontent.val(utm.value);
                                            break;
                                        case 'utm_term':
                                            $term.val(utm.value);
                                            $GFterm.val(utm.value);
                                            break;
                                    }
                                });
                            }
                        });
                    }
                }, 2500);
            }
        });
    })(jQuery);</script>
<!-- end Simple Custom CSS and JS -->
