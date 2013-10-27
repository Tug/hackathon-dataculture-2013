
$(document).ready(function(){
    var map = new GMaps({
        el: '#map',
        lat: 48.833,
        lng: 2.333,
        zoom: 12,
        zoomControl : true,
        zoomControlOpt: {
            style : 'SMALL',
            position: 'TOP_RIGHT'
        },
        panControl : false,
        dragend: function(e) {
            var bounds =  map.getBounds();
            updateMarkersInfo(map.markers, bounds);
        },
        markerClusterer: function(map) {
            return new MarkerClusterer(map, undefined, {
                maxZoom: 10
            });
        }
    });

    var themes = [
        "architecture",
        "art_metiers",
        "art_moderne",
        "beau_arts",
        "histoire",
        "science"
    ];

    var themeToColor = {
        "architecture": "rgba(98, 61, 128, 0.88)",
        "art_metiers": "rgba(0, 153, 204, 0.88)",
        "art_moderne": "rgba(102, 154, 47, 0.88)",
        "beau_arts": "rgba(84, 100, 135, 0.88)",
        "histoire": "rgba(154, 77, 152, 0.88)",
        "science": "rgba(6, 176, 160, 0.88)"
    };

    if(navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            var pos = new google.maps.LatLng(position.coords.latitude,
                position.coords.longitude);
            map.addMarker({
                lat: pos.lat(),
                lng: pos.lng(),
                title: "Ma position",
                icon: {
                    url: "/images/user_marker_100x100.png",
                    scaledSize: {
                        width: 35,
                        height: 35
                    }
                }
            });
            map.panTo(pos);
            isCentered();
        }, function() {
            handleNoGeolocation(new Error('Error: The Geolocation service failed.'));
        });
    } else {
        handleNoGeolocation(new Error('Error: Your browser doesn\'t support geolocation.'));
    }

    function handleNoGeolocation(errorFlag) {
        // afficher la recherche
    }

    function isCentered() {
        $('#map').css({
            'filter': 'blur(0)',
            '-webkit-filter': 'blur(0)',
            '-moz-filter': 'blur(0)',
            '-o-filter': 'blur(0)',
            '-ms-filter': 'blur(0)'
        });
        $("#centerBox").fadeOut();
        $("#leftPanelBg").animate({
            left: "0px",
            opacity: 1
        }, 1000, function() {
            $("#leftPanel").show();
        });
        showMarkers();
    }

    var markers;
    $.get("/musees", function(res) {
        markers = res.map(function(museeInfo) {
            museeInfo.theme = stringToColor(museeInfo.NOM_DU_MUSEE, themes);
            museeInfo.url = "/images/DECOUPE_PIN_"+museeInfo.theme+"@2x.png";
            return map.createMarker({
                lat: museeInfo.latitude,
                lng: museeInfo.longitude,
                title: museeInfo.NOM_DU_MUSEE,
                infoWindow: {
                    content: '<p>'+museeInfo.NOM_DU_MUSEE+'</p>'
                },
                data: museeInfo,
                icon: {
                    url: museeInfo.url,
                    scaledSize: {
                        width: 28,
                        height: 33
                    }
                },
                click: function() {
                    markerClicked(this);
                }
            });
        });
    });

    function markerClicked(marker) {
        map.panTo(marker.getPosition());
        updateMarkersInfo();
    }

    function showMarkers() {
        markers.forEach(function(marker) {
            map.addMarker(marker);
        });
        updateMarkersInfo();
    }

    function updateMarkersInfo() {
        var bounds = map.getBounds();
        updateMarkersDistance();

        markers.sort(function(a, b) {
            if(a.distance < b.distance) return -1;
            else if(a.distance > b.distance) return 1;
            return 0;
        });

        var markers10 = markers.slice(0, 8);

        $("#markersInfo > ul").empty();
        markers10.forEach(function(m) {
            var html = '<li class="marker-info">';
            html += '<img src="'+m.data.url+'" class="marker-bullet"/>';
            html += m.data.NOM_DU_MUSEE
            html += '</li>';
            var el = $(html);
            $("#markersInfo > ul").append(el);
            el.click(function(e) {
                $("#leftPanelBg").css("background-color", themeToColor[m.data.theme]);
                return markerClicked(m);
            });
            el.hover(function(e) {
                console.log(e);
                if(e.type === "mouseenter") {
                    $(this).css("background-color", "rgba(98, 61, 128, 0.88)");
                } else if(e.type === "mouseleave") {
                    $(this).css("background-color", "transparent");
                }
            });

        });
/*
        $(".marker-info").hover(function(e) {
            console.log(e);
            if(e.type === "mouseenter") {
                $(this).css("background-color", "rgba(98, 61, 128, 0.88)");
            } else if(e.type === "mouseleave") {
                $(this).css("background-color", "transparent");
            }
        });*/
    }




    function updateMarkersDistance() {
        var markers = map.markers;
        var center = map.getCenter();
        markers.forEach(function(marker) {
            marker.distance = google.maps.geometry.spherical.computeDistanceBetween(marker.position, center);
        });
    }

    String.prototype.hashCode = function() {
        var hash = 0, i, char;
        if(this.length == 0) return hash;
        for(i = 0, l = this.length; i < l; i++) {
            char  = this.charCodeAt(i);
            hash  = ((hash<<5)-hash)+char;
            hash |= 0; // Convert to 32bit integer
        }
        return hash;
    };

    function stringToColor(str, colors) {
        var len = colors.length;
        return colors[((str.hashCode() % len) + len) % len];
    }

});
