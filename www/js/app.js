// Global jQuery references
var $body = null;
var $shareModal = null;
var $commentCount = null;
var $goButton = null;
var $audioPlayer = null;
var $currentSongWrapper = null;
var $previouslyPlayed = null;
var $playerArtist = null;
var $playerTitle = null;

// Global state
var firstShareLoad = true;
var playedSongs = [];
var playlist = [];
var currentSong = null;
var selectedTags = [];

/*
 * Run on page load.
 */
var onDocumentLoad = function(e) {
    // Cache jQuery references
    $body = $('body');
    $shareModal = $('#share-modal');
    $commentCount = $('.comment-count');
    $goButton = $('.js-go');
    $audioPlayer = $('#audio-player');
    $currentSongWrapper = $('.current-song');
    $previouslyPlayed = $('.previously-played');
    $playerArtist = $('.player .artist');
    $playerTitle = $('.player .song-title');

    // Bind events
    $shareModal.on('shown.bs.modal', onShareModalShown);
    $shareModal.on('hidden.bs.modal', onShareModalHidden);
    $goButton.on('click', onGoButtonClick);
    $body.on('click', '.playlist-filters li a', onTagClick);
    $currentSongWrapper.on('click', '.skip', onSkipClick);
    $(window).on('resize', onWindowResize);

    // configure ZeroClipboard on share panel
    ZeroClipboard.config({ swfPath: 'js/lib/ZeroClipboard.swf' });
    var clippy = new ZeroClipboard($(".clippy"));

    clippy.on('ready', function(readyEvent) {
        clippy.on('aftercopy', onClippyCopy);
    });

    onWindowResize();

    SONG_DATA = _.shuffle(SONG_DATA);
    playlist = SONG_DATA;

    setupAudio();
    loadPlayedSongs();
}

var setupAudio = function() {
    $audioPlayer.jPlayer({
        ended: playNextSong,
        supplied: 'mp3',
        loop: false,
        timeupdate: onTimeUpdate
    });
}

var onTimeUpdate = function(e) {
    var time_text = $.jPlayer.convertTime(e.jPlayer.status.currentTime);
    $('.current-time').text(time_text);
};

/*
 * Play the next song in the playlist.
 */
var playNextSong = function() {
    if (currentSong) {
        var context = $.extend(APP_CONFIG, currentSong);
        var html = JST.current(context);
        $previouslyPlayed.append(html);
    }

    var nextSong = _.find(playlist, function(song) {
        return !(_.contains(playedSongs, song['id']));
    })

    // TODO
    // What do we do if we don't find one? (we've played them all)

    var context = $.extend(APP_CONFIG, nextSong);
    var html = JST.current(context);
    $currentSongWrapper.html(html);

    nextSong

    $playerArtist.text(nextSong['artist'])
    $playerTitle.text(nextSong['title'])

    var nextsongURL = APP_CONFIG.S3_BASE_URL + "/assets/songs/" + nextSong['mp3_file'];

    $audioPlayer.jPlayer('setMedia', {
        mp3: nextsongURL
    }).jPlayer('play');

    currentSong = nextSong;
    markSongPlayed(currentSong);
}

/*
 * Load previously played songs from browser state (cookie, whatever)
 */
var loadPlayedSongs = function() {
    // playedSongs = simpleStorage.get('playedSongs') || [];
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
        return _.intersection(tags, song['tags']).length == tags.length;
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

        $(this).addClass('disabled');

        playlist = buildPlaylist(selectedTags);
        console.log(playlist);

        if (_.intersection(currentSong['tags'], selectedTags).length == 0) {
            playNextSong();
        }
    // adding a tag
    } else {
        selectedTags.push(tag);
        playlist = buildPlaylist(selectedTags);
        console.log(playlist);

        $(this).removeClass('disabled');

        if (!_.contains(currentSong['tags'], tag)) {
            playNextSong();
        }
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
 * Basic templating example.
 */
var renderExampleTemplate = function() {
    var context = $.extend(APP_CONFIG, {
        'template_path': 'jst/example.html',
        'config': JSON.stringify(APP_CONFIG, null, 4),
        'copy': JSON.stringify(COPY, null, 4)
    });

    var html = JST.example(context);

    $('#template-example').html(html);
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
    $('.new-song').fadeIn();
    _.delay(function(){
        $('html, body').animate({
            scrollTop: $(".new-song").offset().top
        }, 500);
    }, 200);
}

/*
 * Fade in the next song of the playlist
 */
var onGoButtonClick = function(e) {
    $('.current-song, .player, .playlist-filters, .filter-head').fadeIn();

    $(this).fadeOut();

    // _.delay(function(){
    //         $('html, body').animate({
    //             scrollTop: $(".current-song").offset().top
    //         }, 500);
    //     }, 200);

    $('.current-song, .player, .playlist-filters').fadeIn();

    $('html, body').animate({
        scrollTop: $('.current-song').offset().top
    }, 1000);

    playNextSong();
}

/*
 * Fade in the next song of the playlist
 */
var onWindowResize = function(e) {
    $('.landing').css('height', $(window).height());
}


$(onDocumentLoad);
