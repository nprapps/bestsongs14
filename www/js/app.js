// Global jQuery references
var $body = null;
var $shareModal = null;
var $goButton = null;
var $audioPlayer = null;
var $playerArtist = null;
var $playerTitle = null;
var $currentTime = null;
var $allTags = null;
var $reviewerButtons = null;
var $playlistLength = null;
var $totalSongs = null;
var $skip = null;
var $songs = null;
var $playlistLengthWarning = null;
var $fullscreenButtons = null;
var $fullscreenStart = null;
var $fullscreenStop = null;
var $castStart = null;
var $castStop = null;
var $landing = null;
var $genreFilters = null;
var $landingGenreButtons = null;
var $playedSongsLength = null;
var $clearHistory = null;
var $reviewerFilters = null;
var $fixedHeader = null;
var $landingReturnDeck = null;
var $landingFirstDeck = null;
var $chromeCastButtons = null;
var $chromecastStart = null
var $chromecastStop = null;
var $shuffleSongs = null;
var $chromecastScreen = null;
var $stack = null;
var $songsCast = null;
var $player = null;
var $play = null;
var $pause = null;
var $filtersButton = null;
var $filtersContainer = null;

// Global state
var IS_CAST_RECEIVER = (window.location.search.indexOf('chromecast') >= 0);
var NO_AUDIO = (window.location.search.indexOf('noaudio') >= 0);
var RESET_STATE = (window.location.search.indexOf('resetstate') >= 0);
var IS_FAKE_CASTER = (window.location.search.indexOf('fakecast') >= 0);

var firstShareLoad = true;
var playedSongs = [];
var playlist = [];
var currentSong = null;
var selectedTags = [];
var playlistLength = null;
var onWelcome = true;
var isCasting = false;
var playedsongCount = null;
var usedSkips = [];
var playerMode = null;
var curator = null;
var totalSongsPlayed = 0;
var songHistory = {};
var songHeight = null;
var is_small_screen = false
/*
 * Run on page load.
 */
