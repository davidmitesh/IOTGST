let ids,lats,longs,myLatLng,maps,marker,trafficLayer,busno,deviceId,adeviceId,name,cschool,cid,m,interval,bool,tt=1,fg,lg,ids1,h,infowindow;

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

	let data=JSON.parse($("#schoos").html());
	if(data.length!=0){
	for(var i=0;i<data.length;i++){
	     if(data[i].parents.length==0){
		      bool=true;
		 }else{
		     bool=false;
			 break;
		 }
	 }
	 if(bool==true){
	     $("#nops").show();
		 $("#nopi").hide();
	 }else{
	     $("#nops").hide();
		 $("#nopi").show();
	 }
	}
	if(busno.length!=0){
	   m=0;
	  $(".filters").css('display','block');
	  busno.forEach((val,index)=>{
		$(".busn").append("<option value=\"device\""+index+"\">"+val+"</option>");
	  });
	  var name1=[...new Set(name)];
	  name1.forEach((val,index)=>{
	    $(".schooln").append("<option value=\"bus\""+index+"\">"+name1[index]+"</option>");
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

	  ids1=new Array();
	$.ajax({
       url:"http://admin:admin@35.200.251.179/api/positions",
	   crossDomain: true,
       type:"GET",
	   xhrFields: {
        withCredentials: true
       },
       success:(res)=>{
		    JSON.parse(JSON.stringify(res)).forEach((val)=>{
            let v=JSON.parse(JSON.stringify(val));
            ids1.push(v.deviceId);
        });

		$("#cid").empty();
		ids1.forEach((val)=>{
		   $("#cid").append("<option value=\""+val+"\">"+val+"</option>");
	    });

	   },
	   error:(err)=>{
		  $("#cid").empty();
		  $("#cid").append("<option value=\"\">Could not fetch devices from server</option>");
	   }
	 });


	  if(busno.length!=0){
	   showmapnow();
	   mapagain();
	   mapit();
	   $(".schooln").change(()=>{
			mapit();
	   });
	   $(".busn").change(()=>{
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


function downloadreport(){
    let data="http://admin:admin@35.200.251.179/api/reports/summary?";
	data+="deviceId="+$("#cid").val()+"&";
	data+="from="+$("#date").val().split("-").reverse().join("-")+"&";
	data+="to="+$("#date1").val().split("-").reverse().join("-");

  $.ajax({
       url:data,
	   crossDomain: true,
       type:"GET",
	   xhrFields: {
        withCredentials: true
       },
       success:(res)=>{
		    $.post("/csv",{data:JSON.stringify(res)}).then((response)=>{
				window.location.href="/data/report.csv";
			});
	   },
	   error:(err)=>{
		  $("#addy").css("height","400px");
		  $("#erru").css("display","block");
	   }
	});
}

function mapit(){
	let d=false;
	name.forEach((val,index)=>{
	  if(val==$(".schooln :selected").text() && busno[index]==$(".busn :selected").text()){
	      m=index;
		  d=true;
	  }
	});
    if(d==false){
		 if(interval){
		   clearInterval(interval);
		 }
	     exception();
	}else{
		  showmapnow();
		  h=0;
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
       url:"http://admin:admin@35.200.251.179/api/positions",
	   crossDomain: true,
       type:"GET",
	   xhrFields: {
        withCredentials: true
       },
       success:(res)=>{
		    JSON.parse(JSON.stringify(res)).forEach((val)=>{
            let v=JSON.parse(JSON.stringify(val));
            ids.push(v.deviceId);
            lats.push(v.latitude);
            longs.push(v.longitude);
        });

        mapfinal(ids.indexOf(adeviceId[m]));
	   },
	   error:(err)=>{
		  $('#map').html("<p class=\"text-center\" style=\"margin-top:150px;\">Sorry, Error in map data fetching!!! Please try again later!!!</p>");
	   }
	});

	//$('#map').html("<p class=\"text-center\" style=\"margin-top:150px;\">Sorry, Error in map data fetching!!! Please try again later!!!</p>");
}

function mapfinal(g){
	let contentString;
	infowindow = new google.maps.InfoWindow();
    myLatLng={
        lat: parseFloat(lats[g]),
        lng: parseFloat(longs[g])
    };
	let geocoder = new google.maps.Geocoder;
	maps.setCenter(myLatLng);
    marker.setPosition(myLatLng);
    trafficLayer = new google.maps.TrafficLayer();
    trafficLayer.setMap(maps);
	geocoder.geocode({'location': myLatLng}, function(results, status) {
	  if (status === 'OK') {
	     contentString=results[0].formatted_address;
       google.maps.event.addListener(marker, 'click', function() {
		 infowindow.setContent(contentString);
         infowindow.open(map,marker);
        });
	  }
	});

}

function showmapnow(){
    maps = new google.maps.Map(document.getElementById('map'), {
        zoom: 18,
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
   $('#sform').attr('action','/modifySchool');
   $("#z1").val(name);
   $("#z2").val(uname);
   $("#z3").attr("placeholder","Enter New School Password");
   $("#z4").val(number);
   $("#z4").attr("name","contactNumber");
   $("#z5").val(address);
   $("#z6").val(email);
   $("#z6").attr("name","emailAddress");
   $("#headis").text("Edit School Data Below");
   $("#adds").text("Edit");
   $("#editSchool").modal('show');
}

function newschool(){
   $("#sform").trigger('reset');
   $('#sform').attr('action','/addSchool');
   $("#headis").text("Add New School");
   $("#z3").attr("placeholder","Enter School Password");
   $("#z4").attr("name","number");
   $("#z6").attr("name","email");
   $("#adds").text("Add");
   $("#editSchool").modal('show');
}

function assigndata(number,name,id){
   $("#isu").hide();
   $("#am").css("float","right");
   $("#amm").show();
   $("#dform").trigger('reset');
   //$("#dform").attr("action","/busNumberWithDevice");
   if($("#did option[value='"+id+"']").length==0){
      $("#did").append("<option value=\""+id+"\">"+id+"</option>");
	  $("#did").val(id);
	  $("#ullu").text("Sorry no other empty devices found for assigning");
	  $("#am").attr('disabled','disabled');
   }else{
	 $("#el").hide();
     $("#did").val(id);
	 $("#am").removeAttr('disabled');
	 //$("#amm").attr('disabled','disabled');
   }
   if(name!=null){
     $("#sid").val(name);
   }
   if(number!=0){
     $("#bid").val(number);
   }
   $("#devicestates").modal('show');
}

function newassign(){
   $("#amm").hide();
   $("#isu").hide();
   $("#am").css("float","center");
   $("#dform").trigger('reset');
   //$("#dform").attr("action","/busNumberWithDevice");
   $("#el").show();
   $("#devicestates").modal('show');
}

function unassign(){
   if($("#did").val().length==0||$("#sid").val().length==0 || $("#bid").val().length==0 || $("#bid").val().indexOf(",")!=-1 || $("#bid").val().indexOf(".")!=-1){
      $("#isu").text("Please select or input proper values");
	  $("#isu").show();
   }
   else{
	   let data={};
	   data["deviceId"]=$("#did").val();
	   data["schoolName"]=$("#sid").val();
	   data["busNumber"]=$("#bid").val();
       $.post("/unassign",data);
	   window.location.reload();
   }
}

function newparent(){
   $("#pform").trigger('reset');
   $('#pform').attr('action','/addParent');
   $("#headip").text("Add New Parent");
   $("#addp").text("Add");
   $("#editParent").modal('show');
}

function peditdata(parentname,school,children,number,email,address){
   $("#pform").trigger('reset');
   $("#pform").attr("action","/modifyParent");
   $("#headip").text("Edit Parent Below");

   JSON.parse(children).forEach((val,index)=>{
	  fg=val.childName.split(",");
	  lg=val.busNumber.split(",");

	   $("#y51").val(fg[0]);
	   $("#y71").val(lg[0]);

	  if(fg.length!=1){
	  for(let i=1;i<fg.length;i++){
	    let j=i+1;
		if(!$("#y5"+j).length){
	      $("#tt").append("<input type=\"text\" id=\"y5"+j+"\" name=\"childname\" style=\"margin-top:20px; width:35%; float:left; margin-right:10px;\"  class=\"form-control\" placeholder=\"Enter childname\"><input type=\"text\" id=\"y7"+j+"\" name=\"busnumber\" style=\"margin-top:20px; width:58%\" class=\"form-control\" placeholder=\"Enter bus number (Keep empty if not fixed)\"><i class=\"fas fa-minus\" style=\"float:right; margin-top:-30px;\" id=\"i"+j+"\" onclick=\"fdexpand("+j+")\" style=\"width:10%;\"></i>");
		}
		$("#y5"+j).val(fg[i]);
	    $("#y7"+j).val(lg[i]);
	  }
	  }else{
		if($("#tt input").length>1){
	     $("#tt>input:gt(1)").remove();
		}
	  }
   });
   $("#y1").val(parentname);
   $("#y2").val(number);
   $("#y3").val(address);
   $("#y4").val(email);
   $("#y6").val(school);
   $("#pform").append("<input type=\"hidden\"  name=\"oldnumber\" value=\""+number+"\">");
   $("#pform").append("<input type=\"hidden\" name=\"oldnum\" value=\""+fg.length+"\">");
   $("#addp").text("Edit");
   $("#editParent").modal('show');
}

function pdeletedata(number,name){
    $.post("/deleteParent",{mobilenumber:parseInt(number),schoolname:name});
	window.location.reload();
}

function fexpand(){
	  tt++;
      $("#tt").append("<input type=\"text\" id=\"y5"+tt+"\" name=\"childname\" style=\"margin-top:20px; width:35%; float:left; margin-right:10px;\"  class=\"form-control\" placeholder=\"Enter childname\"><input type=\"text\" id=\"y7"+tt+"\" name=\"busnumber\" style=\"margin-top:20px; width:58%\" class=\"form-control\" placeholder=\"Enter bus number (Keep empty if not fixed)\"><i class=\"fas fa-minus\" style=\"float:right; margin-top:-30px;\" id=\"i"+tt+"\" onclick=\"fdexpand("+tt+")\" style=\"width:10%;\"></i>");
}

function fdexpand(a){
  $("#y5"+a).remove();
  $("#y7"+a).remove();
  $("#i"+a).remove();
}

function checksame(){
  let m=false;
  if($("#bid").val().indexOf(",")!=-1 || $("#bid").val().indexOf(".")!=-1){
     $("#isu").text("Please select or input proper values");
	  $("#isu").show();
  }else{
  busno.forEach((val,index)=>{
   if(val==$("#bid").val().toString() && name[index]==$("#sid").val().toString()){
       m=true;
   }
  });

  if(m==true){
    $("#devicestates").submit(function(e){
          e.preventDefault();
		  $("#isu").text("The bus numbered "+$("#bid").val().toString()+" of school "+$("#sid").val().toString()+" has already been assigned by another device");
		  $("#isu").show();
       });
  }else{
      $("#devicestates").unbind('submit').submit();
   }
 }
}


function show(n){
  switch(n){
    case 0:

	 $(".user-data").show(); //user data is mean data
	 $(".map-data").hide();
	 $(".school-data").hide();
	 $(".parent-data").hide();
	 $(".device-data").hide();
	 $(".report-data").hide();
	 break;
	case 1:

	  break;
	case 2:
	  $(".user-data").hide(); //user data is mean data
	 $(".map-data").hide();
	 $(".school-data").hide();
	 $(".parent-data").show();
	 $(".device-data").hide();
	 $(".report-data").hide();
	  break;
	case 3:
	   $(".user-data").hide(); //user data is mean data
	 $(".map-data").show();
	 $(".school-data").hide();
	 $(".parent-data").show();
	 $(".device-data").hide();
	 $(".report-data").hide();
	  break;
	case 4:
	  $(".user-data").hide(); //user data is mean data
	 $(".map-data").hide();
	 $(".school-data").hide();
	 $(".parent-data").hide();
	 $(".device-data").hide();
	 $(".report-data").show();
	  break;
	case 5:
	  $(".user-data").hide(); //user data is mean data
	 $(".map-data").hide();
	 $(".school-data").hide();
	 $(".parent-data").hide();
	 $(".device-data").show();
	 $(".report-data").hide();
	  break;
	case 6:

	   break;
	case 7:
	   break;
  }
}

function addn(){
  if($("#d1").val().length==0){
	$("#yahoo").text("Please enter a valid device name");
    $('#yahoo').show();
  }else{
  $('#yahoo').hide();
  let data={};
  data["name"]=$("#d1").val();
  data["uniqueId"]="86696803013"+Math.floor(Math.random()*9999+1000).toString();
  $.ajax({
       url:"http://admin:admin@35.200.251.179/api/devices",
	   crossDomain: true,
       type:"POST",
	   headers:{
	     'Content-Type': 'application/json'
	   },
	   data:JSON.stringify(data),
	   xhrFields: {
        withCredentials: true
       },
       success:(res)=>{
		  $("#yahoo").text("The device has been succesfully added.");
		  $('#yahoo').show();
	   },
	   error:(err)=>{
		  $("#yahoo").text("An unexpected error arised. Please try again");
		  $('#yahoo').show();
	   }
	});
  }
}

function sadd(){
   $("#deform").trigger('reset');
   $("#yahoo").hide();
   $("#addit").modal("show");
}
