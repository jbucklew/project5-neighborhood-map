// Place class
function Place(name, address, city_state){
    var self = this;
    self.name = name;
    self.address = address;
    self.city_state = city_state;
    self.map_marker;
    self.is_visible = ko.observable(true);
}

var places = [
        new Place( 'Abbe Museum', '26 Mount Desert Street', 'Bar Harbor, ME' ),
        new Place( 'Artwaves', '329 Main Street', 'Bar Harbor, ME', 'activity' ),
        new Place( 'Bar Harbor Grand Hotel', '269 Main Street', 'Bar Harbor, ME' ),
        new Place( 'Coastal Kayaking Tours', '48 Cottage Street', 'Bar Harbor, ME' ),
        new Place( 'Atlantic Climbing School', '67 Main Street', 'Bar Harbor, ME' ),
        new Place( 'Bar Harbor Whale Watch Co', '1 West Street', 'Bar Harbor, ME' ),
        new Place( 'Eden Therapeutic Massage', '61B Cottage Street', 'Bar Harbor, ME' ),
        new Place( 'Looking Glass Restaurant', '50 Eden Street', 'Bar Harbor, ME' ),
        new Place( 'The Thirsty Whale', '40 Cottage Street', 'Bar Harbor, ME' ),
        new Place( 'Sea Dawg', '47 West Street', 'Bar Harbor, ME' )
];

