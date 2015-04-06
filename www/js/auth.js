angular.module('auth', [])

  .factory('FB', ['platform', function(platform) {
    var cordova = window.cordova || { exec: function () {}, browser: true };
    setTimeout(function() {
      if (platform === 'browser')
        document.dispatchEvent(new Event('deviceready'))
    });
    
    var FB = {
      getLoginStatus: function (s, f) {
        cordova.exec(s, f, "FacebookConnectPlugin", "getLoginStatus", []);
      },

      showDialog: function (options, s, f) {
        cordova.exec(s, f, "FacebookConnectPlugin", "showDialog", [options]);
      },

      login: function (permissions, s, f) {
        cordova.exec(s, f, "FacebookConnectPlugin", "login", permissions);
      },

      logEvent: function(name, params, valueToSum, s, f) {
        // Prevent NSNulls getting into iOS, messes up our [command.argument count]
        if (!params && !valueToSum) {
            cordova.exec(s, f, "FacebookConnectPlugin", "logEvent", [name]);
        } else if (params && !valueToSum) {
            cordova.exec(s, f, "FacebookConnectPlugin", "logEvent", [name, params]);
        } else if (params && valueToSum) {
            cordova.exec(s, f, "FacebookConnectPlugin", "logEvent", [name, params, valueToSum]);
        } else {
            f("Invalid arguments");
        }
      },

      logPurchase: function(value, currency, s, f) {
        cordova.exec(s, f, "FacebookConnectPlugin", "logPurchase", [value, currency]);
      },

      getAccessToken: function(s, f) {
        cordova.exec(s, f, "FacebookConnectPlugin", "getAccessToken", []);
      },

      logout: function (s, f) {
        cordova.exec(s, f, "FacebookConnectPlugin", "logout", []);
      },

      api: function (graphPath, permissions, s, f) {
        if (!permissions)
          permissions = [];
        cordova.exec(s, f, "FacebookConnectPlugin", "graphApi", [graphPath, permissions]);
      }
    };

    return FB;
  }]);
