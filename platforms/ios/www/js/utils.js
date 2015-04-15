angular.module('utils', [])

  .factory('currentUser', [function() {
    return {
      set: function(data) {
        for (var key in data) {
          this[key] = data[key];
        }
        this.active = parseInt(data.active);
        this.post_to_fb = parseInt(data.post_to_fb);
        return this;
      },
      get: function() {
        return this;
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

  .factory('HOST', ['platform', 'API_VERSION', function(platform, API_VERSION) {
    var host;
    if (platform == 'desktop-simulator' || platform == 'browser' || platform == 'phone-simulator')
      host = 'http://localhost:8081/';
    else
      host = 'http://app.pikbump.com/';

    return {
      open: host + 'open/v' + API_VERSION,
      api: host + 'api/v' + API_VERSION
    };
  }])

  .factory('imageFactory', ['$resource', 'HOST', function($resource, HOST) {
    var image = $resource(HOST.api+ '/image/:category/:id/:action', {}, {});
    return image;
  }])

  .factory('userFactory', ['$resource', 'HOST', function($resource, HOST) {
    var user = $resource(HOST.api+ '/user/:id/:action', {}, {});
    return user;
  }])

  .factory('notificationFactory', ['$resource', 'HOST', function($resource, HOST) {
    var user = $resource(HOST.api+ '/notification/:id/:action', {}, {});
    return user;
  }])

  .factory('categoryFactory', ['$resource', 'HOST', function($resource, HOST) {
    var category = $resource(HOST.open + '/category', {}, {});
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

      sec = sec ? (sec < 30 ? '<small>now</small>' : (sec + 's')) : 0;
      min = min ? (min + 'm') : 0;
      hour = hour ? (hour + 'h') : 0;
      day = day ? (day + 'd') : 0;
      return $sce.trustAsHtml('<i class="fa fa-clock"></i>' + (day || hour || min || sec || ''));
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