var onDocumentLoad = function(e) {
    // Cache jQuery references
    $body = $('body');
    $shareModal = $('#share-modal');
    $goButton = $('.go');
    $audioPlayer = $('#audio-player');
    $songs = $('.songs');
    $songsCast = $('.cast-controls .songs');
    $skip = $('.skip');
    $playerArtist = $('.player .artist');
    $playerTitle = $('.player .song-title');
    $allTags = $('.playlist-filters li a');
    $currentTime = $('.current-time');
    $landingGenreButtons = $('.landing .tags a');
    $playlistLength = $('.playlist-length');
    $totalSongs = $('.total-songs');
    $playlistLengthWarning = $('.warning');
    $fullscreenButtons = $('.fullscreen');
    $fullscreenStart = $('.fullscreen .start');
    $fullscreenStop = $('.fullscreen .stop');
    $chromeCastButtons = $('.chromecast');
    $castStart = $('.chromecast .start');
    $castStop = $('.chromecast .stop');
    $tagsWrapper = $('.tags-wrapper');
    $landing = $('.landing');
    $genreFilters = $('.genre li a');
    $reviewerFilters = $('.reviewer li a');
    $playedSongsLength = $('.played-songs-length');
    $clearHistory = $('.clear-history');
    $fixedHeader = $('.fixed-header');
    $landingReturnDeck = $('.landing-return-deck');
    $landingFirstDeck = $('.landing-firstload-deck');
    $shuffleSongs = $('.shuffle-songs');
    $chromecastScreen = $('.cast-controls');
    $stack = $('.stack');
    $chromecastPlayer = $('.chromecast-player');
    $player = $('.player-container')
    $play = $('.play');
    $pause = $('.pause');
    $filtersButton = $('.js-toggle-filters');
    $filtersContainer = $('.stack .playlist-filters');
    onWindowResize();
    $landing.show();

    // Bind events
    $shareModal.on('shown.bs.modal', onShareModalShown);
    $shareModal.on('hidden.bs.modal', onShareModalHidden);
    $goButton.on('click', onGoButtonClick);
    $landingGenreButtons.on('click', onLandingGenreClick);
    $genreFilters.on('click', onGenreClick);
    $reviewerFilters.on('click', onReviewerClick);
    $skip.on('click', onSkipClick);
    $castStart.on('click', onCastStartClick);
    $castStop.on('click', onCastStopClick);
    $play.on('click', onPlayClick);
    $pause.on('click', onPauseClick);
    $filtersButton.on('click', onFiltersButtonClick);
    $(window).on('resize', onWindowResize);
    $(document).keydown(onDocumentKeyDown);
    $clearHistory.on('click', onClearHistoryButtonClick);
    if (!(Modernizr.touch)) {
        $(document).on(screenfull.raw.fullscreenchange, onFullscreenChange);
        $fullscreenStart.on('click', onFullscreenButtonClick);
        $fullscreenStop.on('click', onFullscreenButtonClick);
    }
    $shuffleSongs.on('click', onShuffleSongsClick);
    $songs.on('click', '.song:not(:last-child)', onSongCardClick);

    // configure ZeroClipboard on share panel
    ZeroClipboard.config({ swfPath: 'js/lib/ZeroClipboard.swf' });
    var clippy = new ZeroClipboard($(".clippy"));

    clippy.on('ready', function(readyEvent) {
        clippy.on('aftercopy', onClippyCopy);
    });

    SONG_DATA = _.shuffle(SONG_DATA);

    if (RESET_STATE) {
        resetState();
        resetLegalLimits();
    }

    setupAudio();
    loadState();
    setInterval(checkSkips, 1000);

    if (IS_CAST_RECEIVER) {
        CHROMECAST_RECEIVER.setup();
        CHROMECAST_RECEIVER.onMessage('toggle-audio', onCastReceiverToggleAudio);
        CHROMECAST_RECEIVER.onMessage('skip-song', onCastReceiverSkipSong);
        CHROMECAST_RECEIVER.onMessage('toggle-genre', onCastReceiverToggleGenre);
        CHROMECAST_RECEIVER.onMessage('toggle-curator', onCastReceiverToggleCurator);

        CHROMECAST_RECEIVER.onMessage('send-playlist', onCastReceiverPlaylist);
        CHROMECAST_RECEIVER.onMessage('send-tags', onCastReceiverTags);
        CHROMECAST_RECEIVER.onMessage('send-history', onCastReceiverHistory);
        CHROMECAST_RECEIVER.onMessage('send-played', onCastReceiverPlayed);

        CHROMECAST_RECEIVER.onMessage('init', onCastReceiverInit);
    }
}

/*
 * Setup Chromecast if library is available.
 */
window['__onGCastApiAvailable'] = function(loaded, errorInfo) {
    // We need the DOM here, so don't fire until it's ready.
    $(function() {
        // Don't init sender if in receiver mode
        if (IS_CAST_RECEIVER ) {
            return;
        }

        if (loaded) {
            CHROMECAST_SENDER.setup(onCastReady, onCastStarted, onCastStopped);

            $chromeCastButtons.show();
            $castStart.show();
            $castStop.hide();

            if (IS_FAKE_CASTER) {
              onCastStarted();
            }

        } else {
            // TODO: prompt to install?
        }
    });
}


/*
// CHROMECAST
*/
/*
 * A cast device is available.
 */
var onCastReady = function() {
    $castStart.show();
}

/*
 * A cast session started.
 */
var onCastStarted = function() {
    // TODO: stop audio

    $stack.hide();
    $fullscreenStart.hide();
    $castStop.show();
    $castStart.hide();
    $audioPlayer.jPlayer('stop');

    isCasting = true;

    if (!IS_FAKE_CASTER) {
        $chromecastScreen.show();
    }

    CHROMECAST_SENDER.sendMessage('send-tags', selectedTags);
    CHROMECAST_SENDER.sendMessage('send-playlist', JSON.stringify(playlist));
    CHROMECAST_SENDER.sendMessage('send-history', JSON.stringify(songHistory));
    CHROMECAST_SENDER.sendMessage('send-played', playedSongs);
    CHROMECAST_SENDER.sendMessage('init');
}

/*
 * A cast session stopped.
 */
