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

  .factory('notificationFactory', ['$resource', 'HOST', function($resource, HOST) {
    var user = $resource(HOST + '/notification/:id/:action', {}, {});
    return user;
  }])

  .factory('categoryFactory', ['$resource', 'HOST', function($resource, HOST) {
    var category = $resource(HOST + '/category', {}, {});
    return category;
  }])

  .filter('timeAgo', ['$sce', function($sce) {
    return function(item, now) {
      now = now || new Date();
      item = item || new Date().toString();

      var str = item.replace(/\.[0-9]{3}Z/, '').replace('T', ' ').replace(/-/g, '/'),
        date = new Date(str),
        diff = now - +new Date(+date-date.getTimezoneOffset()*60000);
        sec = Math.floor(diff / 1000),
        min = Math.floor(diff / 60000),
        hour = Math.floor(diff / 3600000),
        day = Math.floor(diff / 86400000);

      sec = sec ? (sec < 30 ? '<small>Just now</small>' : (sec + ' <small>Secs</small> ')) : 0;
      min = min ? (min + ' <small>Min</small> ') : 0;
      hour = hour ? (hour + ' <small>Hrs</small> ') : 0;
      day = day ? (day + ' <small>Days</small> ') : 0;
      return $sce.trustAsHtml(day || hour || min || sec || '');
    };
  }])

  .filter('round', [function() {
    return function(total) {
      total = (total+'').replace(/,/g, '');
      var len = ((total || '')+'').split('.')[0].length,
        suffix,
        pow;
      total = parseFloat(total) ? parseFloat(total) : 0;
      if (len > 9) {
        suffix = 'B';
        pow = 8;
      } else if (len > 6) {
        suffix = 'M';
        pow = 5;
      } else if (len > 3) {
        suffix = 'K';
        pow = 2;
      }
      return suffix ? Math.round(total/Math.pow(10, pow))/10+' '+suffix : total+'' || '';
    };
  }])

  .filter('gridTop', [function() {
    return function(grid, idx) {
      var w = $(window).width();
      return Math.floor(idx / grid) * (w / grid) + 'px';
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