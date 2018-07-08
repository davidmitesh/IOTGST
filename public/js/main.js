let ids,lats,longs,myLatLng,maps,marker,trafficLayer,busno,deviceId,adeviceId,name,cschool,cid,m,interval;

(function ($) {
    // USE STRICT
    "use strict";
    $(".animsition").animsition({
      inClass: 'fade-in',
      outClass: 'fade-out',
      inDuration: 900,
      outDuration: 900,
      linkElement: 'a:not([target="_blank"]):not([href^="#"]):not([class^="chosen-single"])',
      loading: true,
      loadingParentElement: 'html',
      loadingClass: 'page-loader',
      loadingInner: '<div class="page-loader__spin"></div>',
      timeout: false,
      timeoutCountdown: 5000,
      onLoadEvent: true,
      browser: ['animation-duration', '-webkit-animation-duration'],
      overlay: false,
      overlayClass: 'animsition-overlay-slide',
      overlayParentElement: 'html',
      transition: function (url) {
        window.location.href = url;
      }
    });
    
	$(document).keydown(function(event) { 
     if (event.keyCode == 27) { 
             $(".btn-outline-danger").click();
      }
    });
	name=new Array();
	busno=new Array();
	adeviceId=new Array();
	for(var i=0;i<$(".invisible").length;i++){
	   
	   let m=JSON.parse($($(".invisible")[i]).html());
	   if(m.name!=null && m.busno!=0){
	       adeviceId.push(m.deviceId);  
	   }
	   if(m.name!=null){
	     name.push(m.name);
	   }
	   if(m.busno!=0){
	     busno.push(m.busno);
	   }
	}
	if(busno.length!=0){
	   m=0;
	  $(".filters").css('display','block');
	  busno.forEach((val,index)=>{
	    $(".schooln").append("<option value=\"bus\""+index+"\">"+name[index]+"</option>");
		$(".busn").append("<option value=\"device\""+index+"\">"+val+"</option>");
	  });
	}else{
	   $(".filters").css('display','none');
	}
	
  })(jQuery);

(function ($) {
  "use strict";
  try {
    var map = $('#map');
    if(map[0]) {
	  if(busno.length!=0){
	   showmapnow();
	   cschool=name.indexOf($(".schooln :selected").text());
	   cid=busno.indexOf(Number($(".busn :selected").text()));
	   mapagain();
	   mapit();
	   $(".schooln").change(()=>{
	        cschool=name.indexOf($(".schooln :selected").text());
			mapit();
	   });
	   $(".busn").change(()=>{
	        cid=busno.indexOf(Number($(".busn :selected").text()));
			mapit();
	   });
	  }else{
	    map.empty();
	    map.html("<p style=\"margin-top:200px\">No any buses found for tracking</p>");
	  }
    }
  } catch (error) {
    console.log(error);
  }

  
})(jQuery);


function mapit(){
    if(cschool!=cid){
		 if(interval){
		   clearInterval(interval);
		 }
	     exception();
	}else{
	     m=cschool;
		 showmapnow();
		 mapagain();
		  interval=setInterval(()=>{
		   mapagain();
	      },5000);
     }
}
function exception(map){
  $('#map').empty();
  $('#map').html("<p style=\"margin-top:200px\">Use proper combination of school and its bus for tracking</p>");
}

function mapagain(){
    ids=new Array();
    lats=new Array();
    longs=new Array();
	$.ajax({
       url:"http://admin:admin@35.200.173.47/api/positions",
	   crossDomain: true,
       type:"GET",
	   xhrFields: {
        withCredentials: true
       },
       success:(res)=>{
		    JSON.parse(JSON.stringify(res)).forEach((val)=>{
            let v=JSON.parse(JSON.stringify(val));
            ids.push(v.id);
            lats.push(v.latitude);
            longs.push(v.longitude);
        });
        mapfinal(m);
	   },
	   error:(err)=>{
		  $('#map').html("<p class=\"text-center\" style=\"margin-top:150px;\">Sorry, Error in map data fetching!!! Please try again later!!!</p>");
	   }
	});
}

function mapfinal(m){
    myLatLng={
        lat: parseFloat(lats[m]), 
        lng: parseFloat(longs[m])
    };
    maps.setCenter(myLatLng);
    marker.setPosition(myLatLng);
    trafficLayer = new google.maps.TrafficLayer();
    trafficLayer.setMap(maps);
	let contentString="School: "+$(".schooln :selected").text()+", Bus No.: "+$(".busn :selected").text();
	let infowindow = new google.maps.InfoWindow({
        content: contentString
     });
     google.maps.event.addListener(marker, 'click', function() {
        infowindow.open(map,marker);
     });
}

function showmapnow(){
    maps = new google.maps.Map(document.getElementById('map'), {
        zoom: 15,
        zoomControlOptions: {
            position: google.maps.ControlPosition.LEFT_CENTER
        },
        streetViewControl:false
      });
	marker = new google.maps.Marker({
        map: maps
    });
}

