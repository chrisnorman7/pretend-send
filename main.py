"""PretendSend."""

import os.path
from datetime import datetime
from random import choice
from flask import Flask, render_template, jsonify, request, abort
from flask_sqlalchemy import SQLAlchemy

js_filename = os.path.join('static', 'main.js')
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///db.sqlite3'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)


class Thread(db.Model):
    """A collection of messages."""
    __tablename__ = 'threads'
    id = db.Column(db.Integer, primary_key=True)

    def as_dict(self):
        """Return this thread as a dictionary."""
        messages = []
        for message in self.messages:
            messages.append(
                dict(
                    id=message.id, sent=message.sent.ctime(), text=message.text
                )
            )
        return dict(id=self.id, messages=messages)


class Message(db.Model):
    """A message in a thread."""
    __tablename__ = 'messages'
    id = db.Column(db.Integer, primary_key=True)
    thread_id = db.Column(
        db.Integer, db.ForeignKey('threads.id'), nullable=False
    )
    thread = db.relationship('Thread', backref='messages')
    text = db.Column(db.String(10000), nullable=False)
    sent = db.Column(
        db.DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )


def no_thread():
    """Moan about a lack of threads."""
    return abort(404, 'There is no thread with that ID.')


@app.route('/')
def index():
    """Return the index page."""
    return render_template('index.html', mtime=os.path.getmtime(js_filename))


@app.route('/next/')
def next_thread():
    """Get a random thread."""
    if not Thread.query.count():
        return abort(404, 'There are no message threads yet.')
    thread = choice(Thread.query.all())
    return dump_thread(thread)


@app.route('/new/')
def new_thread():
    """Create a new thread."""
    t = Thread()
    db.session.add(t)
    db.session.commit()
    return dump_thread(t)


def dump_thread(thread):
    """Dump a thread to json."""
    return jsonify(thread.as_dict())


@app.route('/thread/<id>')
def get_thread(id):
    """Load a specific thread."""
    thread = Thread.query.get(id)
    if thread is None:
        return no_thread()
    return dump_thread(thread)


@app.route('/reply/', methods=['POST', 'GET'])
def reply():
    """Reply to a thread."""
    id = request.form.get('id')
    text = request.form.get('text')
    thread = Thread.query.get(id)
    if thread is None:
        return no_thread()
    message = Message(text=text, thread_id=id)
    db.session.add(message)
    db.session.commit()
    return jsonify(dict(id=message.id))


if __name__ == '__main__':
    db.create_all()
    app.run(host='0.0.0.0', port='8398')