var onCastStopped = function() {
    $castStart.show();
    $castStop.hide();
    isCasting = false;

    $chromecastScreen.hide();
    $stack.show();
}

/*
 * Begin chromecasting.
 */
var onCastStartClick = function(e) {
    e.preventDefault();

    _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'chromecast-start']);

    CHROMECAST_SENDER.startCasting();
}

/*
 * Stop chromecasting.
 */
var onCastStopClick = function(e) {
    e.preventDefault();

    _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'chromecast-stop']);

    CHROMECAST_SENDER.stopCasting();

    $castStop.hide();
    $castStart.show();
}

var onCastReceiverToggleAudio = function(message) {
    if (message === 'play') {
        $audioPlayer.jPlayer('play');
    } else {
        $audioPlayer.jPlayer('pause');
    }
}

var onCastReceiverSkipSong = function() {
    skipSong();
}

var onCastReceiverToggleGenre = function(message) {
    toggleGenre(message);
}

var onCastReceiverToggleCurator = function(message) {
    toggleCurator(message);
}

var onCastReceiverPlaylist = function(message) {
    playlist = JSON.parse(message);
}

var onCastReceiverTags = function(message) {
    selectedTags = [message];
}

var onCastReceiverHistory = function(message) {
    songHistory = JSON.parse(message);
}

var onCastReceiverPlayed = function(message) {
    playedSongs = [message];
}

var onCastReceiverInit = function() {
    $landing.hide();
    $('.songs, .player-container, .playlist-filters').show();
    _.delay(playNextSong, 1000);
}



/*
// PLAYER
/*

/*
 * Configure jPlayer.
 */
var setupAudio = function() {
    $audioPlayer.jPlayer({
        ready: function() {
            $(this).jPlayer('setMedia', {
                mp3: 'http://download.lardlad.com/sounds/season4/monorail14.mp3'
            });
        },
        ended: playNextSong,
        supplied: 'mp3',
        loop: false,
        timeupdate: onTimeUpdate,
    });
}

/*
 * Update playback timer display.
 */
var onTimeUpdate = function(e) {
    var time_text = $.jPlayer.convertTime(e.jPlayer.status.currentTime);
    $currentTime.text(time_text);
};

/*
 * Start playing the preoroll audio.
 */
var startPrerollAudio = function() {
    if (simpleStorage.get('playedPreroll')) {
        playNextSong();
        return;
    }
    if (!NO_AUDIO){
        $audioPlayer.jPlayer('play');
    }

    simpleStorage.set('playedPreroll', true);
}

/*
 * Play the next song in the playlist.
 */
var playNextSong = function() {
    var nextSong = _.find(playlist, function(song) {
        return !(_.contains(playedSongs, song['id']));
    });

    if (nextSong) {
        var canPlaySong = checkSongHistory(nextSong);
        if (!canPlaySong) {
            return;
        }
    } else {
        nextPlaylist();
        return;
    }

    var context = $.extend(APP_CONFIG, COPY, nextSong);
    var $html = $(JST.song(context));

    if (isCasting) {
        $songs.prepend($html);
        $chromecastScreen.find('.song').first().velocity('fadeIn');
    } else {
        $songs.append($html);
        $songs.find('.song').last().velocity('fadeIn');
    }

    $songs.find('.song').last().prev().velocity("scroll", {
        duration: 350,
        offset: is_small_screen ? 0 : -60,
        complete: function(){
            $(this).addClass('small');
        }
    });

    $playerArtist.text(nextSong['artist'])
    $playerTitle.text(nextSong['title'])

    var nextsongURL = 'http://pd.npr.org/anon.npr-mp3' + nextSong['media_url'] + '.mp3';

    if (!NO_AUDIO) {
        $audioPlayer.jPlayer('setMedia', {
            mp3: nextsongURL
        }).jPlayer('play');
    }
    $play.hide();
    $pause.show();

    if (onWelcome) {
        $html.css('min-height', songHeight).velocity('fadeIn');
        $html.find('.container-fluid').css('height', songHeight);

        hideWelcome();
    } else {
        if (IS_CAST_RECEIVER) {
            $html.prev().hide();
            $html.css('min-height', songHeight);
            $html.find('.container-fluid').css('min-height', songHeight);
            $html.show();
        } else {
            $html.prev().velocity("scroll", {
                duration: 350,
                offset: is_small_screen ? 0 : -60,
                complete: function(){
                    $html.prev().find('.container-fluid').css('height', '0');
                    $html.prev().css('min-height', '0').addClass('small');
                    $html.css('min-height', songHeight)
                    .velocity('fadeIn', {
                        duration: 300,
                        begin: function(){
                            $(this).velocity("scroll", {
                                duration: 500,
                                offset: is_small_screen ? 0 : -60,
                                delay: 200
                            });
                        }
                    });
                    $html.find('.container-fluid').css('height', songHeight)
                }
            });
        }
    }

    currentSong = nextSong;
    markSongPlayed(currentSong);
    updateTotalSongsPlayed();
}

