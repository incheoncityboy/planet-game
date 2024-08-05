from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from config import Config

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    CORS(app)  # Enable CORS for cross-origin requests

    db.init_app(app)

    with app.app_context():
        from . import routes, models
        db.create_all()

    return app
