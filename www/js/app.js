// Global jQuery references
var $body = null;
var $shareModal = null;
var $commentCount = null;
var $goButton = null;
var $audioPlayer = null;
var $playerArtist = null;
var $playerTitle = null;
var $currentTime = null;
var $allTags = null;
var $reviewerButtons = null;
var $playlistLength = null;
var $skip = null;
var $songs = null;
var $playlistLengthWarning = null;
var $fullscreenStart = null;
var $fullscreenStop = null;
var $castStart = null;
var $castStop = null;
var $landing = null;
var $genreFilters = null;
var $playedSongsLength = null;
var $clearHistory = null;
var $reviewerFilters = null;
var $fixedHeader = null;
var $landingReturnDeck = null;
var $landingFirstDeck = null;


// Global state
var IS_CAST_RECEIVER = (window.location.search.indexOf('chromecast') >= 0);
var NO_AUDIO = (window.location.search.indexOf('noaudio') >= 0);
var RESET_STATE = (window.location.search.indexOf('resetstate') >= 0);

var firstShareLoad = true;
var playedSongs = [];
var playlist = [];
var currentSong = null;
var selectedTags = [];
var playlistLength = 250;
var onWelcome = true;
var isCasting = false;
var playedsongCount = null;
var usedSkips = [];
var playerMode = null;

/*
 * Run on page load.
 */
var onDocumentLoad = function(e) {
    // Cache jQuery references
    $body = $('body');
    $shareModal = $('#share-modal');
    $commentCount = $('.comment-count');
    $goButton = $('.go');
    $audioPlayer = $('#audio-player');
    $songs = $('.songs');
    $skip = $('.skip');
    $playerArtist = $('.player .artist');
    $playerTitle = $('.player .song-title');
    $allTags = $('.playlist-filters.tags li a');
    $currentTime = $('.current-time');
    $genreButtons = $('.landing .tags a');
    $playlistLength = $('.playlist-length');
    $totalSongs = $('.total-songs');
    $playlistLengthWarning = $('.warning');
    $fullscreenStart = $('.fullscreen .start');
    $fullscreenStop = $('.fullscreen .stop');
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

    // Bind events
    $shareModal.on('shown.bs.modal', onShareModalShown);
    $shareModal.on('hidden.bs.modal', onShareModalHidden);
    $goButton.on('click', onGoButtonClick);
    $genreButtons.on('click', onGenreButtonClick);
    $genreFilters.on('click', onGenreClick);
    $reviewerFilters.on('click', onReviewerClick);
    $skip.on('click', onSkipClick);
    $fullscreenStart.on('click', onFullscreenButtonClick);
    $fullscreenStop.on('click', onFullscreenButtonClick);
    $castStart.on('click', onCastStartClick);
    $castStop.on('click', onCastStopClick);
    $(window).on('resize', onWindowResize);
    $(document).keydown(onDocumentKeyDown);
    $clearHistory.on('click', onClearHistoryButtonClick);
    $(document).on(screenfull.raw.fullscreenchange, onFullscreenChange);

    // configure ZeroClipboard on share panel
    ZeroClipboard.config({ swfPath: 'js/lib/ZeroClipboard.swf' });
    var clippy = new ZeroClipboard($(".clippy"));

    clippy.on('ready', function(readyEvent) {
        clippy.on('aftercopy', onClippyCopy);
    });

    onWindowResize();

    SONG_DATA = _.shuffle(SONG_DATA);

    if (IS_CAST_RECEIVER) {
        CHROMECAST_RECEIVER.setup();
    }

    if (RESET_STATE) {
        resetState();
    }

    setupAudio();
    loadState();
    setInterval(checkSkips, 1000);
}

/*
 * Setup Chromecast if library is available.
 */