/*
 *  Set the height of the currently playing song to fill the viewport.
 */
var setCurrentSongHeight = function(){
    songHeight = $(window).height() - $player.height() - $fixedHeader.height();

    if (is_small_screen){
        songHeight += $fixedHeader.height();
    }

    $songs.children().last().find('.container-fluid').css('height', songHeight);
}

var checkSongHistory = function(song) {
    if (songHistory[song['id']]) {
        for (var i = 0; i < songHistory[song['id']].length; i++) {
            var now = moment.utc();
            if (now.subtract(3, 'hours').isAfter(songHistory[song['id']][i])) {
                songHistory[song['id']].splice(i,1);
            }
        }

        if (songHistory[song['id']].length >= 4) {
            markSongPlayed(song);
            playNextSong();
            return false;
        }
    } else {
        songHistory[song['id']] = [];
    }

    songHistory[song['id']].push(moment.utc());
    simpleStorage.set('songHistory', songHistory);

    return true;
}

var nextPlaylist = function() {
    if (playedSongs.length == SONG_DATA.length) {
        // if all songs have been played, reset to shuffle
        resetState();
        playerMode = 'genre';
        simpleStorage.set('playerMode', playerMode);
    }

    // determine next playlist based on player mode
    if (playerMode == 'genre') {
        resetGenreFilters();
        buildGenrePlaylist();
    } else if (playerMode == 'reviewer') {
        _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'curator-finish', curator]);
        getNextReviewer();
        playedSongs = [];
        buildReviewerPlaylist();
    }

    playPlaylistEndAudio();
}

var updateTotalSongsPlayed = function() {
    totalSongsPlayed++;
    simpleStorage.set('totalSongsPlayed', totalSongsPlayed);

    if (totalSongsPlayed % 5 === 0) {
        _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'songs-played', '', totalSongsPlayed]);
    }
}

var playPlaylistEndAudio = function() {
    var playlistEndAudioURL = APP_CONFIG.S3_BASE_URL + "/assets/ocean_breeze.mp3";

    if (!NO_AUDIO){
        $audioPlayer.jPlayer('setMedia', {
            mp3: playlistEndAudioURL
        }).jPlayer('play');
    }
}

var onPlayClick = function(e) {
    e.preventDefault();
    if (isCasting) {
        CHROMECAST_SENDER.sendMessage('toggle-audio', 'play');
    } else {
        $audioPlayer.jPlayer('play');
    }

    $play.hide();
    $pause.show();
}

var onPauseClick = function(e) {
    e.preventDefault();
    if (isCasting) {
        CHROMECAST_SENDER.sendMessage('toggle-audio', 'pause');
    } else {
        $audioPlayer.jPlayer('pause');
    }

    $pause.hide();
    $play.show();
}

/*
 * Skip the current song.
 */
var onFiltersButtonClick = function(e) {
    if ($filtersContainer.offset().top > songHeight + $(document).scrollTop()) {
        $filtersContainer.velocity('scroll', 300);
    } else {
        $songs.find('.song:last-child').velocity('scroll', {
            offset: is_small_screen ? 0 : -60,
            duration: 300
        });
    }
}


/*
 * Skip the current song.
 */
