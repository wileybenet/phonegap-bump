angular.module('bump', ['ngResource', 'auth'])

  .controller('HomeController', ['$scope', '$http', '$timeout', 'HOST', 'FB', 'image', 'platform',
    function($scope, $http, $timeout, HOST, FB, image, platform) {
      var currentFbUserId, currentFbAccessToken;

      $scope.ENDPOINT = 'https://s3.amazonaws.com/bump-pictures';

      $scope.title = 'Bump';
      $scope.category = 'Architecture';

      $scope.$watch('alert', function(state) {
        if (state && !~state.indexOf('...')) {
          $timeout(function() {
            $scope.alert = false;
          }, 2500);
        }
      });

      if (platform == 'browser')
        $scope.authd = true;

      function authRequest(res) {
        currentFbUserId = res.authResponse.userID;
        currentFbAccessToken = res.authResponse.accessToken;
        if (res.status === 'connected') {
          $http.post(HOST + '/api/v1.0/login', { user: res.authResponse.userID, accessToken: res.authResponse.accessToken })
            .success(function(data) {
              console.log('user:', data);
            }); 

          $scope.$apply(function() {
            $scope.authd = true;
          });
        } 
        console.log('fb status', res);
      }

      function bootstrap() {
        console.log('device loaded');

        FB.getLoginStatus(authRequest, function (res) {
          console.log('fb err', res); 
        });

        $scope.$apply(function() {
          $scope.loaded = true;
        });
      }

      document.addEventListener("deviceready", bootstrap, false);


      $scope.loginWithFB = function() {
        FB.login(['email'], authRequest, function (res) {
          console.log(JSON.stringify(res)) 
        }, function(res) {
          console.log('login err', res);
        });
      };

      $scope.categories = function() {
        $scope.catPreview = true;
      };

      $scope.catSelect = function(category) {
        $scope.category = category.name;
        $scope.catPreview = false;
      };

      $scope.openPreview = function(image) {
        image.images = $scope.picList;
        $scope.imagePreview = image;
        $scope.imagePreview.profilePic = 'http://graph.facebook.com/' + image.fb_id + '/picture';
      };

      $scope.closePreview = function() {
        $scope.catPreview = false;
        $scope.imagePreview = false;
        $scope.uploadPreview = false;
      };

      $scope.getIconWidth = function() {
        return $(window).width() / 10;
      };

      $scope.bump = function(image) {
        if (!image.bumped) {
          image.bumps += 1;
          image.bumped = true;
        }
        $http.post(HOST + '/api/v1.0/bump', { image: image.id, user: 1 })
          .success(function(data) {
            console.log(data);
          });
      }

      $scope.camera = function() {
        navigator.camera.getPicture(loadPhoto, function(message) {
          console.log('get picture cancelled'); 
        },{
          quality: 50, 
          destinationType: navigator.camera.DestinationType.FILE_URI,
          sourceType: navigator.camera.PictureSourceType.PHOTOLIBRARY
        });
      };

      function loadPhoto(imageURI) {
        $scope.$apply(function() {
          $scope.uploadPreview = true;
          $scope.uploadParams = {
            category: 'Category'
          };
          $scope.pendingUploadImage = imageURI;
        });

        // uploadPhotoToServer(imageURI);
      }

      $scope.uploadPhotoToServer = function() {
        var imageURI = $scope.pendingUploadImage;
        var ft = new FileTransfer();
        var options = {};
        options.fileKey = "file";
        options.fileName = imageURI.substr(imageURI.lastIndexOf('/')+1);
        options.mimeType = "image/jpeg";
        options.params = $scope.uploadParams;
        options.chunkedMode = false;
        $timeout(function() {
          $scope.alert = 'Uploading...';
          $scope.uploadPreview = false;
        });
        ft.upload(imageURI, HOST + "/api/v1.0/upload", function(res) {
          $scope.$apply(function() {
            var imageList = JSON.parse(res.response);
            $scope.alert = 'Uploaded successfully';
            $scope.openPreview(imageList[0]);
          });
        }, function(error) {
          console.log("An error has occurred: Code = " + error.code);
        }, options);
      }
 
    
      $http.get(HOST + '/api/v1.0/category')
        .success(function(data) {
          $scope.catList = data;   
        })
        .error(function(err) {
          console.log('failed to load images');
        });


      $scope.picList = image.query();

    }
  ])

  .factory('platform', [function() {
    var platform;
    if (!!~document.URL.indexOf('Simulator')) {
      platform = 'simulator';
    } else if (!window.cordova) {
      platform = 'browser';
    } else {
      platform = 'ios';
    }
    return platform;
  }])

  .factory('HOST', ['platform', function(platform) {
    if (platform == 'simulator' || platform == 'browser')
      return 'http://localhost:8081';
    else
      return 'http://app.pikbump.com';
  }])

  .factory('image', ['$resource', 'HOST', function($resource, HOST) {
    var image = $resource(HOST + '/api/v1.0/image/:id/:action', {}, {});
    return image;
  }])

  .filter('commas', function() {
    return function(item) {
      return (item+'').replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };
  });