window['__onGCastApiAvailable'] = function(loaded, errorInfo) {
    console.log(1);
    // We need the DOM here, so don't fire until it's ready.
    $(function() {
        // Don't init sender if in receiver mode
        if (IS_CAST_RECEIVER ) {
            return;
        }

        if (loaded) {
            console.log('loaded');
            CHROMECAST_SENDER.setup(onCastReady, onCastStarted, onCastStopped);
            $chromecastStart.show();
            $chromecastStop.hide();
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
    // TODO: stop audio, hide player

    $fullscreenStart.hide();
    $fullscreenStop.hide();
    $castStart.hide();
    $castStop.show();

    //$chromecastScreen.show();

    isCasting = true;
}

/*
 * A cast session stopped.
 */
var onCastStopped = function() {
    //$chromecastScreen.hide();

    // TODO: start playing locally

    isCasting = false;
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
    if (simpleStorage.get('loadedPreroll')) {
        playNextSong();
        return;
    }
    if (!NO_AUDIO){
        $audioPlayer.jPlayer('play');
    }

    simpleStorage.set('loadedPreroll', true);
}

/*
 * Play the next song in the playlist.
 */
var playNextSong = function() {
    var nextSong = _.find(playlist, function(song) {
        return !(_.contains(playedSongs, song['id']));
    });
    if (!nextSong) {
        if (playedSongs.length == SONG_DATA.length) {
            resetState();
        }

        if (playerMode == 'genre') {
            resetGenreFilters();
            playlist = buildPlaylist(selectedTags);
            updatePlaylistLength();
            playNextSong();
            return;
        }
        if (playerMode == 'reviewer') {
            reviewer = getNextReviewer();
            playlist = getReviewerMixtape(reviewer)
            updatePlaylistLength();
            playNextSong();
            return;
        }
    }

    if (nextSong) {
        var context = $.extend(APP_CONFIG, nextSong);
        var html = JST.song(context);
        $songs.append(html);

        if (!onWelcome) {
            $songs.find('.song').last().velocity("scroll", { duration: 750, offset: -60 });
        }

        $playerArtist.text(nextSong['artist'])
        $playerTitle.text(nextSong['title'])

        var nextsongURL = APP_CONFIG.S3_BASE_URL + "/assets/songs/" + nextSong['mp3_file'];

        if (!NO_AUDIO){
            $audioPlayer.jPlayer('setMedia', {
                mp3: nextsongURL
            }).jPlayer('play');
        }

        if (onWelcome) {
            hideWelcome();
        }
        currentSong = nextSong;
        markSongPlayed(currentSong);
    }
}

/*
 * Skip the current song.
 */
var onSkipClick = function(e) {
    e.preventDefault();
    skipSong();
}

var skipSong = function() {
    if (usedSkips.length < APP_CONFIG.SKIP_LIMIT) {
        usedSkips.push(moment.utc());
        playNextSong();
        simpleStorage.set('usedSkips', usedSkips);
        writeSkipsRemaining();
    }
}

var checkSkips = function() {
    var now = moment.utc();
    for (i = 0; i < usedSkips.length; i++) {
        if (now.subtract(1, 'minute').isAfter(usedSkips[i])) {
            console.log('found an old timestamp');
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

    // playedSongs = [];
    playedSongs = simpleStorage.get('playedSongs') || [];
    selectedTags = simpleStorage.get('selectedTags') || [];
    usedSkips = simpleStorage.get('usedSkips') || [];


    //reset
    if (playedSongs.length === SONG_DATA.length) {
        playedSongs = [];
    }

    if (playedSongs) {
        buildListeningHistory();
    }

    if (playedSongs.length > 0 || selectedTags.length > 0) {
        onReturnVisit();
    }

    writeSkipsRemaining();
}

var resetState = function() {
    playedSongs = [];
    selectedTags = [];
    usedSkips = [];

    simpleStorage.set('playedSongs', playedSongs);
    simpleStorage.set('selectedTags', selectedTags);
    simpleStorage.set('usedSkips', usedSkips);
}

/*
 * Mark the current song as played and save state.
 */
var markSongPlayed = function(song) {
    playedSongs.push(song['id'])

    simpleStorage.set('playedSongs', playedSongs);
    updateSongsPlayed();
}

var updateSongsPlayed = function(reset) {
    if (reset == true) {
        playedsongCount = 1;
    } else {
        playedsongCount = playedSongs.length;
    }
    $playedSongsLength.text(playedsongCount)
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
}

/*
// PLAYLIST CREATION
*/
var getReviewerMixtape = function(reviewer) {
    return _.filter(SONG_DATA, function(song) {
        if (song['reviewer'] == reviewer) {
            return true;
        }
    });

}
/*
 * Build a playlist from a set of tags.
 */
var buildPlaylist = function(tags) {
    return _.filter(SONG_DATA, function(song) {
        for (var i = 0; i < song['tags'].length; i++) {
            if (_.contains(tags, song['tags'][i])) {
                return true;
            }
        }
    });
}

var updatePlaylistLength = function() {
    playlistLength = playlist.length;
    $playlistLength.text(playlistLength);
}

var resetGenreFilters = function() {
    $genreFilters.removeClass('disabled');
    selectedTags = APP_CONFIG.GENRE_TAGS;
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
    return $nextReviewer.text();
}

/*
 * Handle clicks on tags.
 */
var onReviewerClick = function(e) {
    e.preventDefault();
    $allTags.addClass('disabled');
    selectedTags = [];
    simpleStorage.set('selectedTags', selectedTags);

    var reviewer = $(this).text();

    playlist = getReviewerMixtape(reviewer);
    updatePlaylistLength();
    playNextSong();
    $(this).removeClass('disabled');

    playerMode = 'reviewer';
}

var onGenreClick = function(e) {
    e.preventDefault();

    var tag = $(this).text();

    // deselecting a tag
    if (_.contains(selectedTags, tag)) {
        var index = selectedTags.indexOf(tag);
        selectedTags.splice(index, 1);
        simpleStorage.set('selectedTags', selectedTags);
        $(this).addClass('disabled');

        playlist = buildPlaylist(selectedTags);
        updatePlaylistLength();

        if (playlist.length < APP_CONFIG.PLAYLIST_LIMIT) {
            $playlistLengthWarning.show();
            return false;
        }
    // adding a tag
    } else {
        selectedTags.push(tag);
        simpleStorage.set('selectedTags', selectedTags);
        playlist = buildPlaylist(selectedTags);
        updatePlaylistLength();

        $audioPlayer.jPlayer('play');
        $playlistLengthWarning.hide();

        $(this).removeClass('disabled');
    }

    playerMode = 'genre';
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


var onClearHistoryButtonClick = function(e) {
    e.preventDefault()
    $('.song').slice(0,playedsongCount-1).remove();
    playedSongs = [currentSong['id']];
    updateSongsPlayed(true);
}

/*
 * Hide the welcome screen and show the playing song
 */
var hideWelcome  = function() {
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

    $songs.find('.song').remove();
    playedSongs = [];
    simpleStorage.set('playedSongs', playedSongs);
    playlist = SONG_DATA;
    selectedTags = APP_CONFIG.GENRE_TAGS;
    simpleStorage.set('selectedTags', selectedTags);
    highlightSelectedTags();
    updatePlaylistLength();
    startPrerollAudio();
    updateSongsPlayed(true);
}

/*
 * Begin playback where the user left off.
 */
var onReturnVisit = function() {
    playlist = buildPlaylist(selectedTags);
    highlightSelectedTags();
    updatePlaylistLength();
    updateSongsPlayed();
    $landingFirstDeck.hide();
    $landingReturnDeck.show();
    _.delay(hideWelcome, 5000);
    _.delay(playNextSong, 5000);
}

/*
 * Begin playback in a specific genre tag.
 */
var onGenreButtonClick = function(e) {
    e.preventDefault();

    selectedTags = [$(this).data('tag')];
    simpleStorage.set('selectedTags', selectedTags);
    playlist = buildPlaylist(selectedTags);
    highlightSelectedTags();
    updatePlaylistLength();
    startPrerollAudio();
    playerMode = 'genre';
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

    _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'fullscreen']);

    screenfull.toggle();
}

var onFullscreenChange = function() {
    if (screenfull.isFullscreen) {
        $fullscreenStop.show();
        $fullscreenStart.hide();
    }
    else {
        $fullscreenStop.hide();
        $fullscreenStart.show();
    }
}

/*
 * Resize the welcome page to fit perfectly.
 */
var onWindowResize = function(e) {
    $landing.find('.landing-wrapper').css('height', $(window).height());
    $landing.find('.poster').css('background-size', 'auto ' + $(window).height() + 'px');
}

/*
 * Display the comment count.
 */
var showCommentCount = function(count) {
    $commentCount.text(count);

    if (count > 0) {
        $commentCount.addClass('has-comments');
    }

    if (count > 1) {
        $commentCount.next('.comment-label').text('Comments');
    }
}

/*
 * Share modal opened.
 */
var onShareModalShown = function(e) {
    _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'open-share-discuss']);

    if (firstShareLoad) {
        loadComments();

        firstShareLoad = false;
    }
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
