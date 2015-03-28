// var HOST = 'http://app.pikbump.com';
var HOST = 'http://localhost:8081';

angular.module('bump', ['auth'])

  .controller('HomeController', ['$scope', '$http', '$timeout', 'FB',
    function($scope, $http, $timeout, FB) {

      $scope.ENDPOINT = 'https://s3.amazonaws.com/bump-pictures';

      $scope.title = 'Bump';
      $scope.category = 'Architecture';

      $scope.$watch('alert', function(state) {
        if (state) {
          $timeout(function() {
            $scope.alert = false;
          }, 2500);
        }
      });


      FB.getLoginStatus(function (response) {
        alert(JSON.stringify(response));
      }, function (response) {
        alert(JSON.stringify(response)) 
      });

      $scope.loginWithFB = function() {

        FB.login([], function (response) {
          alert(JSON.stringify(response));
        }, function (response) {
          alert(JSON.stringify(response)) 
        });
      };

      document.addEventListener('deviceready', function() {

        FB.init({
          appId: appId,
          nativeInterface: CDV.FB,
          useCachedDialogs: false
        });
        FB.getLoginStatus(function(response) {
          if (response.status === 'connected') {
            // the user is logged in and has authenticated your
            // app, and response.authResponse supplies
            // the user's ID, a valid access token, a signed
            // request, and the time the access token 
            // and signed request each expire
            var uid = response.authResponse.userID;
            var accessToken = response.authResponse.accessToken;
            // alert(uid, accessToken);
            $scope.$apply(function() {
              $scope.authd = uid;
            });
          } else if (response.status === 'not_authorized') {
            // the user is logged in to Facebook, 
            // but has not authenticated your app
            alert('not-auth');
          } else {
            // the user isn't logged in to Facebook.
          }
        }, function(err) {
          alert(err);
        });

      }, false); 

      $scope.openPreview = function(image) {
        $scope.focusImage = image;
      };

      $scope.closePreview = function() {
        $scope.focusImage = false;
      };

      $scope.bump = function(image) {
        if (!image.bumped) {
          image.bumps += 1;
          image.bumped = true;
        }
        $http.post(HOST + '/api/v1.0/bump', { image: image.id, user: 1 }, { headers: { 'Content-Type': 'application/json' } })
          .success(function(data) {
            console.log(data);
          });
      }

      $scope.camera = function() {
        navigator.camera.getPicture(uploadPhoto, function(message) {
          console.log('get picture cancelled'); 
        },{
          quality: 50, 
          destinationType: navigator.camera.DestinationType.FILE_URI,
          sourceType: navigator.camera.PictureSourceType.PHOTOLIBRARY
        });
      };

      function uploadPhoto(imageURI) {
        var options = new FileUploadOptions();
        options.fileKey = "file";
        options.fileName = imageURI.substr(imageURI.lastIndexOf('/')+1);
        options.mimeType = "image/jpeg";

        var params = new Object();
        params.value1 = "test";
        params.value2 = "param";

        options.params = params;
        options.chunkedMode = false;

        var ft = new FileTransfer();
        ft.upload(imageURI, HOST + "/api/v1.0/upload", success, fail, options);
      }

      function success(r) {
        $scope.$apply(function() {
          $scope.alert = 'Upload successful';
          loadImages();
        });
      }
 
      function fail(error) {
        alert("An error has occurred: Code = " + error.code);
      }


      function loadImages() {
        $http.get(HOST + '/api/v1.0/image')
          .success(function(data) {
            $scope.picList = data;   
          })
          .error(function(err) {
            alert('failed to load images');
          });
      }
      loadImages();

    }
  ])

  .filter('commas', function() {
    return function(item) {
      return (item+'').replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };
  });
