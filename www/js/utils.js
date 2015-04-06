angular.module('utils', [])

  .factory('user', [function() {
    return {
      set: function() {
        
      },
      get: function() {
        
      }
    };
  }])

  .factory('platform', [function() {
    var platform;

    if (!!~document.URL.indexOf('Simulator')) {
      platform = 'desktop-simulator';
    } else if (!!~document.URL.indexOf(':3000')) {
      platform = 'phone-simulator';
    } else if (!window.cordova) {
      console.log = console._log;
      platform = 'browser';
    } else {
      platform = 'ios';
    }
    return platform;
  }])

  .factory('HOST', ['platform', function(platform) {
    if (platform == 'desktop-simulator' || platform == 'browser' || platform == 'phone-simulator')
      return 'http://localhost:8081/api/v1.0';
    else
      return 'http://app.pikbump.com/api/v1.0';
  }])

  .factory('imageFactory', ['$resource', 'HOST', function($resource, HOST) {
    var image = $resource(HOST + '/image/:category/:id/:action', {}, {});
    return image;
  }])

  .factory('userFactory', ['$resource', 'HOST', function($resource, HOST) {
    var user = $resource(HOST + '/user/:id/:action', {}, {});
    return user;
  }])

  .factory('categoryFactory', ['$resource', 'HOST', function($resource, HOST) {
    var category = $resource(HOST + '/category', {}, {});
    return category;
  }])

  .filter('gridTop', [function() {
    return function(grid, idx) {
      var w = $(window).width();
      return Math.floor(idx / grid) * (w / grid + (grid == 1 ? 42 : 0)) + 'px';
    }
  }])

  .filter('gridLeft', [function() {
    return function(grid, idx) {
      var w = $(window).width();
      return Math.floor(idx % grid) * (w / grid) + 'px';
    }
  }])

  .filter('commas', function() {
    return function(item) {
      return (item+'').replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };
  });