// Google Maps
// The code below is from the google maps tutorial on google
// and from the Resume project mapping feature
var map;
// using global infoWindow so only 1 open at a time
var infoWindow;
// using global marker so only 1 selected at a time
var selectedMarker;
function initializeMap(){
    // used to track the number of markers added to map since they
    // are added one at a time
    var current_place_idx = 0;
    var markers = [];

    // bar harbor maine lat 44.3858, long -68.2094
    var mapDiv = document.getElementById('map');
    var mapOptions = {
        center: new google.maps.LatLng(44.3858,-68.2094),
        // for browser:
        zoom: 15,
        // for mobile
        //zoom: 14,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    }

    map = new google.maps.Map(mapDiv, mapOptions);
    window.mapBounds = new google.maps.LatLngBounds();
    addMarkers();

    function createMapMarker( place_data, place_idx ) {
        // The next lines save location data from the search result object to local variables
        var lat = place_data.geometry.location.lat();  // latitude from the place service
        var lon = place_data.geometry.location.lng();  // longitude from the place service
        var name = place_data.formatted_address;   // name of the place from the place service
        var bounds = window.mapBounds;            // current boundaries of the map window

        // marker is an object with additional data about the pin for a single location
        var marker = new google.maps.Marker({
            animation: google.maps.Animation.DROP,
            map: map,
            position: place_data.geometry.location,
            title: name
        }); 

        places[ place_idx ].map_marker = marker;

        // listen for when a marker is clicked
        google.maps.event.addListener(marker, 'click', function() {
            clickMarker( marker );
        }); 

        // infoWindows are the little helper windows that open when you click
        // or hover over a pin on a map. They usually contain more information
        // about a location.
        infoWindow = new google.maps.InfoWindow({
            content: name
        }); 

        // this is where the pin actually gets added to the map.
        // bounds.extend() takes in a map location object
    //    bounds.extend(new google.maps.LatLng(lat, lon));
        // fit the map to the new marker
    //    map.fitBounds(bounds);
        // center the map
    //    map.setCenter(bounds.getCenter());
    }

    // setTimeout issue with passing places index to createMapMarker
    // from stackoverflow
    function getCallback( results, place_idx ){
        return function(){
            createMapMarker( results, place_idx );
        };
    }

    function callback( results, status ){
        if( status == google.maps.places.PlacesServiceStatus.OK ){
            window.setTimeout( getCallback( results[0], current_place_idx ), current_place_idx * 100 );
            current_place_idx++;
        }
    }

    function addMarkers(){
        var service = new google.maps.places.PlacesService( map );
        var number_locations = places.length;
        for( var i=0; i < number_locations; i++ ){
            var request = {
                query: places[i].address + ' ' + places[i].city_state
            }
            service.textSearch( request, callback );
        }
    }

    // callback to show infowindow after marker animation has completed
    function showInfoWindow( marker ){
        infoWindow = new google.maps.InfoWindow({ content: marker.title });
        infoWindow.open( map, marker );
        google.maps.event.addListener( infoWindow, 'closeclick', function(){
            selectedMarker.setIcon();
            vm.locationSelected("");
        });
    }

    function clickMarker( marker ){
        if( infoWindow ){
            infoWindow.close();
        }
        if( selectedMarker ){
            // change previous selected marker back to default icon
            selectedMarker.setIcon();
        }

        // need to sync with ViewModel in case marker clicked and not name
        var number_places = places.length;
        var place_idx
        for( var place_idx = 0; place_idx < number_places; place_idx++ ){
            if( places[place_idx].map_marker === marker ){
                break;
            }
        }
        if( vm.locationSelected() !== places[place_idx].name ){
            vm.locationSelected( places[place_idx].name );
        }

        selectedMarker = marker;
        selectedMarker.setIcon( 'images/blue_marker.png' );
        if( selectedMarker.getAnimation() != null ){
            selectedMarker.setAnimation(null);
        }else{
            selectedMarker.setAnimation(google.maps.Animation.BOUNCE);
            window.setTimeout(function(){
                selectedMarker.setAnimation( null );
                showInfoWindow( selectedMarker );
            }, 750 );
        }
    }
}

//google.maps.event.addDomListener(window, 'load', google_map.initializeMap());
window.addEventListener( 'load', initializeMap );
window.addEventListener( 'resize', function(e){
    map.fitBounds(mapBounds);
});


// event listener for hamburger button to open locations
// code from Response Web Design Fundamentals course
var menu = document.querySelector('#menu');
var drawer = document.querySelector('#locations');

menu.addEventListener('click', function(e){
  drawer.classList.toggle('open');
  e.stopPropagation();
});


// knock out stuff
var ViewModel = function(){
    var self = this;
    self.locationSelected = ko.observable("");
    self.searchLocations = ko.observable("");
    self.places = ko.observableArray( places);


    self.getPlaces = function(){
        return this.places;
    };

    self.locationClicked = function(){
        self.locationSelected(this.name);
        google.maps.event.trigger( this.map_marker, 'click' );
    }

    // implemented this search with help from article found
    // http://opensoul.org/2011/06/23/live-search-with-knockoutjs/
    self.search = function( value ){
        for( var place in self.places() ){
            // use value to search string
            if( ( self.places()[ place ].name.toLowerCase().indexOf(value.toLowerCase() ) >= 0 ) ){
                self.places()[ place ].is_visible(true);
                self.places()[ place ].map_marker.setVisible(true);
            } else {
                self.places()[ place ].is_visible(false);
                self.places()[ place ].map_marker.setVisible(false);
            }
        }
    }
}
var vm = new ViewModel();
ko.applyBindings( vm );
vm.searchLocations.subscribe( vm.search );

// wikipedia - from Intro to Ajax class
var wiki = function(){
    var self = this;
    var wikiURL = 'http://en.wikipedia.org/w/api.php?action=opensearch&search='+city+
                  '&format=json&callback=wikiCallback';

    self.wikiRequestTimeout = setTimeout( function(){
        $wikiElem.text( "failed to get wikipedia resources" );
    }, 8000 );

    self.getWikiIno(
    $.ajax({
        url: wikiURL,
        dataType: "jsonp",
        success: function( data ){
            var articles = data[ 1 ];

            for( var i = 0; i < articles.length; ++i ){
                article = articles[ i ];
                var url = 'http://en.wikipedia.org/wiki/' + article;
                $wikiElem.append( '<li><a href="' + url + '">' + article + '</a></li>' );
            }
 
            clearTimeout( wikiRequestTimeout );
        }   
    });
}
