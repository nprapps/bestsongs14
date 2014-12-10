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
var $playlistLength = null;
var $totalSongs = null;
var $skip = null;
var $songs = null;
var $landing = null;
var $genreFilters = null;
var $reviewerFilters = null;
var $filtersPanel = null;
var $fixedHeader = null;
var $landingReturnDeck = null;
var $landingFirstDeck = null;
var $shuffleSongs = null;
var $player = null;
var $play = null;
var $pause = null;
var $filtersButton = null;
var $currentDj = null;
var $fixedControls = null;
var $historyButton = null;
var $skipsRemaining = null;

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
var firstReviewerSong = false;

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
    $playlistLength = $('.playlist-length');
    $totalSongs = $('.total-songs');
    $tagsWrapper = $('.tags-wrapper');
    $landing = $('.landing');
    $genreFilters = $('.genre li a.genre-btn');
    $reviewerFilters = $('.reviewer li a');
    $filtersPanel = $('.playlist-filters');
    $fixedHeader = $('.fixed-header');
    $landingReturnDeck = $('.landing-return-deck');
    $landingFirstDeck = $('.landing-firstload-deck');
    $shuffleSongs = $('.shuffle-songs');
    $player = $('.player-container')
    $play = $('.play');
    $pause = $('.pause');
    $filtersButton = $('.js-toggle-filters');
    $currentDj = $('.current-dj');
    $fixedControls = $('.fixed-controls');
    $historyButton = $('.js-show-history');
    $skipsRemaining = $('.skips-remaining');
    onWindowResize();
    $landing.show();

    // Bind events
    $shareModal.on('shown.bs.modal', onShareModalShown);
    $shareModal.on('hidden.bs.modal', onShareModalHidden);
    $goButton.on('click', onGoButtonClick);
    $continueButton.on('click', onContinueButtonClick);
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
    $landing.on('click', '.poster.shrink', onFilterTipClick);

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

    // if on welcome screen, play the intro audio
    if (onWelcome) {
        audioFile = APP_CONFIG.WELCOME_AUDIO;
    }

    // if we have a selected tag, find its audio
    if (selectedTag && !onWelcome) {
        audioFile = APP_CONFIG.TAG_AUDIO_INTROS[selectedTag];
    }

    // if there is no audio (i.e. genres), just play the next song
    if (!audioFile) {
        playNextSong();
        return;
    }

    inPreroll = true;

    if (!onWelcome) {
        $('.stack .poster').velocity('fadeIn');
        $skipsRemaining.hide();
    }

    $audioPlayer.jPlayer('setMedia', {
        mp3: 'http://podcastdownload.npr.org/anon.npr-mp3' + audioFile
    });
    $playerArtist.text('');
    $playerTitle.text('');

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

    if (selectedTag !== song['reviewer']) {
        if (_.contains(APP_CONFIG.REVIEWER_TAGS, song['reviewer'])) {
            mixtapeName = song['reviewer'].split(' ')[0];

            if (mixtapeName[mixtapeName.length - 11] == 's') {
                mixtapeName += '&rsquo;'
            } else {
                mixtapeName += '&rsquo;' + 's';
            }
        }
    }

    return mixtapeName;
}

/*
 * Play the next song in the playlist.
 */
var playNextSong = function() {
    // if this is the first song in a curator playlist
    // get one reviewed by the curator
    var nextSong = _.find(playlist, function(song) {
        if (!firstReviewerSong) {
            return !(_.contains(playedSongs, song['id']));
        } else {
            return !(_.contains(playedSongs, song['id'])) && song['reviewer'] === selectedTag;
        }
    });

    // some mixtape curators have not reviewed anything
    // in this case, just use the normal filter
    if (firstReviewerSong && !nextSong) {
        var nextSong = _.find(playlist, function(song) {
            return !(_.contains(playedSongs, song['id']));
        });
    }

    firstReviewerSong = false;

    // check if we can play the song legally (4 times per 3 hours)
    // if we don't have a song, get a new playlist
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

    $playerArtist.html(nextSong['artist']);
    $playerTitle.html(nextSong['title']);
    document.title = nextSong['artist'] + ' \u2014 \u2018' + nextSong['title'] + '\u2019 | ' + COPY.content['project_name'];
    $skipsRemaining.show();

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
        setCurrentSongHeight();
        $html.find('.container-fluid').css('height', songHeight);
        $html.prev().velocity("scroll", {
            duration: 350,
            offset: -fixedHeaderHeight,
            begin: function() {
                $(document).off('scroll');
            },
            complete: function() {
                $('.stack .poster').velocity('fadeOut', {
                    duration: 500
                });
                $html.prev().find('.container-fluid').css('height', '0');
                $html.prev().find('.song-info').css('min-height', 0);
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
    preloadSongImages();
}

/*
 * Preload song art and reviewer headshot to make things smoother.
 */
var preloadSongImages = function() {
    var nextSong = _.find(playlist, function(song) {
        return !(_.contains(playedSongs, song['id']));
    });

    if (!nextSong) {
        return;
    }

    var songArt = new Image();
    songArt.src = 'http://npr.org' + nextSong['song_art'];

    var reviewerImage = new Image();
    reviewerImage.src = APP_CONFIG.S3_BASE_URL + '/assets/img/' + APP_CONFIG.REVIEWER_IMAGES[nextSong['reviewer']];
}

/*
 *  Set the height of the currently playing song to fill the viewport.
 */
var setCurrentSongHeight = function(){
    windowHeight = Modernizr.touch ? window.innerHeight || $(window).height() : $(window).height();
    songHeight = windowHeight - $player.height() - $fixedHeader.height() - $fixedControls.height();

    $songs.children().last().find('.container-fluid').css('height', songHeight);
    $songs.children().last().css('min-height', songHeight);
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
        firstReviewerSong = true;
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
 * Play the song, show the pause button
 */
var onPlayClick = function(e) {
    e.preventDefault();
    $audioPlayer.jPlayer('play');
    $play.hide();
    $pause.show();
}

/*
 * Pause the song, show the play button
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
    $filtersPanel.scrollTop(0);
}

var onFilterTipClick = function(e) {
    e.preventDefault();
    toggleFilterPanel();
    $(this).velocity('fadeOut', {
        duration: 300
    });
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
        $skipsRemaining.text(APP_CONFIG.SKIP_LIMIT - usedSkips.length + ' skip available')
        $skip.removeClass('disabled');
    }
    else if (usedSkips.length == APP_CONFIG.SKIP_LIMIT) {
        var text = 'Skipping available in ';
            text += moment(usedSkips[usedSkips.length - 1]).add(1, 'hour').fromNow(true);
        $skipsRemaining.text(text);
        $skip.addClass('disabled');
    }
    else {
        $skipsRemaining.text(APP_CONFIG.SKIP_LIMIT - usedSkips.length + ' skips available')
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


/*
 * Shuffle the entire list of songs.
 */
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
    console.log(reviewer);
    firstReviewerSong = true;
    switchTag(reviewer);
    toggleFilterPanel();
}

/*
 * Handle clicks on inline reviewer links in song jst.
 */
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

/*
 * Switch the selectedTag, update the display and build the new playlist
 */
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
    preloadSongImages();

    if (noAutoplay !== true) {
        playIntroAudio();
    }

    _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'switch-tag', selectedTag]);
}

