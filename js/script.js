// Place class to hold info related to a specific place
function Place( name, address, city_state ){
    var self = this;
    self.name = name;
    self.address = address;
    self.city_state = city_state;
    self.map_marker;
    self.is_visible = ko.observable(true);
}

// Array of Place objects
var places = [
    new Place( 'Abbe Museum', '26 Mount Desert Street', 'Bar Harbor, ME' ),
    new Place( 'Atlantic Climbing School', '67 Main Street', 'Bar Harbor, ME' ),
    new Place( 'Bar Harbor Grand Hotel', '269 Main Street', 'Bar Harbor, ME' ),
    new Place( 'Bar Harbor Whale Watch Co', '1 West Street', 'Bar Harbor, ME' ),
    new Place( 'Coastal Kayaking Tours', '48 Cottage Street', 'Bar Harbor, ME' ),
    new Place( 'Hearthside Inn', '7 High Street', 'Bar Harbor, ME' ),
    new Place( 'Looking Glass Restaurant', '50 Eden Street', 'Bar Harbor, ME' ),
    new Place( 'Lulu Lobster Boat Rides', '56 West Street', 'Bar Harbor, ME' ),
    new Place( 'Side Street Cafe', '49 Rodick St', 'Bar Harbor, ME' ),
    new Place( 'The Thirsty Whale', '40 Cottage Street', 'Bar Harbor, ME' )
];

