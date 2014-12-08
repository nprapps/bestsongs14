// Global jQuery references
var $html = null;
var $body = null;
var $shareModal = null;
var $goButton = null;
var $continueButton = null;
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
var $landing = null;
var $genreFilters = null;
var $landingGenreButtons = null;
var $playedSongsLength = null;
var $reviewerFilters = null;
var $fixedHeader = null;
var $landingReturnDeck = null;
var $landingFirstDeck = null;
var $shuffleSongs = null;
var $stack = null;
var $player = null;
var $play = null;
var $pause = null;
var $filtersButton = null;
var $filtersContainer = null;
var $currentDj = null;
var $fixedControls = null;
var $historyButton = null;

// URL params
var NO_AUDIO = (window.location.search.indexOf('noaudio') >= 0);
var RESET_STATE = (window.location.search.indexOf('resetstate') >= 0);
var ALL_HISTORY = (window.location.search.indexOf('allhistory') >= 0);

// Global state
var firstShareLoad = true;
var playedSongs = [];
var playlist = [];
var currentSong = null;
var selectedTag = null;
var playlistLength = null;
var onWelcome = true;
var playedsongCount = null;
var usedSkips = [];
var curator = null;
var totalSongsPlayed = 0;
var songHistory = {};
var songHeight = null;
var fixedHeaderHeight = null;
var is_small_screen = false
var inPreroll = false;

/*
 * Run on page load.
 */
var onDocumentLoad = function(e) {
    // Cache jQuery references
    $html = $('html');
    $body = $('body');
    $shareModal = $('#share-modal');
    $goButton = $('.go');
    $continueButton = $('.continue');
    $audioPlayer = $('#audio-player');
    $songs = $('.songs');
    $skip = $('.skip');
    $playerArtist = $('.player .artist');
    $playerTitle = $('.player .song-title');
    $allTags = $('.playlist-filters li a');
    $currentTime = $('.current-time');
    $landingGenreButtons = $('.landing .tags a');
    $playlistLength = $('.playlist-length');
    $totalSongs = $('.total-songs');
    $playlistLengthWarning = $('.warning');
    $tagsWrapper = $('.tags-wrapper');
    $landing = $('.landing');
    $genreFilters = $('.genre li a.genre-btn');
    $reviewerFilters = $('.reviewer li a');
    $fixedHeader = $('.fixed-header');
    $landingReturnDeck = $('.landing-return-deck');
    $landingFirstDeck = $('.landing-firstload-deck');
    $shuffleSongs = $('.shuffle-songs');
    $stack = $('.stack');
    $player = $('.player-container')
    $play = $('.play');
    $pause = $('.pause');
    $filtersButton = $('.js-toggle-filters');
    $filtersContainer = $('.stack .playlist-filters');
    $currentDj = $('.current-dj');
    $fixedControls = $('.fixed-controls');
    $historyButton = $('.js-show-history');
    onWindowResize();
    $landing.show();

    // Bind events
    $shareModal.on('shown.bs.modal', onShareModalShown);
    $shareModal.on('hidden.bs.modal', onShareModalHidden);
    $goButton.on('click', onGoButtonClick);
    $continueButton.on('click', onContinueButtonClick);
    $landingGenreButtons.on('click', onLandingGenreClick);
    $genreFilters.on('click', onGenreClick);
    $reviewerFilters.on('click', onReviewerClick);
    $skip.on('click', onSkipClick);
    $play.on('click', onPlayClick);
    $pause.on('click', onPauseClick);
    $filtersButton.on('click', onFiltersButtonClick);
    $(window).on('resize', onWindowResize);
    $(document).on('scroll', onDocumentScroll);
    $shuffleSongs.on('click', onShuffleSongsClick);
    $historyButton.on('click', showHistory);
    $songs.on('click', '.song:not(:last-child)', onSongCardClick);
    $songs.on('click', '.song-tools .amazon', onAmazonClick);
    $songs.on('click', '.song-tools .itunes', oniTunesClick);
    $songs.on('click', '.song-tools .rdio', onRdioClick);
    $songs.on('click', '.song-tools .spotify', onSpotifyClick);
    $songs.on('click', '.byline .reviewer-link', onReviewerLinkClick);

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
    loadState();

    setInterval(checkSkips, 60000);
}

