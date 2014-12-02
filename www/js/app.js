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
var $currentDj = null;
var $fixedControls = null;

// URL params
var pathArray = window.location.pathname.split('/');
var IS_CAST_RECEIVER = pathArray[1] == 'chromecast';
var NO_AUDIO = (window.location.search.indexOf('noaudio') >= 0);
var RESET_STATE = (window.location.search.indexOf('resetstate') >= 0);
var IS_FAKE_CASTER = (window.location.search.indexOf('fakecast') >= 0);

// Global state
var firstShareLoad = true;
var playedSongs = [];
var playlist = [];
var currentSong = null;
var selectedTag = null;
var playlistLength = null;
var onWelcome = true;
var isCasting = false;
var playedsongCount = null;
var usedSkips = [];
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
    $currentDj = $('.current-dj');
    $fixedControls = $('.fixed-controls');
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
    $songs.on('click', '.song-tools .amazon', onAmazonClick);
    $songs.on('click', '.song-tools .itunes', oniTunesClick);
    $songs.on('click', '.song-tools .rdio', onRdioClick);
    $songs.on('click', '.song-tools .spotify', onSpotifyClick);

    // configure ZeroClipboard on share panel
    ZeroClipboard.config({ swfPath: 'js/lib/ZeroClipboard.swf' });
    var clippy = new ZeroClipboard($(".clippy"));

    clippy.on('ready', function(readyEvent) {
        clippy.on('aftercopy', onClippyCopy);
    });

    // set up the app
    shuffleSongs();

    if (RESET_STATE) {
        resetState();
        resetLegalLimits();
    }

    setupAudio();

    if (IS_CAST_RECEIVER) {
        playlist = SONG_DATA;
        resetGenreFilters();
        _.delay(playNextSong, 500);

        // messages that are sent on click
        // CHROMECAST_RECEIVER.onMessage('toggle-audio', onCastReceiverToggleAudio);
        // CHROMECAST_RECEIVER.onMessage('skip-song', onCastReceiverSkipSong);
        // CHROMECAST_RECEIVER.onMessage('toggle-genre', onCastReceiverToggleGenre);
        // CHROMECAST_RECEIVER.onMessage('toggle-curator', onCastReceiverToggleCurator);

        // messages that are sent immediately
        // CHROMECAST_RECEIVER.onMessage('send-playlist', onCastReceiverPlaylist);
        // CHROMECAST_RECEIVER.onMessage('send-tags', onCastReceiverTags);
        // CHROMECAST_RECEIVER.onMessage('send-history', onCastReceiverHistory);
        // CHROMECAST_RECEIVER.onMessage('send-played', onCastReceiverPlayed);

        // CHROMECAST_RECEIVER.onMessage('init', onCastReceiverInit);

        // CHROMECAST_RECEIVER.setup();
    } else {
        loadState();
    }
    setInterval(checkSkips, 1000);
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

            if (IS_FAKE_CASTER) {
              onCastStarted();
            }

        } else {
            // TODO: prompt to install?
        }
    });
}
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

    CHROMECAST_SENDER.sendMessage('send-tags', JSON.stringify(selectedTag));
    CHROMECAST_SENDER.sendMessage('send-playlist', JSON.stringify(playlist));
    CHROMECAST_SENDER.sendMessage('send-history', JSON.stringify(songHistory));
    CHROMECAST_SENDER.sendMessage('send-played', JSON.stringify(playedSongs));
    CHROMECAST_SENDER.sendMessage('init');

    CHROMECAST_SENDER.onMessage('genre-ended', onCastGenreEnded);
    CHROMECAST_SENDER.onMessage('reviewer-ended', onCastReviewerEnded);
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

/*
 * Toggle audio on Chromecast receiver
 */
var onCastReceiverToggleAudio = function(message) {
    if (message === 'play') {
        $audioPlayer.jPlayer('play');
    } else {
        $audioPlayer.jPlayer('pause');
    }
}

/*
 * Skip song on Chromecast receiver
 */
var onCastReceiverSkipSong = function() {
    skipSong();
}

/*
 * Toggle genre on Chromecast receiver
 */
var onCastReceiverToggleGenre = function(message) {
    toggleGenre(message);
}

/*
 * Toggle curator on Chromecast receiver
 */
var onCastReceiverToggleCurator = function(message) {
    selectedTag = message;
    toggleCurator(message);
}

/*
 * Set playlist on Chromecast receiver
 */
var onCastReceiverPlaylist = function(message) {
    playlist = JSON.parse(message);
}

/*
 * Set tags on Chromecast receiver
 */
var onCastReceiverTags = function(message) {
    selectedTag = JSON.parse(message);
}

/*
 * Set song history on Chromecast receiver
 */
var onCastReceiverHistory = function(message) {
    songHistory = JSON.parse(message);
}

