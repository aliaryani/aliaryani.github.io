/**
* @description This is a service worker to cache assets.
* This will work alongside service-worker.js which is created on build time
* and caches *.chunks.js automatically
*
* @method 
*
* @author Armin Eslami
* @since File available since Release 1.0.0 (2017/09/13)
* @version 1.0.0
*
*/

// A name for Cached files
const CACHE_NAME = 'board-web-v1';
// Urls to Cache
const URLS_TO_CACHE = [
  '/assets/lib/css/hint/hint.base.min.css',
  '/assets/fonts/iransans.ttf',
];

/**
 * This hold all needed cache and if I update my caches like
 * spliting an old cache to two different caches, then i want
 * old cache to be removed because now its splited. For doing it i would remove old cache name
 * from CACHE_WHITE_LIST and then when user reloads my app,
 * since my service worker has changed, browser will call active callback
 * and at this callback i will remove all caches which are not defined in CACHE_WHITE_LIST
 */
var CACHE_WHITE_LIST = ['board-web-v1'];


// Start caching files
self.addEventListener('install', (event) => {
    /**
     * Performing install steps as following
     * 1.Open a cache.
     * 2.Cache files.
     * 3.Confirm whether all the required assets are cached or not.
     */

    // Caching files'
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(function(cache) {
            // Cache is opened
            return cache.addAll(URLS_TO_CACHE);
        })
    );
}); // end of install listener

/**
 * On resources fetch request, if a cached version of requested file
 * is available then return it and if its not available
 * then make a network request and when its finished successfully,
 * cache the file.
 */
self.addEventListener('fetch', function(event) {
event.respondWith(
    caches.match(event.request)
    .then(function(response) {
        // Cache hit - return response
        if (response) {
        return response;
        }

        // IMPORTANT: Clone the request. A request is a stream and
        // can only be consumed once. Since we are consuming this
        // once by cache and once by the browser for fetch, we need
        // to clone the response.
        var fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
        function(response) {
            // Check if we received a valid response
            // basic indicates that it's a request from our origin not third party assets
            if(!response || response.status !== 200 || response.type !== 'basic') {
            return response;
            }

            // IMPORTANT: Clone the response. A response is a stream
            // and because we want the browser to consume the response
            // as well as the cache consuming the response, we need
            // to clone it so we have two streams.
            var responseToCache = response.clone();
            // Openning cache.
            caches.open(CACHE_NAME)
            .then(function(cache) {
                cache.put(event.request, responseToCache);
            },
            function(err) {} );

            return response;
        },
        function(err){}
        );
    },
    function(err) {})
    );
}); // end of fetch listener

/**
 * When I update my service worker, at first visit of my app
 * browser will redoanload serive worker file and will notice that it has changed.
 * At this poing install event for new service worker will be fired but
 * the old service worker will still work until the app is closed and new service worker will
 * enter a waiting state.
 * When all of opened pages of my app is closed, new service worker will be replaced by old one.
 * Once the new service worker takes controll, active event will be fired.
 * 
 * One common task that will occur in the activate callback is cache management.
 * This can be done by looping through all of the caches in the service worker 
 * and deleting any caches that aren't defined in the cache CACHE_WHITE_LIST.
 */
self.addEventListener('activate', function(event) {
    event.waitUntil(
    caches.keys().then(function(cacheNames) {
        return Promise.all(
        cacheNames.map(function(cacheName) {
            if (CACHE_WHITE_LIST.indexOf(cacheName) === -1) {
            // Removing old cache(s).
            return caches.delete(cacheName);
            }
            return null;
        })
        );
    })
    );
}); // end of activate listener