/*
 * Shorten Bob's playlist to 3 songs for testing
 * how the end of a playlist works easier.
 */
var shortenBob = function() {
    var bobSongs = _.filter(SONG_DATA, function(song) {
        var tags = song['genre_tags'].concat(song['curator_tags']);
        for (var i = 0; i < song['curator_tags'].length; i++) {
            if (song['curator_tags'][i] === 'Bob Boilen') {
                return true;
            }
        }
    });

    bobSongs = bobSongs.splice(0, bobSongs.length - 3);
    SONG_DATA = _.difference(SONG_DATA, bobSongs);
}

/*
 * Configure jPlayer.
 */
var setupAudio = function() {
    $audioPlayer.jPlayer({
        ended: onAudioEnded,
        supplied: 'mp3',
        loop: false,
        timeupdate: onTimeUpdate,
        swfPath: APP_CONFIG.S3_BASE_URL + '/js/lib/jquery.jplayer.swf'
    });
}

var onAudioEnded = function(e) {
    var time = e.jPlayer.status.currentTime;

    if (time != 0 && time != e.jPlayer.status.duration) {
        // End fired prematurely
        console.log(e.jPlayer.status.currentTime);
        console.log(e.jPlayer.status.currentPercentAbsolute);
        console.log(e.jPlayer.status.currentPercentRelative);
        console.log(e.jPlayer.status.duration);

        // Try to restart
        $audioPlayer.jPlayer('play');
    }

    playNextSong();
}

/*
 * Update playback timer display.
 */
var onTimeUpdate = function(e) {
    var time_text = $.jPlayer.convertTime(e.jPlayer.status.currentTime);
    $currentTime.text(time_text);
};

/*
 * Start playing the preroll audio.
 */
var playIntroAudio = function() {
    var audioFile = null;

    if (onWelcome) {
        audioFile = APP_CONFIG.WELCOME_AUDIO;
    }

    if (selectedTag && !onWelcome) {
        audioFile = APP_CONFIG.TAG_AUDIO_INTROS[selectedTag];
    }

    if (!audioFile) {
        playNextSong();
        return;
    }

    inPreroll = true;

    $audioPlayer.jPlayer('setMedia', {
        mp3: 'http://podcastdownload.npr.org/anon.npr-mp3' + audioFile
    });
    $playerArtist.text('');
    $playerTitle.text('');

    if (!onWelcome) {
        $('.stack .poster').css({
            'opacity': 1,
            'display': 'block'
        });
    }

    if (!NO_AUDIO){
        $audioPlayer.jPlayer('play');
    } else {
        playNextSong();
    }
}

/*
 * Generate a reader-friendly mixtape name.
 */
