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
var $goContinue = null;
var $moodButtons = null;
var $playlistLength = null;
var $skip = null;
var $songs = null;


// Global state
var firstShareLoad = true;
var playedSongs = [];
var playlist = [];
var currentSong = null;
var selectedTags = [];
var playlistLength = 250;
var onWelcome = true;


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
    $goContinue = $('.continue');
    $moodButtons = $('.landing .tags a');
    $playlistLength = $('.playlist-length');
    $totalSongs = $('.total-songs');

    // Bind events
    $shareModal.on('shown.bs.modal', onShareModalShown);
    $shareModal.on('hidden.bs.modal', onShareModalHidden);
    $goButton.on('click', onGoButtonClick);
    $goContinue.on('click', onGoContinueClick);
    $moodButtons.on('click', onMoodButtonClick);
    $body.on('click', '.playlist-filters li a', onTagClick);
    $skip.on('click', onSkipClick);
    $(window).on('resize', onWindowResize);

    // configure ZeroClipboard on share panel
    ZeroClipboard.config({ swfPath: 'js/lib/ZeroClipboard.swf' });
    var clippy = new ZeroClipboard($(".clippy"));

    clippy.on('ready', function(readyEvent) {
        clippy.on('aftercopy', onClippyCopy);
    });

    onWindowResize();

    SONG_DATA = _.shuffle(SONG_DATA);

    setupAudio();
    loadState();
}

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

var onTimeUpdate = function(e) {
    var time_text = $.jPlayer.convertTime(e.jPlayer.status.currentTime);
    $currentTime.text(time_text);
};

var setupAudioSyncing = function (audio, xGifs, metadata) {
    var syncOffset = -0.1;

    audio.addEventListener('playing', function () {
        var beats = metadata.response.track.analysis.beats,
            beatIndex = 0;
        while (beats[0].start > 0) {
            beats.unshift({
                start: beats[0].start - beats[0].duration,
                duration: beats[0].duration,
                confidence: 0
            });
        }

        var animationLoop = function () {
            requestAnimationFrame(animationLoop);

            if (beats.length > beatIndex) {
                var currentTime = audio.currentTime + syncOffset;
                while (beatIndex < beats.length && currentTime > beats[beatIndex].start) {
                    beatIndex++;
                }
                var beat = beats[beatIndex - 1];

                var sinceLastBeat = currentTime - beat.start,
                beatFraction = sinceLastBeat / beat.duration;
                [].forEach.call(xGifs, function (xGif) {
                    xGif.clock(beatIndex, beat.duration * 1000 / audio.playbackRate, beatFraction);
                });
            }
        }
        animationLoop();
    });
}

var startPrerollAudio = function() {
    if (simpleStorage.get('loadedPreroll')) {
        playNextSong();
        return;
    }

    $('.poster x-gif').removeAttr('stopped');
    $audioPlayer.jPlayer('play');
    $playerArtist.text('Perfect Mixtape')
    $playerTitle.text('Welcome to NPR Music\'s Perfect Mixtape')
    simpleStorage.set('loadedPreroll', true);
}

/*
 * Play the next song in the playlist.
 */
var playNextSong = function() {
    if (onWelcome) {
        hideWelcome();
    }

    if (currentSong) {
        var context = $.extend(APP_CONFIG, currentSong);
        var html = JST.played(context);
        $previouslyPlayed.append(html);
    }

    console.log(playlist);

    var nextSong = _.find(playlist, function(song) {
        return !(_.contains(playedSongs, song['id']));
    })

    // TODO
    // What do we do if we don't find one? (we've played them all)

    var context = $.extend(APP_CONFIG, nextSong);
    var html = JST.song(context);
    $songs.append(html);

    $playerArtist.text(nextSong['artist'])
    $playerTitle.text(nextSong['title'])

    var nextsongURL = APP_CONFIG.S3_BASE_URL + "/assets/songs/" + nextSong['mp3_file'];

    $audioPlayer.jPlayer('setMedia', {
        mp3: nextsongURL
    }).jPlayer('play');

    $('.gif x-gif').removeAttr('stopped');

    currentSong = nextSong;
    markSongPlayed(currentSong);
}

