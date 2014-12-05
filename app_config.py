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
    'Hip-hop',
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
    'Lars Gotrich': 'lars.jpg',
    'Ann Powers': 'ann.jpg',
    'Otis Hart': 'otis.jpg',
    'Jacob Ganz': 'jacob.jpg',
    'Sami Yenigun': 'sami.jpg',
    'Stephen Thompson': 'sthompson.jpg',
    'Robin Hilton': 'robin.jpg',
    'Jason King': 'jason.jpg',
    'Bob Boilen': 'bob.jpg',
    'Jason Bentley': 'jason-bentley.jpg',
    'Rita Houston': 'rita-houst.jpg',
    'David Dye': 'david-dye.jpg',
    'Kevin Cole': 'kevin-cole.jpg'
}

REVIEWER_BIOS = {
    'Lars Gotrich': 'Beer drinker, BBQ eater',
    'Ann Powers': 'Critic, meaning-monger, melody freak',
    'Otis Hart': '',
    'Jacob Ganz': '',
    'Sami Yenigun': '',
    'Stephen Thompson': '',
    'Robin Hilton': 'Co-host, All Songs Considered. Crying on the outside; laughing on the inside',
    'Jason King': 'Host and curator of NPR&B',
    'Bob Boilen': 'Creator/host All Songs Considered and Tiny Desk Concerts',
    'Jason Bentley': 'Music director at KCRW and host of Morning Becomes Eclectic',
    'Rita Houston': 'Program director at WFUV in New York City',
    'David Dye': u'Host of WXPN\'s World Café',
    'Kevin Cole': 'Program director and host at KEXP in Seattle',
    'Frannie Kelley': 'Editor and Co-host of Microphone Check',
    'Patrick Jarenwattananon': 'Jazz producer with an Internet connection',
    'Felix Contreras': 'Dad, drummer, Deadhead'
}

WELCOME_AUDIO = '/npr/specials/2014/12/20141205_specials_welcome.mp3'
PLAYLIST_DONE_AUDIO = '/npr/specials/2014/12/20141205_specials_playlistend.mp3'
ALL_DONE_AUDIO = '/npr/specials/2014/12/20141205_specials_end.mp3'

TAG_AUDIO_INTROS = {
    'Classical': '/npr/specials/2014/12/20141205_specials_classical.mp3',
    'Country/Americana': '',
    'Electronic': '',
    'Hip-hop': '',
    'Jazz': '/npr/specials/2014/12/20141205_specials_jazz.mp3',
    'Latin': '',
    'Pop': '',
    'R&B': '',
    'Rock': '',
    '\m/ >_< \m/': '',
    'World': '',
    'Bob Boilen': '/npr/specials/2014/12/20141205_specials_bob.mp3',
    'Robin Hilton': '/npr/specials/2014/12/20141205_specials_robin.mp3',
    'Ann Powers': '',
    'Stephen Thompson': '/npr/specials/2014/12/20141205_specials_stephen.mp3',
    'Anastasia Tsioulcas': '/npr/specials/2014/12/20141205_specials_anastasia3.mp3',
    'Tom Huizenga': '/npr/specials/2014/12/20141204_specials_huizengaid.mp3',
    'Patrick Jarenwattananon': '/npr/specials/2014/12/20141205_specials_patrick.mp3',
    'Lars Gotrich': '/npr/specials/2014/12/20141205_specials_lars.mp3',
    'Frannie Kelley': '',
    'Jason King': '',
    'Felix Contreras': '/npr/specials/2014/12/20141205_specials_felix.mp3',
    'Jasmine Garsd': '',
    'Jason Bentley': '',
    'David Dye': '',
    'Rita Houston': '',
    'Kevin Cole': ''
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