var onSkipClick = function(e) {
    e.preventDefault();
    if (isCasting) {
        CHROMECAST_SENDER.sendMessage('skip-song');
    } else {
        skipSong();
    }
}

var skipSong = function() {
    if (usedSkips.length < APP_CONFIG.SKIP_LIMIT) {
        usedSkips.push(moment.utc());
        playNextSong();
        simpleStorage.set('usedSkips', usedSkips);
        writeSkipsRemaining();
        _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'song-skip', $playerTitle.text(), usedSkips.length, ]);
    }
}

var checkSkips = function() {
    var now = moment.utc();
    for (i = 0; i < usedSkips.length; i++) {
        if (now.subtract(1, 'minute').isAfter(usedSkips[i])) {
            usedSkips.splice(i, 1);
        }
    }
    simpleStorage.set('usedSkips', usedSkips);
    writeSkipsRemaining();
}

var writeSkipsRemaining = function() {
    if (usedSkips.length == APP_CONFIG.SKIP_LIMIT - 1) {
        $('.skips-remaining').text(APP_CONFIG.SKIP_LIMIT - usedSkips.length + ' skip')
    }
    else if (usedSkips.length == APP_CONFIG.SKIP_LIMIT) {
        $('.skips-remaining').text('no skips');
    }
    else {
        $('.skips-remaining').text(APP_CONFIG.SKIP_LIMIT - usedSkips.length + ' skips')
    }
}

/*
// APP STATE
*/

/*
 * Load previously played songs from browser storage
 */
var loadState = function() {

    playedSongs = simpleStorage.get('playedSongs') || [];
    selectedTags = simpleStorage.get('selectedTags') || [];
    usedSkips = simpleStorage.get('usedSkips') || [];
    playerMode = simpleStorage.get('playerMode') || 'genre';
    totalSongsPlayed = simpleStorage.get('totalSongsPlayed') || 0;
    songHistory = simpleStorage.get('songHistory') || {};

    //reset
    if (playedSongs.length === SONG_DATA.length) {
        playedSongs = [];
    }

    if (playedSongs) {
        buildListeningHistory();
    }

    if (playedSongs.length > 0 || selectedTags.length > 0) {
        $landingReturnDeck.show();
        onReturnVisit();
    } else {
        $landingFirstDeck.show();
    }

    writeSkipsRemaining();
}

var resetState = function() {
    playedSongs = [];
    selectedTags = [];
    playerMode = null;

    simpleStorage.set('playedSongs', playedSongs);
    simpleStorage.set('selectedTags', selectedTags);
    simpleStorage.set('playerMode', playerMode);
    simpleStorage.set('playedPreroll', false);
}

var resetLegalLimits = function() {
    usedSkips = [];
    simpleStorage.set('usedSkips', usedSkips);
    songHistory = {}
    simpleStorage.set('songHistory', songHistory);
}

/*
 * Mark the current song as played and save state.
 */
var markSongPlayed = function(song) {
    playedSongs.push(song['id'])

    simpleStorage.set('playedSongs', playedSongs);
    updateSongsPlayed();
}

var updateSongsPlayed = function() {
    $playedSongsLength.text(playedSongs.length);
}

/*
 * Reconstruct listening history from stashed id's.
 */
var buildListeningHistory = function() {
    for (var i = 0; i < playedSongs.length; i++) {
        var songID = playedSongs[i];

        var song = _.find(SONG_DATA, function(song) {
            return songID === song['id']
        });

        var context = $.extend(APP_CONFIG, song);
        var html = JST.song(context);
        $songs.append(html);
    };
    $songs.find('.song').addClass('small');
}

/*
// PLAYLIST CREATION
*/
var buildReviewerPlaylist = function() {
    playlist = _.filter(SONG_DATA, function(song) {
        for (var i = 0; i < song['curator_tags'].length; i++) {
            if (_.contains(selectedTags, song['curator_tags'][i])) {
                return true;
            }
        }
    });

    updatePlaylistLength();
}
/*
 * Build a playlist from a set of tags.
 */
var buildGenrePlaylist = function() {
    playlist = _.filter(SONG_DATA, function(song) {
        for (var i = 0; i < song['genre_tags'].length; i++) {
            if (_.contains(selectedTags, song['genre_tags'][i])) {
                return true;
            }
        }
    });

    updatePlaylistLength();
}

