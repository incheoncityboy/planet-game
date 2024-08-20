import sqlite3
import os

# 데이터베이스 경로 설정
DATABASE = os.path.join(os.path.dirname(__file__), 'planet-game.db')

def view_db():
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()

    # User 테이블의 데이터 조회
    print("User 테이블 데이터:")
    cursor.execute('SELECT * FROM User')
    users = cursor.fetchall()
    for user in users:
        print(user)

    # Ranking 테이블의 데이터 조회
    print("\nRanking 테이블 데이터:")
    cursor.execute('SELECT * FROM Ranking')
    rankings = cursor.fetchall()
    for ranking in rankings:
        print(ranking)

    conn.close()

if __name__ == '__main__':
    view_db()
