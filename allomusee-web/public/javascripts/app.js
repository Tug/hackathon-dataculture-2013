
$(document).ready(function(){
    var API_KEY = "AIzaSyC0jDFUe_b_QovWnuEgxsigfLauxcWJLCQ";
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
        mapTypeControlOptions: {
            mapTypeIds: [google.maps.MapTypeId.ROADMAP]
        },
        panControl : false,
        dragend: function(e) {
            updateMarkersInfo();
            if(currentMarker) {
                currentMarker.infoWindow.close();
            }
        },
        markerClusterer: function(map) {
            return new MarkerClusterer(map, undefined, {
                maxZoom: 10
            });
        },
        streetViewControl: true
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

    var maPosition;
    var currentMarker;

    if(navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            var pos = new google.maps.LatLng(position.coords.latitude,
                position.coords.longitude);
            maPosition = map.createMarker({
                lat: pos.lat(),
                lng: pos.lng(),
                title: "Ma position",
                icon: {
                    url: "/images/marker_user_70x70.png",
                    scaledSize: {
                        width: 35,
                        height: 35
                    }
                }
            });
            map.addMarker(maPosition);
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
            var infoWindow = new google.maps.InfoWindow({
                content: '<p>'+museeInfo.NOM_DU_MUSEE+'</p>'
            });
            google.maps.event.addListener(infoWindow, 'closeclick', function(){
                updateMarkersInfo();
            });
            return map.createMarker({
                lat: museeInfo.latitude,
                lng: museeInfo.longitude,
                title: museeInfo.NOM_DU_MUSEE,
                infoWindow: infoWindow,
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
        updatePanorama(marker);
        if(marker.data) {
            showMarkerInfo(marker);
            currentMarker = marker;
        } else {
            updateMarkersInfo();
        }
        map.panTo(marker.getPosition());
    }

    function updatePanorama(marker) {
        var panorama = map.getStreetView();
        panorama.setPosition(marker.getPosition());
    }

    function showMarkerInfo(marker) {
        var info = marker.data;
        $("#leftPanelBg").css("background-color", themeToColor[info.theme]);
        var html = '<div class="musee-info">';
        html += '<div class="musee-nom"></div>';
        html += '<div class="musee-addresse"></div>';
        html += '<div class="musee-ville"></div>';
        if(info.PERIODE_OUVERTURE) {
            html += '<div class="musee-horaires"><img class="img-horaire" src="/images/icon_horaire_62x62@2x.png"/><span class="horaire-text"></span></div>';
        }
        if(info.FERMETURE_ANNUELLE) {
            html += '<div class="musee-horaires-extra"></div>';
        }
        if(maPosition) {
            var distance = google.maps.geometry.spherical.computeDistanceBetween(marker.position, maPosition.getPosition());
            var distanceStr;
            if(distance > 1000) {
                distanceStr = Math.floor(distance / 1000) + "km";
            } else {
                distanceStr = Math.floor(distance) + "m";
            }
            html += '<div class="musee-distance"><img class="img-distance" src="/images/icon_distance_62x62@2x.png"/>'+distanceStr+'</div>';
        }
        html += '<div class="musee-news"></div>';
        if(info.SITWEB) {
            html += '<div class="musee-siteweb"><i class="glyphicon glyphicon-globe white"></i> &nbsp; <a target="_blank"></a></div>';
        }
        html += '<div class="musee-streetview"></div>';
        html += '</div>';
        var container = $(html);
        $("#markersInfo").fadeOut(200, function() {
            $("#markersInfo").empty();
            $("#markersInfo").append(container);
            $(".musee-nom", container).html(info.NOM_DU_MUSEE);
            $(".musee-addresse", container).html(info.ADRESSE);
            $(".musee-ville", container).html(info.VILLE);
            if(info.PERIODE_OUVERTURE) {
                $(".musee-horaires > .horaire-text", container).html(info.PERIODE_OUVERTURE);
            }
            if(info.FERMETURE_ANNUELLE) {
                $(".musee-horaires-extra", container).html("Fermeture annuelle : "+info.FERMETURE_ANNUELLE);
            }
            var streetViewImage = '<img src="//maps.googleapis.com/maps/api/streetview?size=240x120&amp;location='+info.latitude+','+info.longitude+'&amp;fov=90&amp;heading=235&amp;pitch=10&amp;sensor=false" width="240" height="120px">';
            $(".musee-streetview", container).html(streetViewImage);
            $(".musee-streetview > img", container).click(function() {
                var panorama = map.getStreetView();
                var toggle = panorama.getVisible();
                if (toggle == false) {
                    panorama.setVisible(true);
                } else {
                    panorama.setVisible(false);
                }
            });
            if(info.SITWEB) {
                var url = extractUrlFromString(info.SITWEB);
                $(".musee-siteweb > a", container).attr("href", url);
                $(".musee-siteweb > a", container).html(url);
            }
            $(".musee-news", container).html("");
        }).fadeIn(200);
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

        $("#leftPanelBg").css("background-color", "rgba(51, 51, 51, 0.88)");
        $("#markersInfo").fadeOut(200, function() {
            $("#markersInfo").empty();
            $("#markersInfo").append("<ul></ul>");
            markers10.forEach(function(m) {
                var html = '<li class="marker-info">';
                html += '<img src="'+m.data.url+'" class="marker-bullet"/>';
                html += '<span class="nomdumusee">'+m.data.NOM_DU_MUSEE+'</span>';
                html += '</li>';
                var el = $(html);
                $("#markersInfo > ul").append(el);
                el.click(function(e) {
                    return markerClicked(m);
                });
                el.hover(function(e) {
                    if(e.type === "mouseenter") {
                        $(this).css("background-color", "grey");
                    } else if(e.type === "mouseleave") {
                        $(this).css("background-color", "transparent");
                    }
                });
            })
        }).fadeIn(200);
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

    function extractUrlFromString(str) {
        var g = /(http|ftp|https):\/\/([\w\-_]+(?:(?:\.[\w\-_]+)+))([\w\-\.,@?^=%&amp;:/~\+#]*[\w\-\@?^=%&amp;/~\+#])?/.exec(str);
        if(g && g.length > 0) {
            return g[0];
        }
        g = /([\w\-_]+(?:(?:\.[\w\-_]+)+))([\w\-\.,@?^=%&amp;:/~\+#]*[\w\-\@?^=%&amp;/~\+#])?/.exec(str);
        if(g && g.length > 0) {
            return "http://"+g[0];
        }
        return str;
    }

});
