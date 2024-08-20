from faker import Faker
import random
import sqlite3
import os
from datetime import datetime
# 절대 경로를 사용하여 데이터베이스 파일 위치 지정
DATABASE = os.path.join(os.path.dirname(__file__), 'planet-game.db')

def add_or_update_users():
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    fake = Faker()

    for _ in range(400):
        username = fake.unique.user_name()
        password_hash = fake.password()
        score = random.randint(1, 4000)

        # 사용자가 이미 존재하는지 확인
        cursor.execute('SELECT id FROM User WHERE username = ?', (username,))
        user = cursor.fetchone()

        if user:
            # 존재하면 점수 업데이트
            user_id = user[0]
            cursor.execute('''
                UPDATE Ranking 
                SET score = ?, timestamp = ?
                WHERE user_id = ?
            ''', (score, datetime.now(), user_id))
        else:
            # 존재하지 않으면 사용자와 점수 추가
            cursor.execute('''
                INSERT INTO User (username, password_hash) 
                VALUES (?, ?)
            ''', (username, password_hash))
            user_id = cursor.lastrowid

            cursor.execute('''
                INSERT INTO Ranking (user_id, score, timestamp) 
                VALUES (?, ?, ?)
            ''', (user_id, score, datetime.now()))

    conn.commit()
    conn.close()

if __name__ == '__main__':
    add_or_update_users()
