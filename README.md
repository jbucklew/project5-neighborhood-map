# Neigherhood Map Project
## Bar Harbor, Maine

### To Run Application
* Save application to a local directory and open the index.html file.
* All files required to run the application are included.

### Notes
* Used flex-box in the html design from the Responsive Web Design Fundamentals course. Page will adjust as the window gets smaller.
* Places are looked up initially using Google's Places Service to get latitude and longitude information for marker placement.
* Clicking a map marker will animate the marker, change its icon and open an info window containing information about the Place from Yelp. It will also highlight the corresponding menu item in the same color.
* Clicking a menu item has the same affect as clicking a map marker.
* Typing characters in the search box will filter the menu items and markers to Places with the string in its name.
* In small screen mode, a hamburger icon will appear to the left of the search box and can be used to open the Places menu.  Once an item is clicked the menu will automatically close to allow room to view the open info window.
* When closing an info window the map will re-center if it moved to allow space to view the info window.
* All functionality was tested using Google Chrome Canary version 44.0.2385.0


### Site Used
* stackoverflow.com 
* http://commons.wikimedia.org/wiki/File:No_image_available.svg - public domain image of "no image" for use if yelp does not provide an image of the location
* http://opensoul.org/2011/06/23/live-search-with-knockoutjs/ 
* http://forum.jquery.com/topic/hiding-oauth-secrets-in-jquery