var updatePlaylistLength = function() {
    $playlistLength.text(playlist.length);
    $totalSongs.text(SONG_DATA.length);
}

var resetGenreFilters = function() {
    $genreFilters.removeClass('disabled');
    selectedTags = APP_CONFIG.GENRE_TAGS.slice(0);
    simpleStorage.set('selectedTags', selectedTags);
}

var getNextReviewer = function() {
    var $nextReviewer = null;
    for (i = 0; i < $reviewerFilters.length; i++) {
        if (!($reviewerFilters.eq(i).hasClass('disabled'))) {
            if (i == $reviewerFilters.length - 1) {
                $nextReviewer = $reviewerFilters.eq(0);
            }
            else {
                $nextReviewer = $reviewerFilters.eq(i + 1);
            }
        }
    }

    $reviewerFilters.addClass('disabled');
    $nextReviewer.removeClass('disabled');
    var reviewer = $nextReviewer.data('tag');
    selectedTags = [reviewer];
    simpleStorage.set('selectedTags', selectedTags);
}

/*
 * Handle clicks on tags.
 */
var onReviewerClick = function(e) {
    e.preventDefault();
    curator = $(this).data('tag');
    $allTags.addClass('disabled');
    $(this).removeClass('disabled');

    if (isCasting) {
        CHROMECAST_SENDER.sendMessage('toggle-curator', curator);
    } else {
        toggleCurator(curator);
    }
}

var toggleCurator = function(curator) {
    selectedTags = [curator];
    simpleStorage.set('selectedTags', selectedTags);
    playedSongs = [];
    simpleStorage.set('playedSongs', playedSongs)

    buildReviewerPlaylist();
    playNextSong();

    playerMode = 'reviewer';
    simpleStorage.set('playerMode', playerMode)

    _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'curator-select', curator]);
}

var onGenreClick = function(e) {
    e.preventDefault();

    var genre = $(this).text();

    if (_.contains(selectedTags, genre)) {
        $(this).addClass('disabled');
    } else {
        $(this).removeClass('disabled');
    }

    if (isCasting) {
        CHROMECAST_SENDER.sendMessage('toggle-genre', genre);
    } else {
        toggleGenre(genre);
    }
}

var toggleGenre = function(genre) {
    // deselecting a tag
    if (_.contains(selectedTags, genre)) {
        var index = selectedTags.indexOf(genre);
        selectedTags.splice(index, 1);
        simpleStorage.set('selectedTags', selectedTags);
        buildGenrePlaylist();
    // adding a tag
    } else {
        $reviewerFilters.addClass('disabled');
        selectedTags.push(genre);
        simpleStorage.set('selectedTags', selectedTags);
        buildGenrePlaylist();
    }

    if (playlist.length < APP_CONFIG.PLAYLIST_LIMIT) {
        $playlistLengthWarning.show();
        return false;
    }
    if (playerMode != 'genre') {
        playerMode = 'genre';
        simpleStorage.set('playerMode', playerMode);
        playNextSong();
    }
}

/*
 * Highlight whichever tags are currently selected and clear all other highlights.
 */
var highlightSelectedTags = function() {
    $genreFilters.addClass('disabled');

    var $matchedTagButtons = $([]);

    for (var i = 0; i < selectedTags.length; i++) {
        var tag = selectedTags[i];

        var $filtered = $allTags.filter(function() {
            return $(this).data('tag') === tag;
        })
        $matchedTagButtons = $.merge($matchedTagButtons, $filtered);
    };

    if ($matchedTagButtons) {
        $matchedTagButtons.removeClass('disabled');
    }
}

var onShuffleSongsClick = function(e) {
    resetState();
    playerMode = 'genre';
    simpleStorage.set('playerMode', playerMode);
    resetGenreFilters();
    buildGenrePlaylist();
    playNextSong();
}

var onClearHistoryButtonClick = function(e) {
    e.preventDefault()

    $('.song:not(:last-child)').remove();
    playedSongs = [currentSong['id']];
    simpleStorage.set('playedSongs', playedSongs);
    updateSongsPlayed();
}