/*
 * Highlight whichever tags are currently selected and clear all other highlights.
 */
var updateTagDisplay = function() {
    $allTags.addClass('disabled');
    $allTags.filter('[data-tag="' + selectedTag + '"]').removeClass('disabled');

    if (selectedTag === null) {
        var allSongsText = 'All our favorite songs'.toUpperCase();
        $currentDj.text(allSongsText);
        $shuffleSongs.removeClass('disabled');
    } else {
        var tag = null;
        if (selectedTag == '\\m/ >_< \\m/') {
            tag = selectedTag;
        } else {
            tag = selectedTag

            if (_.contains(APP_CONFIG.REVIEWER_TAGS, selectedTag)) {
                if (selectedTag[selectedTag.length - 1] == 's') {
                    tag += '\u2019 Mixtape'
                } else {
                    tag += '\u2019' + 's Mixtape';
                }
            }
            tag = tag.toUpperCase();
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
    $fixedHeader.show();
    setCurrentSongHeight();

    $songs.find('.song').last().velocity("scroll", { duration: 750, offset: -fixedHeaderHeight });

    $landing.velocity({
        bottom: '5rem',
        height: '4rem',
    }, {
        duration: 1000,
        timing: 'ease-in-out',
        begin: function() {
            $('.landing-wrapper').hide().css('height', '');
            $(this).find('.tip-three').removeClass('show');
            $(this).find('.done').velocity('fadeIn', {
                delay: 500
            });
            $(this).find('.poster').addClass('shrink');
        },
        complete: function() {
            $landing.velocity('fadeOut', {
                delay: 4000,
                duration: 1000,
                complete: function() {
                    $('.poster').removeClass('shrink').attr('style','');
                }
            });
        }
    });

    onWelcome = false;

    $(document).keydown(onDocumentKeyDown);
}

/*
 * Animate the tape deck after landing click
 */
var swapTapeDeck = function() {
    $landing.find('.poster-static').css('opacity', 0);
    $landing.find('.poster').css('opacity', 1);
    $landing.addClass('start');

    $landing.find('.tip-one').addClass('show');

    _.delay(function() {
        $landing.find('.tip-one').removeClass('show');
    }, 4000);

    _.delay(function() {
        $landing.find('.tip-two').addClass('show');
    }, 5000);

    _.delay(function() {
        $landing.find('.tip-two').removeClass('show');
    }, 9000);

    _.delay(function() {
        $landing.find('.tip-three').addClass('show');
    }, 10000);
}


/*
 * Begin shuffled playback from the landing screen.
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

/*
 * Resume listening from the landing screen.
 */
var onContinueButtonClick = function(e) {
    e.preventDefault();
    buildPlaylist();
    updateTagDisplay();
    $landing.velocity('fadeOut');
    playNextSong();
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

/*
 * Track Amazon clicks on songs.
 */
var onAmazonClick = function(e) {
    var thisSong = getSong($(this));

    _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'amazon-click', thisSong]);

    e.stopPropagation();
}

/*
 * Track iTunes clicks on songs.
 */
var oniTunesClick = function(e) {
    var thisSong = getSong($(this));

    _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'itunes-click', thisSong]);

    e.stopPropagation();
}

/*
 * Track Rdio clicks on songs.
 */
var onRdioClick = function(e) {
    var thisSong = getSong($(this));

    _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'rdio-click', thisSong]);

    e.stopPropagation();
}

/*
 * Track Spotify clicks on songs.
 */
var onSpotifyClick = function(e) {
    var thisSong = getSong($(this));

    _gaq.push(['_trackEvent', APP_CONFIG.PROJECT_SLUG, 'spotify-click', thisSong]);

    e.stopPropagation();
}

/*
 * Helper function for getting the song artist and title.
 * For analytics tracking.
 */
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
    $songs.find('.song:not(:last)').addClass('small');
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