// Google Maps
// The code below is from the google maps tutorial on google
// and from the Resume project mapping feature rewritten for this project
var Map = function(){
    var self = this;

    // google map
    self.map;
    // only 1 infoWindow shown at a time. holds currently selected
    self.infoWindow;
    // will hold the current selected marker - used to coordinate
    // with selected menu item
    self.selectedMarker;

    // used to track the number of markers added to map since they
    // are added one at a time for animation purposes
    self.current_place_idx = 0;

    // bar harbor maine lat 44.388781, lng -68.210048 used to center map
    self.mapCenterLat = 44.388781;
    self.mapCenterLng = -68.210048;

    // set zoom level to 14 for smaller windows and 15 for larger ones
    var zoom_level = 15;
    if( $('.map_container').width() <= 450 ){
        zoom_level = 14;
    }
    self.mapOptions = {
        center: new google.maps.LatLng(self.mapCenterLat, self.mapCenterLng),
        zoom: zoom_level,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    }

    // initialize and load map.  Add markers from our places array
    self.mapBounds;
    self.mapDiv = document.getElementById( 'map' );
    self.initializeMap = function(){
        self.map = new google.maps.Map( self.mapDiv, self.mapOptions );
        self.mapBounds = new google.maps.LatLngBounds();
        self.addMarkers();
    }

    // create the map marker and add to map
    self.createMapMarker = function( place_data, place_idx ){
        // The next lines save location data from the search result object to local variables
        var lat = place_data.geometry.location.lat();  // latitude from the place service
        var lng = place_data.geometry.location.lng();  // longitude from the place service
        var name = place_data.formatted_address;   // name of the place from the place service

        // marker is an object with additional data about the pin for a single location
        // marker will drop on map with animation. will show address on cursor hover
        var marker = new google.maps.Marker({
            animation: google.maps.Animation.DROP,
            map: self.map,
            position: place_data.geometry.location,
            title: name
        });

        // add marker to its Place object in the places array for use within knockoutjs
        places[ place_idx ].map_marker = marker;

        // listen for when a marker is clicked
        // to show our own infoWindow and to keep sync'd with menu
        google.maps.event.addListener( marker, 'click', function() {
            self.clickMarker( marker );
        });

        // keep all markers viewable on map
        self.mapBounds.extend( new google.maps.LatLng( lat, lng ) );
    }

    // when adding markers to map need to keep markers sync'd with Places
    // object - callback function provides a way to pass index of Place object
    // in places array when using setTimeout.
    self.getCallback = function( results, place_idx ){
        return function(){
            self.createMapMarker( results, place_idx );
        };
    }

    // callback function for google maps PlacesService lookup
    // staggering the timeout value to setTimeout so markers drop on map
    // one at a time on load
    self.callback = function( idx ){
        return function( results, status ){
            if( status == google.maps.places.PlacesServiceStatus.OK ){
                window.setTimeout( self.getCallback( results[0], idx ), idx * 100 );
            }
        };
    }

    // lookup all markers in google's PlacesServices for map location using Places
    // from our places array
    self.addMarkers = function(){
        var service = new google.maps.places.PlacesService( self.map );
        var number_locations = places.length;
        for( var i=0; i < number_locations; i++ ){
            var request = {
                query: places[i].address + ' ' + places[i].city_state
            }
            service.textSearch( request, self.callback( i ) );
        }
    }

    // create infoWindow for selected marker using the html being passed in
    self.openInfoWindow = function( html ){
        self.infoWindow = new google.maps.InfoWindow({ content: html });
        self.infoWindow.open( self.map, self.selectedMarker );
        // add an event listener for when the infoWindow is closed so we can
        // de-select matching menu item and change marker icon back to default
        google.maps.event.addListener( self.infoWindow, 'closeclick', function(){
            self.selectedMarker.setIcon();
            vm.placeSelected( "" );
            // recenter map in case opening info window moved it
            gm.map.setCenter( new google.maps.LatLng( gm.mapCenterLat, gm.mapCenterLng ) );
        });
    }

    // default callback if Yelp lookup fails, to show infoWindow after marker animation
    // has completed
    self.showDefaultInfoWindow = function(){
        var html = '<p>' + places[ self.current_place_idx].name + '</p>' +
                   '<p>' + places[ self.current_place_idx ].address + '</p>';
        self.openInfoWindow( html );
    }

    // create html for infoWindow from yelp data then open window
    self.showInfoWindow = function( data ){
        var info = data.businesses[0];
        // default infoWindow image to no image available public domain image from
        // http://commons.wikimedia.org/wiki/File:No_image_available.svg
        var image_url = 'images/no_image.png';

        // if yelp provided an image use that one
        if(info.hasOwnProperty('image_url')){
           image_url = info.image_url;
        }

        // build html for infoWindow
        var html = '<div class="yelp_infowindow">' +
                   '<div class="img_container">' +
                   '<img alt="Yelp Image" class="yelp_img" src="' + image_url + '"></div>' +
                   '<span class="yelp_data"><p>' + info.name + '</p>' +
                   '<p>' + info.location.display_address + '</p>' +
                   '<p>' + info.display_phone + '</p>' +
                   '</span>' +
                   '<div class="rating_container"><img class="yelp_rating" src="' + info.rating_img_url +
                   '"></div>' +
                   '<div class="link_container"><a target="_blank" href="' + info.url + '">View on Yelp</a></div>' +
                   '</div>';
        self.openInfoWindow( html );
    }

    // when a marker is clicked update marker icon and show infoWindow after animation completes
    self.clickMarker = function( marker ){
        // if viewing in small window and the menu hamburger icon is visible
        // close Places menu to see infoWindow on map
        if( $('#menu').is( ':visible' ) && $('#places').hasClass( 'open' ) ){
            // hide menu so user can see map marker infoWindow
            $('#menu').trigger('click');
        }

        // if an infoWindow is currently open, close it.  Only one open at a time
        if( self.infoWindow ){
            self.infoWindow.close();
        }

        // change previous selected marker back to default icon
        if( self.selectedMarker ){
            self.selectedMarker.setIcon();
        }

        // need to sync with ViewModel in case marker clicked and not menu item
        // find index in our places array of selected marker
        var number_places = places.length;
        var place_idx;
        for( var place_idx = 0; place_idx < number_places; place_idx++ ){
            if( places[ place_idx ].map_marker === marker ){
                break;
            }
        }

        // set current_place_idx to be used with Yelp lookup
        self.current_place_idx = place_idx;
        // sync viewmodel (vm) with clicked marker
        if( vm.placeSelected() !== places[ place_idx ].name ){
            vm.placeSelected( places[ place_idx ].name );
        }

        // update selected markers icon with customer icon and bounce once
        // to show it was clicked.  Get Place information from Yelp
        self.selectedMarker = marker;
        self.selectedMarker.setIcon( 'images/blue_marker.png' );
        if( self.selectedMarker.getAnimation() != null ){
            self.selectedMarker.setAnimation(null);
        }else{
            self.selectedMarker.setAnimation( google.maps.Animation.BOUNCE );
            window.setTimeout( function(){
                self.selectedMarker.setAnimation( null );
                // create Yelp object and do lookup of selected Place
                yelp = new Yelp();
                yelp.lookup( places[ place_idx ].name, places[ place_idx ].city_state );
            }, 750 );
        }
    }
}