/*
 * Set played songs on Chromecast receiver
 */
 var onCastReceiverPlayed = function(message) {
    playedSongs = JSON.parse(message);

    // everything comes back as a string, should be ints
    for (i = 0; i < playedSongs.length; i++) {
        playedSongs[i] = parseInt(playedSongs[i]);
    }
}

/*
 * Start the player on the cast receiver
 */
var onCastReceiverInit = function() {
    _.delay(playNextSong, 1000);
}

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
            // animations on Chromecast are so sloooow
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
    songHeight = $(window).height() - $player.height() - $fixedHeader.height() - $fixedControls.height();

    if (is_small_screen){
        songHeight += $fixedHeader.height();
    }

    $songs.children().last().find('.container-fluid').css('height', songHeight);
}

/*
 * Check the song history to see if you've played it
 * more than 4 times in 3 hours
 */
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

/*
 * Get the next playlist when one is finished
 */
var nextPlaylist = function() {
    if (playedSongs.length == SONG_DATA.length) {
        // if all songs have been played, reset to shuffle
        resetState();
    }

    _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'tag-finish', selectedTag]);
    var tag = null;

    if (selectedTag === null || _.contains(APP_CONFIG.GENRE_TAGS, selectedTag)) {
        // go to shuffle
    } else {
        tag = getNextReviewer();
    }
    switchTag(tag, true);
    playPlaylistEndAudio();
}


/*
 * Update the total songs played
 */
var updateTotalSongsPlayed = function() {
    totalSongsPlayed++;
    simpleStorage.set('totalSongsPlayed', totalSongsPlayed);

    if (totalSongsPlayed % 5 === 0) {
        _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'songs-played', '', totalSongsPlayed]);
    }
}

/*
 * Play audio when you've reached the end of a playlist
 */
var playPlaylistEndAudio = function() {
    var playlistEndAudioURL = APP_CONFIG.S3_BASE_URL + "/assets/ocean_breeze.mp3";

    if (!NO_AUDIO){
        $audioPlayer.jPlayer('setMedia', {
            mp3: playlistEndAudioURL
        }).jPlayer('play');
    }
}

/*
 * Play the appropriate player
 */
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

/*
 * Pause the appropriate player
 */
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
 * Toggle filter panel
 */
var onFiltersButtonClick = function(e) {
    e.preventDefault();
    toggleFilterPanel();
}

var toggleFilterPanel = function() {
    if (!$fixedControls.hasClass('expand')) {
        $fixedControls.addClass('expand');
    } else {
        $fixedControls.removeClass('expand');
    }
}


/*
 * Handle clicks on the skip button.
 */
var onSkipClick = function(e) {
    e.preventDefault();
    if (isCasting) {
        CHROMECAST_SENDER.sendMessage('skip-song');
    } else {
        skipSong();
    }
}

/*
 * Skip to the next song
 */
var skipSong = function() {
    if (usedSkips.length < APP_CONFIG.SKIP_LIMIT) {
        usedSkips.push(moment.utc());
        _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'song-skip', $playerArtist.text(), usedSkips.length]);
        playNextSong();
        simpleStorage.set('usedSkips', usedSkips);
        writeSkipsRemaining();

    }
}

/*
 * Check to see if some skips are past the skip limit window
 */
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

/*
 * Update the skip limit display
 */
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
 * Load state from browser storage
 */
var loadState = function() {
    playedSongs = simpleStorage.get('playedSongs') || [];
    selectedTag = simpleStorage.get('selectedTag') || null;
    usedSkips = simpleStorage.get('usedSkips') || [];
    totalSongsPlayed = simpleStorage.get('totalSongsPlayed') || 0;
    songHistory = simpleStorage.get('songHistory') || {};

    if (playedSongs.length === SONG_DATA.length) {
        playedSongs = [];
    }

    if (playedSongs.length > 0) {
        buildListeningHistory();
    }

    if (playedSongs.length > 0 || selectedTag !== null) {
        $landingReturnDeck.show();
        onReturnVisit();
    } else {
        $landingFirstDeck.show();
    }

    writeSkipsRemaining();
}

/*
 * Reset everything we can legally reset
 */
var resetState = function() {
    playedSongs = [];
    selectedTag = null;

    simpleStorage.set('playedSongs', playedSongs);
    simpleStorage.set('selectedTag', selectedTag);
    simpleStorage.set('playedPreroll', false);
}

/*
 * Reset the legal limitations. For development only.
 */
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
 * Build a playlist from a set of tags.
 */
var buildPlaylist = function() {
    if (selectedTag === null) {
        playlist = SONG_DATA;
    } else {
        playlist = _.filter(SONG_DATA, function(song) {
            var tags = song['genre_tags'].concat(song['curator_tags']);

            for (var i = 0; i < tags.length; i++) {
                if (selectedTag === tags[i]) {
                    return true;
                }
            }
        });
    }
    updatePlaylistLength();
}

var shuffleSongs = function() {
    SONG_DATA = _.shuffle(SONG_DATA);
}

/*
 * Update playlist length display.
 */
