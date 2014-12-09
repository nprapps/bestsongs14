#!/usr/bin/env python

"""
Commands that update or process the application data.
"""
import csv
from datetime import datetime
import json
import os

from fabric.api import task, local
from facebook import GraphAPI
from twitter import Twitter, OAuth
from smartypants import smartypants
import requests

import app_config
import copytext


@task(default=True)
def update():
    """
    Stub function for updating app-specific data.
    """
    #update_featured_social()
    update_songs()

@task
def update_songs(verify='true'):
    local('curl -s -o data/songs.csv https://docs.google.com/spreadsheets/d/19J4Fi2bpeEicoM5475lu1L345fF8hiBn4owbiCKdqIU/export?format=csv&id=19J4Fi2bpeEicoM5475lu1L345fF8hiBn4owbiCKdqIU&gid=0')

    output = clean_songs(verify == 'true')

    with open('data/songs.json', 'w') as f:
        json.dump(output, f)

@task
def clean_songs(verify):
    output = []
    unique_audio = []
    unique_song_art = []
    unique_song_title = []

    with open('data/songs.csv') as f:
        rows = csv.DictReader(f)

        for row in rows:
            stripped_row = {}

            for name, value in row.items():
                try:
                    stripped_row[name] = value.strip()
                except AttributeError:
                    print value
                    raise

            row = stripped_row

            print '%s - %s' % (row['artist'], row['title'])

            if row['song_art']:
                name, ext = os.path.splitext(row['song_art'])
                row['song_art'] = '%s-s500%s' % (name, ext)

            if row['title']:
                row['title'] = smartypants(row['title'])

            if row['artist']:
                row['artist'] = smartypants(row['artist'])

            if row['review']:
                row['review'] = smartypants(row['review'])
                
            # Verify links
            if verify:
                try:
                    audio_link = 'http://pd.npr.org/anon.npr-mp3%s.mp3' % row['media_url']
                    audio_request = requests.head(audio_link)

                    if audio_request.status_code != 200:
                        print '--> %s The audio URL is invalid: %s' % (audio_request.status_code, audio_link)

                    song_art_link = 'http://www.npr.org%s' % row['song_art']
                    song_art_request = requests.head(song_art_link)

                    if song_art_request.status_code != 200:
                        print '--> %s The song art URL is invalid: %s' % (song_art_request, song_art_link)
                except:
                    print '--> request.head failed'

            row['genre_tags'] = []

            for i in range(1,4):
                key = 'genre%i' % i

                if row[key]:
                    row['genre_tags'].append(row[key])

                if key != 'genre1':
                    del row[key]

            row['curator_tags'] = []

            for i in range(1,7):
                key = 'curator%i' % i

                if row[key]:
                    row['curator_tags'].append(row[key])

                del row[key]

            # Verify tags
            if verify:
                for song_genre in row['genre_tags']:
                    if song_genre not in app_config.GENRE_TAGS:
                        print "--> Genre %s is not a valid genre" % (song_genre)

                for song_curator in row['curator_tags']:
                    if song_curator not in app_config.REVIEWER_TAGS:
                        print "--> Genre %s is not a valid genre" % (song_curator)

                if row['reviewer'] not in app_config.REVIEWER_IMAGES:
                    print '--> Reviewer %s does not have a headshot' % row['reviewer']

                if row['media_url'] in unique_audio:
                    print '--> Duplicate audio url: %s' % row['media_url']
                else:
                    unique_audio.append(row['media_url'])

                if row['song_art'] in unique_song_art:
                    print '--> Duplicate song_art url: %s' % row['song_art']
                else:
                    unique_song_art.append(row['song_art'])

                if row['title'] in unique_song_title:
                    print '--> Duplicate title: %s' % row['title']
                else:
                    unique_song_title.append(row['title'])

            output.append(row)

    return output

