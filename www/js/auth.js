var _login_status_ = false;
var appId = '554449381361750';
var roleArn = 'arn:aws:iam::074554520751:role/FacebookUsers';
var bucketName = 'bump-uploads';
var fbUserId;
// var fbReady = false;
// var deviceReady = false;

angular.module('auth', [])

  .factory('FB', [function() {
    var require = cordova.require;

    var exec = require("cordova/exec");

    exec(function(res) { alert(res); }, function(err) {
      alert('Nothing to echo.');
    }, "Echo", "echo", ['Echoing']);

    return {

      getLoginStatus: function (s, f) {
        exec(s, f, "FacebookConnectPlugin", "getLoginStatus", []);
      },

      showDialog: function (options, s, f) {
        exec(s, f, "FacebookConnectPlugin", "showDialog", [options]);
      },

      login: function (permissions, s, f) {
        exec(s, f, "FacebookConnectPlugin", "login", permissions);
      },

      logEvent: function(name, params, valueToSum, s, f) {
        // Prevent NSNulls getting into iOS, messes up our [command.argument count]
        if (!params && !valueToSum) {
            exec(s, f, "FacebookConnectPlugin", "logEvent", [name]);
        } else if (params && !valueToSum) {
            exec(s, f, "FacebookConnectPlugin", "logEvent", [name, params]);
        } else if (params && valueToSum) {
            exec(s, f, "FacebookConnectPlugin", "logEvent", [name, params, valueToSum]);
        } else {
            f("Invalid arguments");
        }
      },

      logPurchase: function(value, currency, s, f) {
          exec(s, f, "FacebookConnectPlugin", "logPurchase", [value, currency]);
      },

      getAccessToken: function(s, f) {
          exec(s, f, "FacebookConnectPlugin", "getAccessToken", []);
      },

      logout: function (s, f) {
          exec(s, f, "FacebookConnectPlugin", "logout", []);
      },

      api: function (graphPath, permissions, s, f) {
          if (!permissions) { permissions = []; }
          exec(s, f, "FacebookConnectPlugin", "graphApi", [graphPath, permissions]);
      }
    };
  }]);




// window.fbAsyncInit = function() {
//   alert('fb');
//   fbReady = true;
//   ready();
// };
 
document.addEventListener('deviceready', function() {
  // alert('device');
  // deviceReady = true;
  // ready();
}, false);

document.addEventListener('DOMContentLoaded', ready)

// Load the Facebook SDK asynchronously
// (function (d, s, id) {
//   var js, fjs = d.getElementsByTagName(s)[0];
//   if (d.getElementById(id)) {
//       return;
//   }
//   js = d.createElement(s);
//   js.id = id;
//   js.src = "//connect.facebook.net/en_US/all.js";
//   fjs.parentNode.insertBefore(js, fjs);
// }(document, 'script', 'facebook-jssdk'));


    // button.addEventListener('click', function () {
    //     var file = fileChooser.files[0];
    //     if (file) {
    //         results.innerHTML = '';
    //         //Object key will be facebook-USERID#/FILE_NAME
    //         var objKey = 'facebook-' + fbUserId + '/' + file.name;
    //         var params = {
    //             Key: objKey,
    //             ContentType: file.type,
    //             Body: file,
    //             ACL: 'public-read'
    //         };
    //         bucket.putObject(params, function (err, data) {
    //             if (err) {
    //                 results.innerHTML = 'ERROR: ' + err;
    //             } else {
    //                 listObjs();
    //             }
    //         });
    //     } else {
    //         results.innerHTML = 'Nothing to upload.';
    //     }
    // }, false);

    // function listObjs() {
    //     var prefix = 'facebook-' + fbUserId;
    //     bucket.listObjects({
    //         Prefix: prefix
    //     }, function (err, data) {
    //         if (err) {
    //             results.innerHTML = 'ERROR: ' + err;
    //         } else {
    //             var objKeys = "";
    //             data.Contents.forEach(function (obj) {
    //                 objKeys += obj.Key + "<br>";
    //             });
    //             results.innerHTML = objKeys;
    //         }
    //     });
    // }