var updatePlaylistLength = function() {
    $playlistLength.text(playlist.length);
    $totalSongs.text(SONG_DATA.length);
}

/*
 * Cycle to the next curator in the list.
 */
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
    return $nextReviewer.data('tag');
}

/*
 * Handle clicks on curators.
 */
var onReviewerClick = function(e) {
    e.preventDefault();

    var reviewer = $(this).data('tag')
    switchTag(reviewer);
    toggleFilterPanel();
}

/*
 * Handle clicks on genre buttons
 */
var onGenreClick = function(e) {
    e.preventDefault();

    var genre = $(this).data('tag');
    switchTag(genre);
    toggleFilterPanel();
}

var switchTag = function(tag, noAutoplay) {
    if (selectedTag === tag && tag !== null) {
        return;
    } else {
        selectedTag = tag;
        simpleStorage.set('selectedTag', selectedTag);
    }

    updateTagDisplay();
    shuffleSongs();

    if (isCasting) {
        CHROMECAST_SENDER.sendMessage('switch-tag', selectedTag);
    } else {
        buildPlaylist();
        if (noAutoplay !== true) {
            playNextSong();
        }
    }
}

/*
 * Highlight whichever tags are currently selected and clear all other highlights.
 */
var updateTagDisplay = function() {
    $allTags.addClass('disabled');
    $allTags.filter('[data-tag="' + selectedTag + '"]').removeClass('disabled');

    if (selectedTag === null) {
        $currentDj.text('All our favorite songs');
        $shuffleSongs.removeClass('disabled');
    } else {
        $currentDj.text(selectedTag);
    }
}

/*
 * Shuffle all the songs.
 */
var onShuffleSongsClick = function(e) {
    e.preventDefault();

    shuffleSongs();
    resetState();
    toggleFilterPanel();
    updateTagDisplay();
    buildPlaylist();
    playNextSong();
}

/*
 * Clear displayed history of played songs (but not the legal limits).
 */
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

    $('.songs, .player-container').show();
    $landing.velocity('slideUp', {
      duration: 1000,
        complete: function(){
            $songs.find('.song').last().velocity("scroll", { duration: 750, offset: -60 });
            $fixedHeader.velocity('fadeIn', { duration: 'slow' });
        }
    })

    onWelcome = false;
}

var swapTapeDeck = function() {
    $landing.find('.poster-static').css('opacity', 0);
    $landing.find('.poster').css('opacity', 1);
    $landing.addClass('start');
}


/*
 * Begin shuffled playback.
 */
var onGoButtonClick = function(e) {
    e.preventDefault();
    swapTapeDeck();
    $songs.find('.song').remove();


    playedSongs = [];
    simpleStorage.set('playedSongs', playedSongs);
    switchTag(null, true);
    startPrerollAudio();

    _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'shuffle']);
}

/*
 * Begin playback where the user left off.
 */
var onReturnVisit = function() {
    swapTapeDeck();

    buildPlaylist();
    updateTagDisplay();
    updateSongsPlayed();
    _.delay(hideWelcome, 5000);
    _.delay(playNextSong, 5000);
}

/*
 * Begin playback in a specific genre tag.
 */
var onLandingGenreClick = function(e) {
    e.preventDefault();
    swapTapeDeck();
    var tag = $(this).data('tag');
    switchTag(tag, true);
    startPrerollAudio();

    _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'landing-genre-select', $(this).data('tag')]);
}

/*
 * Toggle played song card size
 */
var onSongCardClick = function(e) {
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
            if ($audioPlayer.data('jPlayer').status.paused) {
                $audioPlayer.jPlayer('play');
            } else {
                $audioPlayer.jPlayer('pause');
            }
            break;
    }
    return true;
}

/*
 * Handle fullscreen button click.
 */
var onFullscreenButtonClick = function(e) {
    e.preventDefault();
    screenfull.toggle();
}

/*
 * Change the fullscreen state.
 */
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

var onAmazonClick = function(e) {
    var thisArtist = getArtist($(this));

    _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'amazon-click', thisArtist]);

    e.stopPropagation();
}

var oniTunesClick = function(e) {
    var thisArtist = getArtist($(this));

    _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'itunes-click', thisArtist]);

    e.stopPropagation();
}

var onRdioClick = function(e) {
    var thisArtist = getArtist($(this));

    _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'rdio-click', thisArtist]);

    e.stopPropagation();
}

var onSpotifyClick = function(e) {
    var thisArtist = getArtist($(this));

    _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'spotify-click', thisArtist]);

    e.stopPropagation();
}

var getArtist = function($el) {
    var thisArtist = $el.parents('.song').find('.song-info .artist').text();

    return thisArtist;
}

/*
 * Resize the welcome page to fit perfectly.
 */
var onWindowResize = function(e) {
    is_small_screen = Modernizr.mq('screen and (max-width: 480px)');
    $landing.find('.landing-wrapper').css('height', $(window).height());
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
