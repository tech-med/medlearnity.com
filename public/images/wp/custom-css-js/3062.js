<!-- start Simple Custom CSS and JS -->
<script type="text/javascript">
/* Default comment here */ 
	jQuery( document ).ready(function() {
      
      jQuery(function() {
        
         jQuery('input.datepicker').datepicker({ 
		 beforeShow: function (input, inst) {
        setTimeout(function () {
            inst.dpDiv.css({
                top: $("input.datepicker").offset().top + 50,
                left: $("input.datepicker").offset().left
            });
        }, 0);
    }}).attr('readonly','readonly');
        
   	  });
      
	});</script>
<!-- end Simple Custom CSS and JS -->
