import sqlite3
from datetime import datetime
import os

# 절대 경로를 사용하여 데이터베이스 파일 위치 지정
DATABASE = os.path.join('D:\\', 'portfolio', 'planet-game', 'backend', 'app', 'planet-game.db')

def init_db():
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()

    cursor.execute('DROP TABLE IF EXISTS User')
    cursor.execute('DROP TABLE IF EXISTS Ranking')

    cursor.execute('''
    CREATE TABLE User (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL
    )
    ''')

    cursor.execute('''
    CREATE TABLE Ranking (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        score INTEGER NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES User(id)
    )
    ''')

    conn.commit()
    conn.close()

if __name__ == '__main__':
    init_db()