/*
 * Hide the welcome screen and show the playing song
 */
var hideWelcome  = function() {
    if (isCasting) {
        $chromecastScreen.show();
    }

    if (!(Modernizr.touch)) {
        $fullscreenButtons.show();
    }

    $('.songs, .player-container, .playlist-filters').show();
    $landing.velocity('slideUp', {
      duration: 1000,
        complete: function(){
            $songs.find('.song').last().velocity("scroll", { duration: 750, offset: -60 });
            $fixedHeader.velocity('fadeIn', { duration: 'slow' });
        }
    })

    onWelcome = false;
}


/*
 * Begin shuffled playback.
 */
var onGoButtonClick = function(e) {
    e.preventDefault();
    $landing.find('.poster').css('background-image', 'url(../assets/img/tape.gif)');
    $songs.find('.song').remove();

    playedSongs = [];
    simpleStorage.set('playedSongs', playedSongs);
    selectedTags = APP_CONFIG.GENRE_TAGS.slice(0);
    simpleStorage.set('selectedTags', selectedTags);

    buildGenrePlaylist();
    highlightSelectedTags();
    startPrerollAudio();
    updateSongsPlayed();

    _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'shuffle']);
}

/*
 * Begin playback where the user left off.
 */
var onReturnVisit = function() {
    $landing.find('.poster').css('background-image', 'url(../assets/img/tape.gif)');

    if (playerMode == 'reviewer') {
        buildReviewerPlaylist();
    } else {
        buildGenrePlaylist();
    }
    highlightSelectedTags();
    updateSongsPlayed();
    _.delay(hideWelcome, 5000);
    _.delay(playNextSong, 5000);
}

/*
 * Begin playback in a specific genre tag.
 */
var onLandingGenreClick = function(e) {
    e.preventDefault();
    $landing.find('.poster').css('background-image', 'url(../assets/img/tape.gif)');
    selectedTags = [$(this).data('tag')];
    simpleStorage.set('selectedTags', selectedTags);
    buildGenrePlaylist();
    highlightSelectedTags();
    startPrerollAudio();
    playerMode = 'genre';

    _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'landing-genre-select', $(this).data('tag')]);
}

/*
 * Toggle played song card size
 */
var onSongCardClick = function(e) {
    e.preventDefault();

    $(this).toggleClass('small');
}

/*
 * Handle keyboard navigation.
 */
var onDocumentKeyDown = function(e) {
    switch (e.which) {
        //right
        case 39:
            skipSong();
            break;

        // space
        case 32:
            e.preventDefault();
            if($audioPlayer.data('jPlayer').status.paused) {
                $audioPlayer.jPlayer('play');
            } else {
                $audioPlayer.jPlayer('pause');
            }

            break;
    }

    // jquery.fullpage handles actual scrolling
    return true;
}

/*
 * Enable/disable fullscreen.
 */
var onFullscreenButtonClick = function(e) {
    e.preventDefault();
    screenfull.toggle();
}

var onFullscreenChange = function() {
    if (screenfull.isFullscreen) {
        $fullscreenStop.show();
        $fullscreenStart.hide();
        _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'fullscreen-start']);
    }
    else {
        $fullscreenStop.hide();
        $fullscreenStart.show();
        _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'fullscreen-stop']);
    }
}

/*
 * Resize the welcome page to fit perfectly.
 */
var onWindowResize = function(e) {
    is_small_screen = Modernizr.mq('screen and (max-width: 480px)');
    $landing.find('.landing-wrapper').css('height', $(window).height());
    $landing.find('.poster').css('background-size', 'auto ' + $(window).height() + 'px');
    setCurrentSongHeight();

}

/*
 * Share modal opened.
 */
var onShareModalShown = function(e) {
    _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'open-share-discuss']);
}

/*
 * Share modal closed.
 */
var onShareModalHidden = function(e) {
    _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'close-share-discuss']);
}

/*
 * Text copied to clipboard.
 */
var onClippyCopy = function(e) {
    alert('Copied to your clipboard!');

    _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'summary-copied']);
}

$(onDocumentLoad);
