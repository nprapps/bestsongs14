#!/usr/bin/env python

import json

import argparse
from flask import Flask, make_response, render_template

import app_config
from render_utils import make_context, smarty_filter, urlencode_filter
import static

app = Flask(__name__)

app.add_template_filter(smarty_filter, name='smarty')
app.add_template_filter(urlencode_filter, name='urlencode')

# Example application views
@app.route('/')
def index():
    """
    Example view demonstrating rendering a simple HTML page.
    """
    context = make_context()

    with open('data/featured.json') as f:
        context['featured'] = json.load(f)

    with open('data/songs.json') as f:
        context['song_data'] = f.read()

    return make_response(render_template('index.html', **context))

@app.route('/chromecast/')
def chromecast():
    """
    Route for the Chromecast receiver
    """
    context = make_context()

    with open('data/songs.json') as f:
        context['song_data'] = f.read()

    return make_response(render_template('chromecast.html', **context))


app.register_blueprint(static.static)

# Boilerplate
if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('-p', '--port')
    args = parser.parse_args()
    server_port = 8000

    if args.port:
        server_port = int(args.port)

    app.run(host='0.0.0.0', port=server_port, debug=app_config.DEBUG)
