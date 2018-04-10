var client;
var iotfData = {};
var qsMode = true;
var msgInterval;
var pubTopic = 'iot-2/evt/status/fmt/json';
var subTopic = 'iot-2/cmd/buzz/fmt/json'
var phoneData = {};
phoneData.d = {};
var locationData = [];

phoneData.toJson = function() {
  return JSON.stringify(this);
}

phoneData.publish = function() {
  console.log("publishing");
  var message = new Paho.MQTT.Message(phoneData.toJson());
  message.destinationName = pubTopic;
  client.send(message);
}

init();

function register() {
  var xhr = new XMLHttpRequest();
  xhr.open('get', '/register');

  xhr.onreadystatechange = function() {
    if(xhr.readyState === 4)  {
      if(xhr.status === 200) {
        resp = JSON.parse(xhr.responseText)
        localStorage.setItem("iotf", true);
        localStorage.setItem("clientId", resp.uuid);
        localStorage.setItem("org", resp.uuid.split(":")[1]);
        localStorage.setItem("deviceType", resp.type);
        localStorage.setItem("deviceId", resp.id);
        localStorage.setItem("password", resp.password);

        client.disconnect();
        location.reload();
      }
    }
  }
  xhr.send(null);
}

function clearData() {
  var xhr = new XMLHttpRequest();
  xhr.open('get', '/unregister?type=' + iotfData.deviceType + '&id=' + iotfData.deviceId);

  xhr.onreadystatechange = function() {
    if(xhr.readyState === 4)  {
      localStorage.removeItem("iotf");
      localStorage.removeItem("clientId");
      localStorage.removeItem("org");
      localStorage.removeItem("deviceType");
      localStorage.removeItem("deviceId");
      localStorage.removeItem("password");

      location.reload();
    }
  }
  xhr.send(null);
}

function init() {
  var name = "kivoon";
  initMap();
  if (localStorage && ('iotf' in localStorage)) {
    iotfData.clientId = localStorage.getItem("clientId");
    iotfData.org = localStorage.getItem("org");
    iotfData.deviceType = localStorage.getItem("deviceType");
    iotfData.deviceId = localStorage.getItem("deviceId");
    iotfData.password = localStorage.getItem("password");
    phoneData.d.deviceId = iotfData.deviceId
    qsMode = false;
    document.getElementById("register").style.display="none";
    document.getElementById("cleardata").style.display="block";
  } else {
    iotfData.deviceId = new Date().getTime().toString().substring(1, 13);
    iotfData.deviceType = name;
    iotfData.clientId = "d:quickstart:" + name + ":" + iotfData.deviceId;
    if (localStorage) {
      document.getElementById("register").style.display="block";
      document.getElementById("cleardata").style.display="none";
    }
  }

  // if (navigator.geolocation) {
  //     // navigator.geolocation.watchPosition(showPosition);
  //     navigator.geolocation.getCurrentPosition(function(position){
  //       loc.innerHTML="Latitude: " + position.coords.latitude +
  //                     "<br>Longitude: " + position.coords.longitude;
  //       console.log("Latitude: " + position.coords.latitude +
  //                                   "<br>Longitude: " + position.coords.longitude)
  //       //initialize the drawer
  //       var drawer=new Drawer(position.coords.latitude, position.coords.longitude);
  //       //adjust map position,marker,polyline by coordinates
  //       drawer.adjust(position.coords.latitude+.0001, position.coords.longitude+.0001);
  //     });
  // } else {
  //     loc.innerHTML = "Geolocation is not supported by this browser.";
  // }

  if (window.DeviceOrientationEvent) {
    // Listen for the deviceorientation event and handle the raw data
    window.addEventListener('deviceorientation', function(eventData) {
      // gamma is the left-to-right tilt in degrees, where right is positive
      var tiltLR = eventData.gamma;

      // beta is the front-to-back tilt in degrees, where front is positive
      var tiltFB = eventData.beta;

      // alpha is the compass direction the device is facing in degrees
      var dir = eventData.alpha

      // call our orientation event handler
      deviceOrientationHandler(tiltLR, tiltFB, dir);
      }, false);
  } else {
    document.getElementById("doEvent").innerHTML = "Not supported."
  };
  // if(window.onload) {
  //   window.addEventListener('load', deviceMapHandler, false)
  // }

  if (window.DeviceMotionEvent) {
    window.addEventListener('devicemotion', deviceMotionHandler, false);
  } else {
    document.getElementById("acEvent").innerHTML = "Not supported."
  };

  if (qsMode) {
    client = new Paho.MQTT.Client("ws://quickstart.messaging.internetofthings.ibmcloud.com:1883/", iotfData.clientId);
    client.onConnectionLost = onConnectionLost;
    client.connect({onSuccess: onConnect,
                    onFailure: onConnectFailure});
  }
}

/** map starts **/
var loc = document.getElementById("location");

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(showPosition);
    } else {
        loc.innerHTML = "Geolocation is not supported by this browser.";
    }
}

function showPosition(position) {
    loc.innerHTML="Latitude: " + position.coords.latitude +
                  "<br>Longitude: " + position.coords.longitude;
    locationData.push(position.coords.latitude);
    locationData.push(position.coords.longitude);
    var drawer=new Drawer(position.coords.latitude,position.coords.longitude);
    drawer.adjust(position.coords.latitude+.0001,position.coords.longitude+.0001)
}

