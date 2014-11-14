// Global jQuery references
var $shareModal = null;
var $commentCount = null;
var $goButton = null;
var $audioPlayer = null;

// Global state
var firstShareLoad = true;
var playedSongs = [];
var playlist = [];

/*
 * Run on page load.
 */
var onDocumentLoad = function(e) {
    // Cache jQuery references
    $shareModal = $('#share-modal');
    $commentCount = $('.comment-count');
    $goButton = $('.js-go');
    $audioPlayer = $('#audio-player');
    
    // Bind events
    $shareModal.on('shown.bs.modal', onShareModalShown);
    $shareModal.on('hidden.bs.modal', onShareModalHidden);
    $goButton.on('click', onGoButtonClick);
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
    loadPlayedSongs();
    buildPlaylist();
    playNextSong();
}

var setupAudio = function() {
     $audioPlayer.jPlayer({
        ready: function () {
            $(this).jPlayer('setMedia', {
                mp3: '/assets/songs/folk_song.mp3'
            });

            // $(this).jPlayer('play');

        },
        ended: playNextSong,
        supplied: 'mp3',
        loop: false,
    });
}

/*
 * Play the next song in the playlist.
 */
var playNextSong = function() {
    // TODO
    // Loop over playlist until we find a song that hasn't been played
    // What do we do if we don't find one? (we've played them all)

    // render "last played" JST of current song
    // render "currently playing" JST of next song
    // replace current song with the next song
    // add last song to stack of played songs (history)
    // rebind events inside the two JST's (or have use jquery's live(), maybe)

    // Starting playing new song 
    markSongPlayed();
}

/*
 * Load previously played songs from browser state (cookie, whatever)
 */
var loadPlayedSongs = function() {
    // TODO
}

/*
 * Mark the current song as played and save state.
 */
var markSongPlayed = function () {
    // TODO
    // Add song id to list of played songs
    // Stash in cookie
}

/*
 * Build a playlist from a set of tags.
 */
var buildPlaylist = function(tags) {
    var playlist = [];

    // TODO
    // filter SONG_DATA, probably with _.filter()

    return playlist;
}

/*
 * Handle clicks on tags.
 */
var onTagClick = function(e) {
    e.preventDefault();

    playlist = buildPlaylist();
    
    // TODO
    // update display of songs in queue
    // if current song has this tag, stop it and playNextSong();
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
}

/*
 * Fade in the next song of the playlist
 */
var onWindowResize = function(e) {
    $('.landing').css('height', $(window).height());
}


$(onDocumentLoad);
