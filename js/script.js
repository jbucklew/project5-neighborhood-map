// Place class to hold info related to a specific place
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
        new Place( 'Mount Desert Oceanarium', '1351 State Rt 3', 'Bar Harbor, ME', 'activity' ),
        new Place( 'Bar Harbor Grand Hotel', '269 Main Street', 'Bar Harbor, ME' ),
        new Place( 'Coastal Kayaking Tours', '48 Cottage Street', 'Bar Harbor, ME' ),
        new Place( 'Atlantic Climbing School', '67 Main Street', 'Bar Harbor, ME' ),
        new Place( 'Bar Harbor Whale Watch Co', '1 West Street', 'Bar Harbor, ME' ),
        new Place( 'Hearthside Inn', '7 High Street', 'Bar Harbor, ME' ),
        new Place( 'Looking Glass Restaurant', '50 Eden Street', 'Bar Harbor, ME' ),
        new Place( 'The Thirsty Whale', '40 Cottage Street', 'Bar Harbor, ME' ),
        new Place( 'Side Street Cafe', '49 Rodick St', 'Bar Harbor, ME' )
];

// Google Maps
// The code below is from the google maps tutorial on google
// and from the Resume project mapping feature
var map;
var Map = function(){
    var self = this;

    // using global infoWindow so only 1 open at a time
    self.infoWindow;
    // using global marker so only 1 selected at a time
    self.selectedMarker;

    // used to track the number of markers added to map since they
    // are added one at a time
    self.current_place_idx = 0;
    self.markers = [];

    // bar harbor maine lat 44.3858, long -68.2094
    self.mapDiv = document.getElementById('map');
    self.mapOptions = {
        center: new google.maps.LatLng(44.3858,-68.2094),
        // for browser:
        zoom: 15,
        // for mobile
        //zoom: 14,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    }

    self.initializeMap = function(){
        map = new google.maps.Map(self.mapDiv, self.mapOptions);
        window.mapBounds = new google.maps.LatLngBounds();
        self.addMarkers();
    }

    self.createMapMarker = function( place_data, place_idx ) {
//console.log( place_data );
//console.log( place_idx );
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
            self.clickMarker( marker );
        }); 

        // infoWindows are the little helper windows that open when you click
        // or hover over a pin on a map. They usually contain more information
        // about a location.
        self.infoWindow = new google.maps.InfoWindow({
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
    self.getCallback = function( results, place_idx ){
        return function(){
            self.createMapMarker( results, place_idx );
        };
    }

    self.callback = function( idx ){
        return function( results, status ){
            if( status == google.maps.places.PlacesServiceStatus.OK ){
                window.setTimeout( self.getCallback( results[0], idx ), idx * 100 );
            }
        };
    }

    self.addMarkers = function(){
        var service = new google.maps.places.PlacesService( map );
        var number_locations = places.length;
        for( var i=0; i < number_locations; i++ ){
            var request = {
                query: places[i].address + ' ' + places[i].city_state
            }
            service.textSearch( request, self.callback(i) );
        }
    }

    self.openInfoWindow = function( html ){
        self.infoWindow = new google.maps.InfoWindow({ content: html });
        self.infoWindow.open( map, self.selectedMarker );
        google.maps.event.addListener( self.infoWindow, 'closeclick', function(){
            self.selectedMarker.setIcon();
            vm.locationSelected("");
        });
    }
    // callback to show infowindow after marker animation has completed
    // show default data if yelp call fails
//    function showInfoWindow( marker, place_idx ){
    self.showDefaultInfoWindow = function(){
        var html = '<p>' + places[ self.current_place_idx].name + '</p>' +
                   '<p>' + places[ self.current_place_idx ].address + '</p>';
        self.openInfoWindow( html );
    }

    // used to show yelp data
    self.showInfoWindow = function( data ){
        var info = data.businesses[0];
console.log( data );
        var html = '<img src="' + info.image_url + '">"' +
                   '<p>' + info.name + '</p>' + '<p>' + info.location.display_address + '</p>' +
                   '<p>' + info.display_phone + '</p>' + '<img src="' + info.rating_img_url_small + '">';
        self.openInfoWindow( html );
    }

    self.clickMarker = function( marker ){
console.log(marker);
        if( self.infoWindow ){
            self.infoWindow.close();
        }
        if( self.selectedMarker ){
            // change previous selected marker back to default icon
            self.selectedMarker.setIcon();
        }

        // need to sync with ViewModel in case marker clicked and not name
        var number_places = places.length;
        var place_idx;
        for( var place_idx = 0; place_idx < number_places; place_idx++ ){
            if( places[place_idx].map_marker === marker ){
                break;
            }
        }
        // set current_place_idx to be used with Yelp lookup
        self.current_place_idx = place_idx;
console.log( place_idx + ' ' + self.current_place_idx );
        if( vm.locationSelected() !== places[place_idx].name ){
            vm.locationSelected( places[place_idx].name );
        }

        self.selectedMarker = marker;
        self.selectedMarker.setIcon( 'images/blue_marker.png' );
        if( self.selectedMarker.getAnimation() != null ){
            self.selectedMarker.setAnimation(null);
        }else{
            self.selectedMarker.setAnimation(google.maps.Animation.BOUNCE);
            window.setTimeout(function(){
                self.selectedMarker.setAnimation( null );
                yelp = new Yelp();
                yelp.lookup( places[place_idx].name, places[place_idx].city_state );
                //self.showInfoWindow( self.selectedMarker, place_idx );
            }, 750 );
        }
    }
}

var gm = new Map();
window.addEventListener( 'load', gm.initializeMap() );
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


// http://forum.jquery.com/topic/hiding-oauth-secrets-in-jquery
var Yelp = function(){
    var self = this;
    self.auth = {
        consumerKey: '12kSLeRwpslAKP3hw7IlUA',
        consumerSecret: 'IjtI9i_UfmgXGS0Su2uw5Pupu10',
        accessToken: 'kQOZ3xBNo7pZxYK9JP4GqJXJfNlyzWdH',
        accessTokenSecret: 'KRrr5vdTiXXPLdlJqtNVv-5aZ9A',
        serviceProvider: {
            signatureMethod: 'HMAC-SHA1'
        }
    };
   self.accessor = {
        consumerSecret: self.auth.consumerSecret,
        tokenSecret: self.auth.accessTokenSecret
    };
    self.parameters = [];
    self.message = {
        action: 'http://api.yelp.com/v2/search',
        method: 'GET',
        parameters: self.parameters
    };

    self.lookup = function( term, location ){
        self.parameters = [];
        self.parameters.push(['term', term]);
        self.parameters.push(['location', location ]);
        self.parameters.push(['limit', '1']);
        // defaulting cll to lat long of Bar Harbor to ensure more accurate search
        self.parameters.push(['cll', '44.3858,-68.2094']);
        self.parameters.push(['callback', 'cb']);
        self.parameters.push(['oauth_consumer_key', self.auth.consumerKey]);
        self.parameters.push(['oauth_consumer_secret', self.auth.consumerSecret]);
        self.parameters.push(['oauth_token', self.auth.accessToken]);
        self.parameters.push(['oauth_signature_method', 'HMAC-SHA1']);
        self.message.parameters = self.parameters;

        OAuth.setTimestampAndNonce(self.message);
        OAuth.SignatureMethod.sign(self.message, self.accessor);

        var parameterMap = OAuth.getParameterMap(self.message.parameters);
        parameterMap.oauth_signature = OAuth.percentEncode(parameterMap.oauth_signature);

        $.ajax({
            url: self.message.action,
            data: parameterMap,
            cache: true,
            dataType: 'jsonp',
            jsonpCallback: 'cb',
        }).done( function( data, textStats, XMLHttpRequest ){
            gm.showInfoWindow( data );
        }).fail( function(){
            gm.showDefaultInfoWindow();
        });
    }
};
