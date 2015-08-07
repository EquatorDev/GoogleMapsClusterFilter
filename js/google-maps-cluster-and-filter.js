(function filterClosure() {

    /**
     * Creates a filterable, clustered Google Map given a DOM element to hold the map and an object of latitude/longitude data.
     *
     * @param {HTMLElement} map_holder This is where the Google Map will go. Map fills up its container, so size this for map size
     * @param {Array} location_data Array of location objects. These have "Latitude" and "Longitude" values, as well as any required supporting data.
     * @param {HTMLElement} [filter_dropdown_holder] DOM element that will hold the filter dropdown UI
     * @param {Object} [filter_fields] Describes the data from the location_data array that you want to be able to filter upon. Also gives the label that should be attached to that field, eg. { "City": "loc_city" } would show a dropdown for "City" based on the values of "loc_city" given in the location_data array
     * @param {Object} [center_coords] Coordinates object, eg. { lat: 52, lng: 6 } , which will be the center focus of th emap by default.
     * @param {Number} [default_zoom] Zoom level to be initially applied to the map.
     * @param {Array} [cluster_styles] An array of style objects used to customise the cluster icons for the map.
     * @param {String} [maptype_id] What kind of map is displayed, ie. road, terrain etc.
     */
    function FilterMap(map_holder, location_data, filter_dropdown_holder, filter_fields, center_coords, default_zoom, cluster_styles, maptype_id) {
        //Set up vars
        var google_map = null,
            clusterer = null,
            markers = null,

            filter_options = [],

            infowindow = new google.maps.InfoWindow();

        function init() {
            //Check for errors
            if (map_holder === undefined || location_data === undefined) return false;

            //Set defaults
            if (filter_dropdown_holder === undefined) filter_dropdown_holder = false;
            if (filter_fields === undefined) filter_fields = false;

            if (default_zoom === undefined) default_zoom = 2
            if (maptype_id === undefined) maptype_id = google.maps.MapTypeId.ROADMAP
            if (center_coords === undefined) center_coords = {
                lat: 52,
                lng: 6
            };

            //Create map
            google_map = getMap();

            markers = getMarkers();

            clusterer = getClusterer();

            drawFilters();
        };

        init();

        function getMap() {
            if (google_map) return google_map;

            var map_options = {
                center: center_coords,
                zoom: default_zoom,
                mapTypeId: maptype_id
            };

            return new google.maps.Map(
                map_holder,
                map_options
            )
        }

        function getMarkers() {
            if (markers) return markers;

            //Set function vars
            var number_of_locations = location_data.length,
                filter_category = false,
                location = {},
                filter_data = {},
                i = 0,
                new_marker = {},
                markers = [];

            //var number_of_locations = 1000;

            for (i; i < number_of_locations; i++) {
                location = location_data[i];

                if (filter_fields) {
                    //Set the data on the marker.
                    filter_data = {};

                    for (category in filter_fields) {
                        filter_data[category] = location[filter_fields[category]];

                        //Add an option to the dropdowns if needed.
                        if (filter_options[category] === undefined) filter_options[category] = [];
                        //for shortness
                        filter_category = filter_options[category];

                        if (filter_category[filter_data[category]] === undefined) filter_category[filter_data[category]] = true;
                    }
                }

                new_marker = new google.maps.Marker({
                    position: {
                        lat: parseFloat(location.Latitude),
                        lng: parseFloat(location.Longitude)
                    },
                    //map: google_map,
                    filter_data: filter_data,
                    title: location.Name || ""
                });

                markers.push(new_marker);

                //Show infowindow on click.
                //This is too custom!???
                google.maps.event.addListener(new_marker, 'click', function(marker, location) {
                    return function() {
                        showMarkerInfowindow(marker, location);
                    }
                }(new_marker, location));
            }

            return markers;
        }

        // TODO: Genericisize this chap.
        function showMarkerInfowindow(marker, location) {
            infowindow.setContent(
                '<div class="transport_info_holder">' +
                '<div>Name: ' + location.Name + '</div>' +
                '<div>City: ' + location.City + '</div>' +
                '<div>Country: ' + location.Country + '</div>' +
                '<div>Time Zone: ' + location.Timezone + '</div>' +
                '</div>'
            );

            infowindow.open(google_map, marker);
        }

        function getClusterer() {
            if (clusterer) return clusterer;

            //Set default styles
            if (cluster_styles === undefined) cluster_styles = [{
                url: "http://google-maps-utility-library-v3.googlecode.com/svn/trunk/markerclusterer/images/m1.png",
                height: 53,
                width: 53
            }, {
                url: "http://google-maps-utility-library-v3.googlecode.com/svn/trunk/markerclusterer/images/m2.png",
                height: 56,
                width: 56
            }, {
                url: "http://google-maps-utility-library-v3.googlecode.com/svn/trunk/markerclusterer/images/m3.png",
                height: 66,
                width: 66
            }, {
                url: "http://google-maps-utility-library-v3.googlecode.com/svn/trunk/markerclusterer/images/m4.png",
                height: 78,
                width: 78
            }, {
                url: "http://google-maps-utility-library-v3.googlecode.com/svn/trunk/markerclusterer/images/m5.png",
                height: 90,
                width: 90
            }];

            //Add "0" results "image"
            cluster_styles.unshift({
                height: 0,
                //1px trans gif
                url: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
                width: 0
            });

            var clusterer = new MarkerClusterer(google_map, markers, {
                gridSize: 50,
                maxZoom: 10,
                clusterClass: "filter_cluster",
                styles: cluster_styles,
                calculator: function(markers, numStyles) {
                    var index = 0,
                        count = markers.length,
                        shown_count = 0,
                        dv = 0;

                    for (var i = 0; i < count; i++) {
                        if (markers[i].visible) {
                            shown_count++;
                        }
                    }

                    if (shown_count > 0) {
                        dv = shown_count;

                        while (dv !== 0) {
                            dv = parseInt(dv / 10, 10);
                            index++;
                        }

                        index = Math.min(index, numStyles) + 1;
                    } else {
                        shown_count = "";
                        index = 0;
                    };

                    return {
                        text: shown_count,
                        index: index
                    };
                }
            });

            return clusterer;
        }

        function drawFilters() {
            if (!filter_dropdown_holder) return false;

            var option_title = '',
                option_vals = '',
                filter_div = $(filter_dropdown_holder),
                dropdown_hold = false,
                dropdown = {},
                dd_opt = {},
                i = 0;

            for (category in filter_options) {
                dropdown_hold = $("<div class='filter_dropdown_holder'>")
                dropdown_hold.append("<label>" + category + "</label>");

                option_title = category;
                option_vals = Object.keys(filter_options[category]).sort();
                dropdown = $("<select>");

                dd_opt = $("<option value='show_all'>Show All</option>");
                dropdown.append(dd_opt);

                for (i = 0; i < option_vals.length; i++) {
                    dd_opt = $("<option value='" + option_vals[i] + "'>" + option_vals[i] + "</option>");
                    dropdown.append(dd_opt)
                }

                dropdown_hold.append(dropdown);

                dropdown.change(function(category) {
                    return function() {
                        filterDropdown(category, $(this).val());
                    }
                }(category))

                filter_div.append(dropdown_hold);
            }
        }

        function filterDropdown(category, value) {
            var this_marker = false,
                i = 0,
                marker_length = markers.length;

            for (i; i < marker_length; i++) {
                this_marker = markers[i];
                if (value === "show_all" || this_marker.filter_data[category] === value) {
                    this_marker.setVisible(true)
                } else {
                    this_marker.setVisible(false)
                }
            }

            clusterer.repaint();
        }
    }

    window.FilterMap = FilterMap;

}());



$(document).ready(function startFilterClass() {

    var map_holder = $('.map-filter-test-canvas')[0],

        //Get location data from somehwere. This can also hold extra data to filter on, eg. city name.
        location_data = getDemoLocationDataTransport(),

        //Where the filter UI will be created
        filter_dropdown_holder = $('.demo_test_filters')[0],

        //What data in the objects in location_data will be used for a filter.
        //This example creates filteres titled "Country" and "City" with the data coming from the "country_name"
        //and "city_name" fields in the location objects
        filter_fields = {
            "Country": "Country",
            "Timezone": "Timezone"
        };

    var new_map = new FilterMap(map_holder, location_data, filter_dropdown_holder, filter_fields);

    /*
    Location data passed should be of format:
    var location_obj =  [
        {
            "Latitude": "-6.081689",
            "Longitude": "145.391881",
            //Any extra info you want, eg. Country
            "Country": "Papua New Guinea"
        },
        {
            "Latitude": "39.701668",
            "Longitude": "-104.75166",
            //Any extra info you want, eg. Country
            "Country": "United States"
        }
    ];
    */
});