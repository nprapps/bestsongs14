#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Project-wide application configuration.

DO NOT STORE SECRETS, PASSWORDS, ETC. IN THIS FILE.
They will be exposed to users. Use environment variables instead.
See get_secrets() below for a fast way to access them.
"""

import os

"""
NAMES
"""
# Project name to be used in urls
# Use dashes, not underscores!
PROJECT_SLUG = 'best-songs-2014'

# Project name to be used in file paths
PROJECT_FILENAME = 'bestsongs14'

# The name of the repository containing the source
REPOSITORY_NAME = 'bestsongs14'
GITHUB_USERNAME = 'nprapps'
REPOSITORY_URL = 'git@github.com:%s/%s.git' % (GITHUB_USERNAME, REPOSITORY_NAME)
REPOSITORY_ALT_URL = None # 'git@bitbucket.org:nprapps/%s.git' % REPOSITORY_NAME'

# Project name used for assets rig
# Should stay the same, even if PROJECT_SLUG changes
ASSETS_SLUG = 'bestsongs14'

"""
DEPLOYMENT
"""
PRODUCTION_S3_BUCKET = {
    'bucket_name': 'apps.npr.org',
    'region': 'us-east-1'
}

STAGING_S3_BUCKET = {
    'bucket_name': 'stage-apps.npr.org',
    'region': 'us-east-1'
}

ASSETS_S3_BUCKET = {
    'bucket_name': 'assets.apps.npr.org',
    'region': 'us-east-1'
}

DEFAULT_MAX_AGE = 20
ASSETS_MAX_AGE = 86400

PRODUCTION_SERVERS = ['cron.nprapps.org']
STAGING_SERVERS = ['50.112.92.131']

# Should code be deployed to the web/cron servers?
DEPLOY_TO_SERVERS = False

SERVER_USER = 'ubuntu'
SERVER_PYTHON = 'python2.7'
SERVER_PROJECT_PATH = '/home/%s/apps/%s' % (SERVER_USER, PROJECT_FILENAME)
SERVER_REPOSITORY_PATH = '%s/repository' % SERVER_PROJECT_PATH
SERVER_VIRTUALENV_PATH = '%s/virtualenv' % SERVER_PROJECT_PATH

# Should the crontab file be installed on the servers?
# If True, DEPLOY_TO_SERVERS must also be True
DEPLOY_CRONTAB = False

# Should the service configurations be installed on the servers?
# If True, DEPLOY_TO_SERVERS must also be True
DEPLOY_SERVICES = False

UWSGI_SOCKET_PATH = '/tmp/%s.uwsgi.sock' % PROJECT_FILENAME

# Services are the server-side services we want to enable and configure.
# A three-tuple following this format:
# (service name, service deployment path, service config file extension)
SERVER_SERVICES = [
    ('app', SERVER_REPOSITORY_PATH, 'ini'),
    ('uwsgi', '/etc/init', 'conf'),
    ('nginx', '/etc/nginx/locations-enabled', 'conf'),
]

# These variables will be set at runtime. See configure_targets() below
S3_BUCKET = None
S3_BASE_URL = None
S3_DEPLOY_URL = None
SERVERS = []
SERVER_BASE_URL = None
SERVER_LOG_PATH = None
DEBUG = True

"""
COPY EDITING
"""
COPY_GOOGLE_DOC_URL = 'https://docs.google.com/spreadsheet/ccc?key=0AlXMOHKxzQVRdGFfTF9QdnR1YnN0YzFkQnBKbnVnMmc'
COPY_PATH = 'data/copy.xlsx'

"""
SHARING
"""
SHARE_URL = 'http://%s/%s/' % (PRODUCTION_S3_BUCKET['bucket_name'], PROJECT_SLUG)

"""
SERVICES
"""
GOOGLE_ANALYTICS = {
    'ACCOUNT_ID': 'UA-5828686-4',
    'DOMAIN': PRODUCTION_S3_BUCKET['bucket_name'],
    'TOPICS': '[1039]'
}

DISQUS_API_KEY = 'tIbSzEhGBE9NIptbnQWn4wy1gZ546CsQ2IHHtxJiYAceyyPoAkDkVnQfCifmCaQW'
DISQUS_UUID = '1e6c6345-69ba-11e4-95c2-80e650107db6'

GENRE_TAGS = [
    'Classical',
    'Country/Americana',
    'Electronic',
    'Hip-Hop',
    'Jazz',
    'Latin',
    'Pop',
    'R&B',
    'Rock',
    '\m/ >_< \m/',
    'World'
]

REVIEWER_TAGS = [
    'Bob Boilen',
    'Robin Hilton',
    'Ann Powers',
    'Stephen Thompson',
    'Anastasia Tsioulcas',
    'Tom Huizenga',
    'Patrick Jarenwattananon',
    'Lars Gotrich',
    'Frannie Kelley',
    'Jason King',
    'Felix Contreras',
    'Jasmine Garsd',
    'Jason Bentley',
    'David Dye',
    'Rita Houston',
    'Kevin Cole'
]

REVIEWER_IMAGES = {
    # With playlists
    'Bob Boilen': 'bob.jpg',
    'Robin Hilton': 'robin.jpg',
    'Ann Powers': 'ann.jpg',
    'Stephen Thompson': 'sthompson.jpg',
    'Anastasia Tsioulcas': 'tsioulcas.jpg',
    'Tom Huizenga': 'huizenga.jpg',
    'Patrick Jarenwattananon': 'jarenwattananon.jpg',
    'Lars Gotrich': 'lars.jpg',
    'Frannie Kelley': 'kelley.jpg',
    'Jason King': 'jason-king.jpg',
    'Felix Contreras': 'contreras.jpg',
    'Jasmine Garsd': 'jasmine-garsd.jpg',
    'Jason Bentley': 'jason-bentley.jpg',
    'David Dye': 'david-dye.jpg',
    'Rita Houston': 'rita-houst.jpg',
    'Kevin Cole': 'kevin-cole.jpg',

    # Without playlists
    'Otis Hart': 'otis-hart.jpg',
    'Jacob Ganz': 'jacob.jpg',
    'Kiana Fitzgerald': 'kiana.jpg',
    'Bobby Carter': 'bobby-carter.jpg',
    'Cedric Shine': 'cedric-shine.jpg',
    'Mike Katzif': 'mike-katzif.jpg',
    'Kelly McCartney': 'kelly-mccartney.jpg'
}

REVIEWER_BIOS = {
    'Bob Boilen': 'Creator/host All Songs Considered and Tiny Desk Concerts',
    'Robin Hilton': 'Co-host, All Songs Considered. Crying on the outside; laughing on the inside',
    'Ann Powers': 'Critic, meaning-monger, melody freak',
    'Stephen Thompson': 'Likes writing, talking, melancholy, misanthropy, these songs, you',
    'Anastasia Tsioulcas': 'Co-host of the blog Deceptive Cadence, musical omnivore.',
    'Tom Huizenga': 'Co-host of the blog Deceptive Cadence, ears wide open',
    'Patrick Jarenwattananon': 'Jazz producer with an Internet connection',
    'Lars Gotrich': 'Beer drinker, BBQ eater',
    'Frannie Kelley': 'Editor and Co-host of Microphone Check',
    'Jason King': 'Host and curator of NPR&B',
    'Felix Contreras': 'Dad, drummer, Deadhead',
    'Jasmine Garsd': 'Co-host of NPR&rsquo;s Alt.Latino',
    'Jason Bentley': 'Music director at KCRW and host of Morning Becomes Eclectic',
    'David Dye': 'Host of WXPN&rsquo;s World Cafe',
    'Rita Houston': 'Program director at WFUV in New York City',
    'Kevin Cole': 'Program director and host at KEXP in Seattle',
}

WELCOME_AUDIO = '/npr/specialmusic/2014/12/20141208_specialmusic_welcome.mp3'

TAG_AUDIO_INTROS = {
    'Bob Boilen': '/npr/specialmusic/2014/12/20141208_specialmusic_bob.mp3',
    'Robin Hilton': '/npr/specialmusic/2014/12/20141208_specialmusic_robin.mp3',
    'Ann Powers': '/npr/specialmusic/2014/12/20141208_specialmusic_ann.mp3',
    'Stephen Thompson': '/npr/specialmusic/2014/12/20141208_specialmusic_stephen.mp3',
    'Anastasia Tsioulcas': '/npr/specialmusic/2014/12/20141208_specialmusic_anastasia.mp3',
    'Tom Huizenga': '/npr/specialmusic/2014/12/20141208_specialmusic_tom.mp3',
    'Patrick Jarenwattananon': '/npr/specialmusic/2014/12/20141208_specialmusic_patrick.mp3',
    'Lars Gotrich': '/npr/specialmusic/2014/12/20141208_specialmusic_lars.mp3',
    'Frannie Kelley': '/npr/specialmusic/2014/12/20141208_specialmusic_frannie.mp3',
    'Jason King': '/npr/specialmusic/2014/12/20141208_specialmusic_jason.mp3',
    'Felix Contreras': '/npr/specialmusic/2014/12/20141208_specialmusic_felix.mp3',
    'Jasmine Garsd': '/npr/specialmusic/2014/12/20141208_specialmusic_jasmine.mp3',
    'Jason Bentley': '',
    'David Dye': '/npr/specialmusic/2014/12/20141208_specialmusic_david.mp3',
    'Rita Houston': '/npr/specialmusic/2014/12/20141208_specialmusic_rita.mp3',
    'Kevin Cole': '/npr/specialmusic/2014/12/20141208_specialmusic_kevin.mp3',
}

SKIP_LIMIT = 6

"""
Utilities
"""
def get_secrets():
    """
    A method for accessing our secrets.
    """
    secrets = [
        'EXAMPLE_SECRET'
    ]

    secrets_dict = {}

    for secret in secrets:
        name = '%s_%s' % (PROJECT_FILENAME, secret)
        secrets_dict[secret] = os.environ.get(name, None)

    return secrets_dict

def configure_targets(deployment_target):
    """
    Configure deployment targets. Abstracted so this can be
    overriden for rendering before deployment.
    """
    global S3_BUCKET
    global S3_BASE_URL
    global S3_DEPLOY_URL
    global SERVERS
    global SERVER_BASE_URL
    global SERVER_LOG_PATH
    global DEBUG
    global DEPLOYMENT_TARGET
    global DISQUS_SHORTNAME

    if deployment_target == 'production':
        S3_BUCKET = PRODUCTION_S3_BUCKET
        S3_BASE_URL = 'http://%s/%s' % (S3_BUCKET['bucket_name'], PROJECT_SLUG)
        S3_DEPLOY_URL = 's3://%s/%s' % (S3_BUCKET['bucket_name'], PROJECT_SLUG)
        SERVERS = PRODUCTION_SERVERS
        SERVER_BASE_URL = 'http://%s/%s' % (SERVERS[0], PROJECT_SLUG)
        SERVER_LOG_PATH = '/var/log/%s' % PROJECT_FILENAME
        DISQUS_SHORTNAME = 'npr-news'
        DEBUG = False
    elif deployment_target == 'staging':
        S3_BUCKET = STAGING_S3_BUCKET
        S3_BASE_URL = 'http://%s/%s' % (S3_BUCKET['bucket_name'], PROJECT_SLUG)
        S3_DEPLOY_URL = 's3://%s/%s' % (S3_BUCKET['bucket_name'], PROJECT_SLUG)
        SERVERS = STAGING_SERVERS
        SERVER_BASE_URL = 'http://%s/%s' % (SERVERS[0], PROJECT_SLUG)
        SERVER_LOG_PATH = '/var/log/%s' % PROJECT_FILENAME
        DISQUS_SHORTNAME = 'nprviz-test'
        DEBUG = True
    else:
        S3_BUCKET = None
        S3_BASE_URL = 'http://127.0.0.1:8000'
        S3_DEPLOY_URL = None
        SERVERS = []
        SERVER_BASE_URL = 'http://127.0.0.1:8001/%s' % PROJECT_SLUG
        SERVER_LOG_PATH = '/tmp'
        DISQUS_SHORTNAME = 'nprviz-test'
        DEBUG = True

    DEPLOYMENT_TARGET = deployment_target

"""
Run automated configuration
"""
DEPLOYMENT_TARGET = os.environ.get('DEPLOYMENT_TARGET', None)

configure_targets(DEPLOYMENT_TARGET)

