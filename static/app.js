var app = angular.module('MMQbeta', []);

// Run

app.run(function () {
  var tag = document.createElement('script');
  tag.src = "http://www.youtube.com/iframe_api";
  var firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
});

// Config

app.config( function ($httpProvider) {
  delete $httpProvider.defaults.headers.common['X-Requested-With'];
});

app.service('VideosService', ['$window', '$rootScope', '$log', '$http', function ($window, $rootScope, $log, $http) {

  var service = this;
  var channel;
  var youtube = {
    ready: false,
    player: null,
    playerId: null,
    videoId: null,
    videoTitle: null,
    playerHeight: '480',
    playerWidth: '640',
    state: 'stopped'
  };
  var results = [];
  var upcoming = [
  ];

  $window.onYouTubeIframeAPIReady = function () {
    $log.info('Youtube API is ready');
    youtube.ready = true;
    service.bindPlayer('placeholder');
    service.loadPlayer();
    $rootScope.$apply();
  };

  function onYoutubeReady (event) {
    $log.info('YouTube Player is ready');
  }

  function onYoutubeStateChange (event) {
    if (event.data == YT.PlayerState.PLAYING) {
      youtube.state = 'playing';
    } else if (event.data == YT.PlayerState.PAUSED) {
      youtube.state = 'paused';
    } else if (event.data == YT.PlayerState.ENDED) {
        youtube.state = 'ended';
        service.launchPlayer(upcoming[0].id, upcoming[0].title);
        service.archiveVideo(upcoming[0].r_id, upcoming[0].code);
        service.deleteVideo(upcoming, upcoming[0].id);
    }
    $rootScope.$apply();
  }

  this.bindPlayer = function (elementId) {
    $log.info('Binding to ' + elementId);
    youtube.playerId = elementId;
  };

  this.createPlayer = function () {
    $log.info('Creating a new Youtube player for DOM id ' + youtube.playerId + ' and video ' + youtube.videoId);
    return new YT.Player(youtube.playerId, {
      height: youtube.playerHeight,
      width: youtube.playerWidth,
      playerVars: {
        rel: 0,
        showinfo: 0
      },
      events: {
        'onReady': onYoutubeReady,
        'onStateChange': onYoutubeStateChange
      }
    });
  };

  this.loadPlayer = function () {
    if (youtube.ready && youtube.playerId) {
      if (youtube.player) {
        youtube.player.destroy();
      }
      youtube.player = service.createPlayer();
    }
  };

  this.launchPlayer = function (id, title) {
    youtube.player.loadVideoById(id);
    youtube.videoId = id;
    youtube.videoTitle = title;
    return youtube;
  }

  this.queueVideo = function (id, title, r_id) {
    upcoming.push({
      id: id,
      title: title,
      r_id: r_id
    });
    return upcoming;
  };

  this.archiveVideo = function (channel, id, code) {
    $http.post('/finish', {"id": id}).
        success(function (results) {
            $log.log(results);
        }).
        error(function (error) {
            $log.log(error);
        });
  };

  this.deleteVideo = function (list, id) {
    for (var i = list.length - 1; i >= 0; i--) {
      if (list[i].id === id) {
        list.splice(i, 1);
        break;
      }
    }
  };

  this.getTitle = function(id) {
      var d = $http.jsonp('http://gdata.youtube.com/feeds/api/videos/'+ id + '?alt=json-in-script&callback=JSON_CALLBACK&prettyprint=true&fields=title');
      return d;
  };

  this.getYoutube = function () {
    return youtube;
  };

  this.getUpcoming = function () {
    return upcoming;
  };


}]);

// Controller

app.controller('VideosController', function ($scope, $http, $log,$timeout,$http, VideosService) {
    init();

   function init() {
      $scope.youtube = VideosService.getYoutube();
      $scope.upcoming = VideosService.getUpcoming();
      $scope.channel = VideosService.getChannel();
      $scope.playlist = true;
      $scope.maxId = 0;
    }



    $scope.getData = function(channel) {
        $log.log(channel)
        var d = $http.get("/" + channel + '/results');
        // Call the async method and then do stuff with what is returned inside our own then function
        d.then(function(d) {
            $log.info(d);
            d.data.videos.forEach(function (vid) {
                $log.info(vid);
                if (vid['id'] > $scope.maxId) {
                    var p = VideosService.getTitle(vid['code']);
                    p.then(function(title) {
                        $log.log(p);
                        $log.log(title);
                        $scope.queue(vid['code'], title.data.entry.title.$t);
                        $scope.maxId = vid['id'];
                    });
                };
            });
        });
        $timeout(function() {$scope.getData(channel)}, 5000)
    };


    $scope.launch = function (channel, id, title) {
      VideosService.launchPlayer(id, title);
      VideosService.archiveVideo(channel, id, title);
      VideosService.deleteVideo($scope.upcoming, id);
      $log.info('Launched id:' + id + ' and title:' + title);
    };

    $scope.queue = function (id, title) {
      VideosService.queueVideo(id, title);
      $log.info('Queued id:' + id + ' and title:' + title);
    };

    $scope.add = function (channel) {
      $http.post('/' + channel + '/add', {"id": this.query}).
        success(function(results) {
          $log.log(results);
        }).
        error(function(error) {
          $log.log(error);
        });
    }

    $scope.tabulate = function (state) {
      $scope.playlist = state;
    }
});