var makeMixtapeName = function(song) {
    var mixtapeName = null;

    if (_.contains(APP_CONFIG.REVIEWER_TAGS, song['reviewer'])) {
        mixtapeName = song['reviewer'].split(' ')[0];

        if (mixtapeName[mixtapeName.length - 11] == 's') {
            mixtapeName += '&rsquo;'
        } else {
            mixtapeName += '&rsquo;' + 's';
        }
    }

    return mixtapeName;
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


    var context = $.extend(APP_CONFIG, nextSong, {
        'mixtapeName': makeMixtapeName(nextSong)
    });
    var $html = $(JST.song(context));
    $songs.append($html);

    $playerArtist.text(nextSong['artist']);
    $playerTitle.text(nextSong['title']);
    document.title = nextSong['artist'] + ' \u2014 \u2018' + nextSong['title'] + '\u2019 | ' + COPY.content['project_name'];

    var nextsongURL = 'http://podcastdownload.npr.org/anon.npr-mp3' + nextSong['media_url'] + '.mp3';

    inPreroll = false;

    if (!NO_AUDIO) {
        $audioPlayer.jPlayer('setMedia', {
            mp3: nextsongURL
        }).jPlayer('play');
    }
    $play.hide();
    $pause.show();

    if (onWelcome) {
        $html.css('min-height', songHeight).show();
        $html.find('.container-fluid').css('height', songHeight);

        hideWelcome();
    } else {
        $html.find('.container-fluid').css('height', songHeight);
        $html.prev().velocity("scroll", {
            duration: 350,
            offset: -fixedHeaderHeight,
            begin: function() {
                $(document).off('scroll');
            },
            complete: function() {
                $html.prev().find('.container-fluid').css('height', '0');
                $html.prev().find('.song-info').css('min-height', $html.prev().find('.song-info').outerHeight());
                $html.prev().css('min-height', '0').addClass('small');
                $html.css('min-height', songHeight)
                    .velocity('fadeIn', {
                        duration: 300,
                        complete: function(){
                            $(this).velocity("scroll", {
                                duration: 500,
                                offset: -fixedHeaderHeight,
                                delay: 300,
                                complete: function() {
                                    $('.stack .poster').velocity('fadeOut', {
                                        duration: 1000
                                    });
                                    $(document).on('scroll', onDocumentScroll);

                                    if (playedSongs.length > 1) {
                                        $historyButton.show();
                                        $historyButton.removeClass('offscreen');
                                    }
                                }
                            });
                        }
                    });
            }
        });
    }

    currentSong = nextSong;
    markSongPlayed(currentSong);
    updateTotalSongsPlayed();
    writeSkipsRemaining();
}

/*
 *  Set the height of the currently playing song to fill the viewport.
 */
var setCurrentSongHeight = function(){
    songHeight = $(window).height() - $player.height() - $fixedHeader.height() - $fixedControls.height();

    // if (is_small_screen){
    //     songHeight += $fixedHeader.height();
    // }

    $songs.children().last().find('.container-fluid').css('height', songHeight);
    $songs.children().last().find('.song-info').css('min-height', $songs.children().last().find('.song-info').outerHeight());
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
    switchTag(tag);
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
 * Play the appropriate player
 */
var onPlayClick = function(e) {
    e.preventDefault();
    $audioPlayer.jPlayer('play');
    $play.hide();
    $pause.show();
}

/*
 * Pause the appropriate player
 */
var onPauseClick = function(e) {
    e.preventDefault();
    $audioPlayer.jPlayer('pause');
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
    skipSong();
}

/*
 * Skip to the next song
 */
var skipSong = function() {
    if (inPreroll || usedSkips.length < APP_CONFIG.SKIP_LIMIT) {
        if (!inPreroll) {
            usedSkips.push(moment.utc());
            _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'song-skip', $playerArtist.text() + ' - ' + $playerTitle.text(), usedSkips.length]);
        }

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
    var skipped = true;

    while (skipped) {
        skipped = false;

        for (i = 0; i < usedSkips.length; i++) {
            if (now.subtract(1, 'hour').isAfter(usedSkips[i])) {
                usedSkips.splice(i, 1);
                skipped = true;
                break;
            }
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
        $('.skips-remaining').text(APP_CONFIG.SKIP_LIMIT - usedSkips.length + ' skip available')
        $skip.removeClass('disabled');
    }
    else if (usedSkips.length == APP_CONFIG.SKIP_LIMIT) {
        var text = 'Skipping available in ';
            text += moment(usedSkips[usedSkips.length - 1]).add(1, 'hour').fromNow(true);
        $('.skips-remaining').text(text);
        $skip.addClass('disabled');
    }
    else {
        $('.skips-remaining').text(APP_CONFIG.SKIP_LIMIT - usedSkips.length + ' skips available')
        $skip.removeClass('disabled');
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

    if (ALL_HISTORY) {
        for (var i=1; i < SONG_DATA.length; i++) {
            markSongPlayed(SONG_DATA[i]);
        }
    }

    if (playedSongs.length === SONG_DATA.length) {
        playedSongs = [];
    }

    if (playedSongs.length > 0) {
        buildListeningHistory();
    }

    if (playedSongs.length > 0 || selectedTag !== null) {
        $landingReturnDeck.show();
    } else {
        $landingFirstDeck.show();
    }

    checkSkips();
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


        var context = $.extend(APP_CONFIG, song, {
            'mixtapeName': makeMixtapeName(song)
        });
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

    var reviewer = $(this).data('tag');
    switchTag(reviewer);
    toggleFilterPanel();
}

var onReviewerLinkClick = function(e) {
    e.preventDefault();

    var reviewer = $(this).data('tag');
    switchTag(reviewer);
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
    buildPlaylist();

    if (noAutoplay !== true) {
        playIntroAudio();
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
        if (selectedTag == '\\m/ >_< \\m/') {
            var tag = selectedTag;
        } else {
            var tag = selectedTag.toUpperCase();
        }

        $currentDj.text(tag);
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
    playIntroAudio();
}

/*
 * Hide the welcome screen and show the playing song
 */
var hideWelcome  = function() {
    $('.songs, .player-container').show();

    $landing.velocity('fadeOut', {
        duration: 1000,
        begin: function() {
            $fixedHeader.show();
            $songs.find('.song').last().velocity("scroll", { duration: 750, offset: -fixedHeaderHeight });
            var stateObj = {
                foo: 'bar'
            }
        }
    })

    onWelcome = false;

    $(document).keydown(onDocumentKeyDown);
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
    playIntroAudio();

    _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'shuffle']);
}

var onContinueButtonClick = function(e) {
    e.preventDefault();
    buildPlaylist();
    updateTagDisplay();
    hideWelcome();
    playNextSong();
}

/*
 * Begin playback in a specific genre tag.
 */
var onLandingGenreClick = function(e) {
    e.preventDefault();
    swapTapeDeck();
    var tag = $(this).data('tag');
    switchTag(tag, true);
    playIntroAudio();

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
            if (!(e.altKey)) {
                skipSong();
            }
            break;
        // space
        case 32:
            e.preventDefault();
            if ($audioPlayer.data('jPlayer').status.paused) {
                $audioPlayer.jPlayer('play');
                $pause.show();
                $play.hide();
            } else {
                $audioPlayer.jPlayer('pause');
                $pause.hide();
                $play.show();
            }
            break;
    }
    return true;
}