// knockout js ViewModel class
var ViewModel = function(){
    var self = this;

    // track the current selected location
    self.placeSelected = ko.observable( "" );
    // track any input to search box
    self.placeLocations = ko.observable( "" );
    // track our list of Places
    self.places = ko.observableArray( places );

    // when place clicked update current place and trigger
    // click event on place map marker
    self.placeClicked = function(){
        // if viewing in small window and the menu hamburger icon is visible
        // close Places menu to see infoWindow on map
        if( $('#menu').is( ':visible')){
            // hide menu so user can see map marker infoWindow
            $('#menu').trigger('click');
        }
        self.placeSelected( this.name );
        google.maps.event.trigger( this.map_marker, 'click' );
    }

    // implemented this search with help from article found
    // http://opensoul.org/2011/06/23/live-search-with-knockoutjs/
    // this search filters the menu items and markers using characters
    // typed in search box. If empty, show all items in menu
    self.search = function( value ){
        for( var place in self.places() ){
            // use value to search string
            if( ( self.places()[ place ].name.toLowerCase().indexOf( value.toLowerCase() ) >= 0 ) ){
                // part of Place name matches text in search box
                // make menu item and map marker visible
                self.places()[ place ].is_visible( true );
                self.places()[ place ].map_marker.setVisible( true );

            } else {
                // no part of Place name matchss text in search box
                // hide menu item and marker
                self.places()[ place ].is_visible( false );
                self.places()[ place ].map_marker.setVisible( false );
            }
        }
    }
}

// Yelp Interface
// http://forum.jquery.com/topic/hiding-oauth-secrets-in-jquery
var Yelp = function(){
    var self = this;

    // Yelp uses oauth1.0a
    // normally would not put secret keys in javascript
    // but necessary to make work for this project
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

    // do Yelp lookup
    self.lookup = function( term, place ){
        // build parameters array for oauth authentication
        self.parameters = [];
        self.parameters.push( ['term', term] );
        self.parameters.push( ['location', place ] );
        self.parameters.push( ['limit', '1'] );
        // defaulting cll to lat long of Bar Harbor to ensure more accurate search
        self.parameters.push( ['cll', gm.mapCenterLat + ',' + gm.mapCenterLng] );
        self.parameters.push( ['callback', 'cb'] );
        self.parameters.push( ['oauth_consumer_key', self.auth.consumerKey] );
        self.parameters.push( ['oauth_consumer_secret', self.auth.consumerSecret] );
        self.parameters.push( ['oauth_token', self.auth.accessToken] );
        self.parameters.push( ['oauth_signature_method', 'HMAC-SHA1'] );
        self.message.parameters = self.parameters;

        OAuth.setTimestampAndNonce(self.message);
        OAuth.SignatureMethod.sign(self.message, self.accessor);

        var parameterMap = OAuth.getParameterMap(self.message.parameters);
        parameterMap.oauth_signature = OAuth.percentEncode(parameterMap.oauth_signature);

        // make ajax call to yelp so we can fail gracefully if communication problems
        $.ajax({
            url: self.message.action,
            data: parameterMap,
            cache: true,
            dataType: 'jsonp',
            jsonpCallback: 'cb',
        }).done( function( data, textStats, XMLHttpRequest ){
            // success - show yelp info in infoWindow
            gm.showInfoWindow( data );
        }).fail( function(){
            // failed - show default info in infoWindow
            gm.showDefaultInfoWindow();
        });
    }
};

// load map and add event listener on resize to keep markers in view
var gm = new Map();
window.addEventListener( 'load', gm.initializeMap() );
window.addEventListener( 'resize', function(e){
    google.maps.event.trigger( gm.map, 'resize' );
    gm.map.fitBounds( gm.mapBounds );
    gm.map.setCenter( new google.maps.LatLng( gm.mapCenterLat, gm.mapCenterLng ) );
});

// create knockout ViewModel
var vm = new ViewModel();
ko.applyBindings( vm );
// need to subscibe our search box to monitor keystrokes
// to filter menu items and map markers
vm.placeLocations.subscribe( vm.search );

// event listener for hamburger button to open places list menu
var $menu = $("#menu");
var $places = $("#places");

$menu.click( function(e){
    $places.toggleClass( 'open' );
    e.stopPropagation();
});
