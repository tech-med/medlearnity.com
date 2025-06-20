<!-- start Simple Custom CSS and JS -->
<script type="text/javascript">
  jQuery(function () {
    var referrer = MCFX.Cookie.get('fx_referrer') || '',
        gclid = MCFX.Cookie.get('gclid') || '';              
    jQuery.post('https://api.leadmanagerfx.com/visitor/information', { referrer: referrer }).done(function (response) {  

    
    
			  	var input = document.querySelector("#input_4_9");
		     	var input2 = document.querySelector("#input_8_9");
				var input3 = document.querySelector("#input_3_18");
		
		
		
		      input.setAttribute('value',gclid);
		 	  input2.setAttribute('value',gclid);
		 	  input3.setAttribute('value',gclid);
             
                  
      
		 
		   });
	   });
</script>
<!-- end Simple Custom CSS and JS -->