var Drawer=function(lat,long){
  var parent=this;//drawer root to make it accessible for functions

  this.createLatLng=function(lat,long){
		return new google.maps.LatLng(lat,long);
	};

  var latLng = this.createLatLng(lat,long);

  /**initialize the map**/
  this.map = new google.maps.Map(document.getElementById("map"), {
      center: latLng,
      zoom: 18,
      mapTypeId: google.maps.MapTypeId.ROADMAP
  });

      /**initialize marker**/
  this.marker = new google.maps.Marker({
      map: parent.map,
      animation: google.maps.Animation.DROP,
      position: latLng

  });

  /**initialize polyline**/
  this.polyline = new google.maps.Polyline({
      path:[latLng],
          icons: [
      {
        icon: { path: 'M -2,-2 2,2 M 2,-2 -2,2', strokeColor: '#292',strokeWeight: 4},
        offset: '0%'
      }],
      strokeColor: '#FF0000',
      strokeOpacity: 1.0,
      strokeWeight: 2,
      editable: false

  });
    //Set the map for the polyline
  this.polyline.setMap(parent.map);

  /**Adjust position,marker,polyline for new incomming positions**/
  this.adjust=function(lat,long){
    //Set the polyline
  	 parent.polyline.getPath().push(parent.createLatLng(lat,long));
     //Set the map camera position
     parent.map.panTo(parent.createLatLng(lat,long));
     //Set the marker position
   	 parent.marker.setPosition(parent.createLatLng(lat,long));
  }
}
 //end of Drawer class

//usage
// function deviceMapHandler() {
// window.addEventListener("load",function(){
//   var mapit = document.getElementById("mapit");
//   mapit.innerHTML = "<div id='map' style='width:500px;height:500px;'></div>";
//   // document.write("<div id='map' style='width:500px;height:500px;'></div>");
//
//
// });
// }

var map, infoWindow;
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 30.397, lng: -97.644},
    zoom: 6
  });
  infoWindow = new google.maps.InfoWindow;

  // Try HTML5 geolocation.
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      var pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      var mapit = document.getElementById("mapit");
      mapit.innerHTML = "<div id='map' style='width:500px;height:500px;'></div>";
      loc.innerHTML="Latitude: " + position.coords.latitude +
                         "<br>Longitude: " + position.coords.longitude;

       //initialize the drawer
       var drawer=new Drawer(position.coords.latitude, position.coords.longitude);
       //adjust map position,marker,polyline by coordinates
       drawer.adjust(position.coords.latitude+.0001, position.coords.longitude+.0001);

      infoWindow.setPosition(pos);
      infoWindow.setContent('Location found.');
      infoWindow.open(map);
      map.setCenter(pos);
    }, function() {
      handleLocationError(true, infoWindow, map.getCenter());
    });
  } else {
    // When browser doesn't support Geolocation
    handleLocationError(false, infoWindow, map.getCenter());
  }
}

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
  infoWindow.setPosition(pos);
  infoWindow.setContent(browserHasGeolocation ?
                        'Error: The Geolocation service failed.' :
                        'Error: Your browser doesn\'t support geolocation.');
  infoWindow.open(map);
}
/** map ends **/

function onMessageArrived(message) {
  console.log(message.payloadString);
  if ("vibrate" in navigator) {
    payload = JSON.parse(message.payloadString);
    if (!isNaN(payload.buzz)) {
      navigator.vibrate(payload.buzz);
    }
  }
}

function onConnect() {
  var connStatus = document.getElementById("connStatus");
  var devId = document.getElementById("devId");
  connStatus.innerHTML = "Status: <span style=\"color:green\"><b>Connected</b></span>";
  devId.innerHTML = "DeviceID: "+iotfData.deviceId;
  console.log("Connected");
  msgInterval = window.setInterval(phoneData.publish, 250);
  if (!qsMode) {
    client.subscribe(subTopic);
  }
}

function onConnectFailure(error) {
  connStatus.innerHTML = 'Connect Failed';
  console.log("Connect Failed");
  console.log(error.errorCode);
  console.log(error.errorMessage);
}

function onConnectionLost(response) {
  connStatus.innerHTML = "Status: <span style=\"color:red\"><b>Disconnected</b></span>";
  console.log("onConnectionLost")
  if (response.errorCode !== 0) {
      console.log("onConnectionLost:"+response.errorMessage);
  }
  clearInterval(msgInterval);
  if (qsMode) {
    client.connect({onSuccess: onConnect,
            onFailure: onConnectFailure});
  }
}

function deviceOrientationHandler(tiltLR, tiltFB, dir) {
  phoneData.d.tiltLR = Math.round(tiltLR);
  phoneData.d.tiltFB = Math.round(tiltFB);
  phoneData.d.direction = Math.round(dir);

  document.getElementById("motion").innerHTML = "Tilt Left/Right: " + Math.round(tiltLR) + "<br>Tilt Front/Back: "
        + Math.round(tiltFB) + "<br>Direction: " + Math.round(dir);

  // Apply the transform to the image
  var logo = document.getElementById("imgLogo");
  logo.style.webkitTransform = "rotate("+ tiltLR +"deg) rotate3d(1,0,0, "+ (tiltFB*-1)+"deg)";
  logo.style.MozTransform = "rotate("+ tiltLR +"deg)";
  logo.style.transform = "rotate("+ tiltLR +"deg) rotate3d(1,0,0, "+ (tiltFB*-1)+"deg)";
}

function deviceMotionHandler(eventData) {
  var acceleration = eventData.acceleration;
  var accelX = Math.round(acceleration.x);
  var accelY = Math.round(acceleration.y);
  var accelZ = Math.round(acceleration.z);

  // Grab the acceleration from the results
  phoneData.d.accelX = accelX;
  phoneData.d.accelY = accelY;
  phoneData.d.accelZ = accelZ;
  var speed = Math.sqrt(parseInt(accelX)^2 + parseInt(accelY)^2 + parseInt(accelZ)^2);
  phoneData.d.speed = speed;
  document.getElementById("speed").innerHTML = "Speed: "+speed;
}