/*
 * Load previously played songs from browser state (cookie, whatever)
 */
var loadState = function() {
    // playedSongs = simpleStorage.get('playedSongs') || [];
    //selectedTags = simpleStorage.get('selectedTags') || [];

    if (playedSongs || selectedTags) {
        $goContinue.show();
    }
}

/*
 * Mark the current song as played and save state.
 */
var markSongPlayed = function(song) {
    playedSongs.push(song['id'])

    simpleStorage.set('playedSongs', playedSongs);
}

/*
 * Build a playlist from a set of tags.
 */
var buildPlaylist = function(tags) {
    return _.filter(SONG_DATA, function(song) {
        for (var i = 0; i < song['tags'].length; i++) {
            if (!_.contains(tags, song['tags'][i])) {
                return false;
            }
        }

        return true;
    })
}

/*
 * Handle clicks on tags.
 */
var onTagClick = function(e) {
    e.preventDefault();

    var tag = $(this).text();

    // deselecting a tag
    if (_.contains(selectedTags, tag)) {
        var index = selectedTags.indexOf(tag);
        selectedTags.splice(index, 1);
        simpleStorage.set('selectedTags', selectedTags);
        $(this).addClass('disabled');

        playlist = buildPlaylist(selectedTags);
        playlistLength = playlist.length;
        $playlistLength.text(playlistLength);

        var keepPlaying = _.find(playlist, function(song) {
            return song['id'] == currentSong['id'];
        });

        if (!keepPlaying) {
            playNextSong();
        }
    // adding a tag
    } else {
        selectedTags.push(tag);
        simpleStorage.set('selectedTags', selectedTags);
        playlist = buildPlaylist(selectedTags);
        playlistLength = playlist.length;
        $playlistLength.text(playlistLength);

        $(this).removeClass('disabled');
    }

    // TODO
    // update display of songs in queue
}

/*
 * Skip the current song.
 */
var onSkipClick = function(e) {
    e.preventDefault();

    playNextSong();
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

/*
 * Fade in the next song of the playlist
 */
var showNewSong = function(e) {
    // $('.played-song').slideDown();
    $songs.find('.song').last().fadeIn();
    _.delay(function(){
        $('html, body').animate({
            scrollTop: $songs.find('.song').last().offset().top
        }, 500);
    }, 200);
}

var hideWelcome  = function() {
    onWelcome = false;

    $('.songs, .player, .playlist-filters, .filter-head').fadeIn();

    $goButton.fadeOut();
    $goContinue.fadeOut();

    $('.songs, .player, .playlist-filters').fadeIn();

    $('html, body').animate({
        scrollTop: $songs.offset().top
    }, 1000);
}

var highlightSelectedTags = function() {

    $allTags.addClass('disabled');

    var $matchedTagButtons = $([]);
    if (selectedTags.length > 0 ) {
        _.each(selectedTags, function(tag) {
            var $filtered = $allTags.filter(function() {
                return $(this).data('tag') === tag;
            })
            $matchedTagButtons = $.merge($matchedTagButtons, $filtered);
        });

        if ($matchedTagButtons) {
            $matchedTagButtons.removeClass('disabled');
        }
    }

    playlistLength = playlist.length;
    $playlistLength.text(playlistLength);

}

var onGoButtonClick = function(e) {
    playlist = SONG_DATA;
    selectedTags = APP_CONFIG.TAGS;
    highlightSelectedTags();
    startPrerollAudio();
}

var onGoContinueClick = function(e) {
    playlist = buildPlaylist(selectedTags);
    highlightSelectedTags();
    startPrerollAudio();
}

var onMoodButtonClick = function(e) {
    playlist = buildPlaylist(selectedTags);
    selectedTags = [$(this).data('tag')];
    simpleStorage.set('selectedTags', selectedTags)
    highlightSelectedTags();
    startPrerollAudio();
}

var onWindowResize = function(e) {
    $('.landing').css('height', $(window).height());
}


$(onDocumentLoad);