(function ($) {
  // Use Strict
  "use strict";
  try {
    var progressbarSimple = $('.js-progressbar-simple');
    progressbarSimple.each(function () {
      var that = $(this);
      var executed = false;
      $(window).on('load', function () {

        that.waypoint(function () {
          if (!executed) {
            executed = true;
            /*progress bar*/
            that.progressbar({
              update: function (current_percentage, $this) {
                $this.find('.js-value').html(current_percentage + '%');
              }
            });
          }
        }, {
            offset: 'bottom-in-view'
          });

      });
    });
  } catch (err) {
    console.log(err);
  }
})(jQuery);
(function ($) {
  // USE STRICT
  "use strict";

  // Scroll Bar
  try {
    var jscr1 = $('.js-scrollbar1');
    if(jscr1[0]) {
      const ps1 = new PerfectScrollbar('.js-scrollbar1');      
    }

    var jscr2 = $('.js-scrollbar2');
    if (jscr2[0]) {
      const ps2 = new PerfectScrollbar('.js-scrollbar2');

    }

  } catch (error) {
    console.log(error);
  }

})(jQuery);
(function ($) {
  // USE STRICT
  "use strict";

  // Select 2
  try {

    $(".js-select2").each(function () {
      $(this).select2({
        minimumResultsForSearch: 20,
        dropdownParent: $(this).next('.dropDownSelect2')
      });
    });

  } catch (error) {
    console.log(error);
  }


})(jQuery);
(function ($) {
  // USE STRICT
  "use strict";

  // Dropdown 
  try {
    var menu = $('.js-item-menu');
    var sub_menu_is_showed = -1;

    for (var i = 0; i < menu.length; i++) {
      $(menu[i]).on('click', function (e) {
        e.preventDefault();
        $('.js-right-sidebar').removeClass("show-sidebar");        
        if (jQuery.inArray(this, menu) == sub_menu_is_showed) {
          $(this).toggleClass('show-dropdown');
          sub_menu_is_showed = -1;
        }
        else {
          for (var i = 0; i < menu.length; i++) {
            $(menu[i]).removeClass("show-dropdown");
          }
          $(this).toggleClass('show-dropdown');
          sub_menu_is_showed = jQuery.inArray(this, menu);
        }
      });
    }
    $(".js-item-menu, .js-dropdown").click(function (event) {
      event.stopPropagation();
    });

    $("body,html").on("click", function () {
      for (var i = 0; i < menu.length; i++) {
        menu[i].classList.remove("show-dropdown");
      }
      sub_menu_is_showed = -1;
    });

  } catch (error) {
    console.log(error);
  }

  var wW = $(window).width();
    // Right Sidebar
    var right_sidebar = $('.js-right-sidebar');
    var sidebar_btn = $('.js-sidebar-btn');

    sidebar_btn.on('click', function (e) {
      e.preventDefault();
      for (var i = 0; i < menu.length; i++) {
        menu[i].classList.remove("show-dropdown");
      }
      sub_menu_is_showed = -1;
      right_sidebar.toggleClass("show-sidebar");
    });

    $(".js-right-sidebar, .js-sidebar-btn").click(function (event) {
      event.stopPropagation();
    });

    $("body,html").on("click", function () {
      right_sidebar.removeClass("show-sidebar");

    });
 

  // Sublist Sidebar
  try {
    var arrow = $('.js-arrow');
    arrow.each(function () {
      var that = $(this);
      that.on('click', function (e) {
        e.preventDefault();
        that.find(".arrow").toggleClass("up");
        that.toggleClass("open");
        that.parent().find('.js-sub-list').slideToggle("250");
      });
    });

  } catch (error) {
    console.log(error);
  }


  try {
    // Hamburger Menu
    $('.hamburger').on('click', function () {
      $(this).toggleClass('is-active');
      $('.navbar-mobile').slideToggle('500');
    });
    $('.navbar-mobile__list li.has-dropdown > a').on('click', function () {
      var dropdown = $(this).siblings('ul.navbar-mobile__dropdown');
      $(this).toggleClass('active');
      $(dropdown).slideToggle('500');
      return false;
    });
  } catch (error) {
    console.log(error);
  }
})(jQuery);


function deletedata(name){
   $.post("/deleteSchool",{schoolname:name});
   window.location.reload();
}

function editdata(name,uname,address,email,number){
    $("#sform").trigger('reset');
   //$('#sform').attr('action',
   $("#z1").val(name);
   $("#z2").val(uname);
   $("#z3").attr("placeholder","Enter New School Password");
   $("#z4").val(number);
   $("#z5").val(address);
   $("#z6").val(email);
   $("#headis").text("Edit School Data Below");
   $("#adds").text("Edit");
   $("#editSchool").modal('show');
}

function newschool(){
    $("#sform").trigger('reset');
   $('#sform').attr('action','/addSchool');
   $("#headis").text("Add New School");
   $("#z3").attr("placeholder","Enter School Password");
   $("#adds").text("Add");
   $("#editSchool").modal('show');
}