var onAmazonClick = function(e) {
    var thisSong = getSong($(this));

    _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'amazon-click', thisSong]);

    e.stopPropagation();
}

var oniTunesClick = function(e) {
    var thisSong = getSong($(this));

    _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'itunes-click', thisSong]);

    e.stopPropagation();
}

var onRdioClick = function(e) {
    var thisSong = getSong($(this));

    _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'rdio-click', thisSong]);

    e.stopPropagation();
}

var onSpotifyClick = function(e) {
    var thisSong = getSong($(this));

    _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'spotify-click', thisSong]);

    e.stopPropagation();
}

var getSong = function($el) {
    var thisArtist = $el.parents('.song').find('.song-info .artist').text();
    var thisTitle = $el.parents('.song').find('.song-info .song-title').text();

    // cut out the smart quotes
    thisTitle = thisTitle.substring(1, thisTitle.length - 1);

    return thisArtist + ' - ' + thisTitle;
}

/*
 * Scroll to the top of the history
 */
var showHistory = function() {
    $songs.velocity('scroll');
}

/*
 * Check if play history is visible
 */
var toggleHistoryButton = function(e) {
    if (playedSongs.length < 2) {
        return;
    }

    var currentSongOffset = $songs.find('.song').last().offset().top - 50;
    var windowScrollTop = $(window).scrollTop();
    if (currentSongOffset < windowScrollTop + fixedHeaderHeight){
        $historyButton.removeClass('offscreen');
    } else {
        $historyButton.addClass('offscreen');
    }
}

/*
 * Resize the welcome page to fit perfectly.
 */
var onWindowResize = function(e) {
    var height = $(window).height();
    var width = (height * 3) / 2;
    fixedHeaderHeight = parseInt($html.css('font-size')) * 4;

    is_small_screen = Modernizr.mq('screen and (max-width: 767px)');
    $landing.find('.landing-wrapper').css('height', $(window).height());
    setCurrentSongHeight();
}

/*
 * Document scrolled
 */
var onDocumentScroll = _.throttle(function(e) {
    toggleHistoryButton();
}, 200);

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