@task
def update_featured_social():
    """
    Update featured tweets
    """
    COPY = copytext.Copy(app_config.COPY_PATH)
    secrets = app_config.get_secrets()

    # Twitter
    print 'Fetching tweets...'

    twitter_api = Twitter(
        auth=OAuth(
            secrets['TWITTER_API_OAUTH_TOKEN'],
            secrets['TWITTER_API_OAUTH_SECRET'],
            secrets['TWITTER_API_CONSUMER_KEY'],
            secrets['TWITTER_API_CONSUMER_SECRET']
        )
    )

    tweets = []

    for i in range(1, 4):
        tweet_url = COPY['share']['featured_tweet%i' % i]

        if isinstance(tweet_url, copytext.Error) or unicode(tweet_url).strip() == '':
            continue

        tweet_id = unicode(tweet_url).split('/')[-1]

        tweet = twitter_api.statuses.show(id=tweet_id)

        creation_date = datetime.strptime(tweet['created_at'],'%a %b %d %H:%M:%S +0000 %Y')
        creation_date = '%s %i' % (creation_date.strftime('%b'), creation_date.day)

        tweet_url = 'http://twitter.com/%s/status/%s' % (tweet['user']['screen_name'], tweet['id'])

        photo = None
        html = tweet['text']
        subs = {}

        for media in tweet['entities'].get('media', []):
            original = tweet['text'][media['indices'][0]:media['indices'][1]]
            replacement = '<a href="%s" target="_blank" onclick="_gaq.push([\'_trackEvent\', \'%s\', \'featured-tweet-action\', \'link\', 0, \'%s\']);">%s</a>' % (media['url'], app_config.PROJECT_SLUG, tweet_url, media['display_url'])

            subs[original] = replacement

            if media['type'] == 'photo' and not photo:
                photo = {
                    'url': media['media_url']
                }

        for url in tweet['entities'].get('urls', []):
            original = tweet['text'][url['indices'][0]:url['indices'][1]]
            replacement = '<a href="%s" target="_blank" onclick="_gaq.push([\'_trackEvent\', \'%s\', \'featured-tweet-action\', \'link\', 0, \'%s\']);">%s</a>' % (url['url'], app_config.PROJECT_SLUG, tweet_url, url['display_url'])

            subs[original] = replacement

        for hashtag in tweet['entities'].get('hashtags', []):
            original = tweet['text'][hashtag['indices'][0]:hashtag['indices'][1]]
            replacement = '<a href="https://twitter.com/hashtag/%s" target="_blank" onclick="_gaq.push([\'_trackEvent\', \'%s\', \'featured-tweet-action\', \'hashtag\', 0, \'%s\']);">%s</a>' % (hashtag['text'], app_config.PROJECT_SLUG, tweet_url, '#%s' % hashtag['text'])

            subs[original] = replacement

        for original, replacement in subs.items():
            html =  html.replace(original, replacement)

        # https://dev.twitter.com/docs/api/1.1/get/statuses/show/%3Aid
        tweets.append({
            'id': tweet['id'],
            'url': tweet_url,
            'html': html,
            'favorite_count': tweet['favorite_count'],
            'retweet_count': tweet['retweet_count'],
            'user': {
                'id': tweet['user']['id'],
                'name': tweet['user']['name'],
                'screen_name': tweet['user']['screen_name'],
                'profile_image_url': tweet['user']['profile_image_url'],
                'url': tweet['user']['url'],
            },
            'creation_date': creation_date,
            'photo': photo
        })

    # Facebook
    print 'Fetching Facebook posts...'

    fb_api = GraphAPI(secrets['FACEBOOK_API_APP_TOKEN'])

    facebook_posts = []

    for i in range(1, 4):
        fb_url = COPY['share']['featured_facebook%i' % i]

        if isinstance(fb_url, copytext.Error) or unicode(fb_url).strip() == '':
            continue

        fb_id = unicode(fb_url).split('/')[-1]

        post = fb_api.get_object(fb_id)
        user  = fb_api.get_object(post['from']['id'])
        user_picture = fb_api.get_object('%s/picture' % post['from']['id'])
        likes = fb_api.get_object('%s/likes' % fb_id, summary='true')
        comments = fb_api.get_object('%s/comments' % fb_id, summary='true')
        #shares = fb_api.get_object('%s/sharedposts' % fb_id)

        creation_date = datetime.strptime(post['created_time'],'%Y-%m-%dT%H:%M:%S+0000')
        creation_date = '%s %i' % (creation_date.strftime('%b'), creation_date.day)

        # https://developers.facebook.com/docs/graph-api/reference/v2.0/post
        facebook_posts.append({
            'id': post['id'],
            'message': post['message'],
            'link': {
                'url': post['link'],
                'name': post['name'],
                'caption': (post['caption'] if 'caption' in post else None),
                'description': post['description'],
                'picture': post['picture']
            },
            'from': {
                'name': user['name'],
                'link': user['link'],
                'picture': user_picture['url']
            },
            'likes': likes['summary']['total_count'],
            'comments': comments['summary']['total_count'],
            #'shares': shares['summary']['total_count'],
            'creation_date': creation_date
        })

    # Render to JSON
    output = {
        'tweets': tweets,
        'facebook_posts': facebook_posts
    }

    with open('data/featured.json', 'w') as f:
        json.dump(output, f)
