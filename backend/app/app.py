from flask import Flask, request, jsonify, session, render_template, send_from_directory
import sqlite3
from datetime import datetime, timezone
from dotenv import load_dotenv
import os
from init_db import init_db
from werkzeug.security import generate_password_hash
from werkzeug.security import check_password_hash
# .env 파일 로드
load_dotenv()

# 현재 파일의 절대 경로를 가져옴
basedir = os.path.abspath(os.path.dirname(__file__))
print(f"Template folder: {os.path.join(basedir, '../../frontend')}")

# Flask에서 템플릿 폴더 및 정적 파일 폴더 설정
app = Flask(__name__,
            template_folder=os.path.join(basedir, '../../frontend'),
            static_url_path='/static',
            static_folder=os.path.join(basedir, '../../frontend/assets'))

# 환경 변수에서 SECRET_KEY를 불러오고, 없으면 안전한 기본 키를 생성
secret_key = os.getenv('SECRET_KEY', 'default_secret_key_if_not_set')
app.config['SECRET_KEY'] = secret_key

# 현재 파일(__file__)이 위치한 디렉토리 경로를 기준으로 데이터베이스 파일 경로를 설정합니다.
DATABASE = os.path.join(os.path.dirname(__file__), 'planet-game.db')

@app.route('/')
def home():
    return send_from_directory(app.template_folder, 'index.html')

@app.route('/index.html')
def index():
    return send_from_directory(app.template_folder, 'index.html')

@app.route('/rank.html')
def rank():
    return render_template('rank.html')

@app.route('/test-index-js')
def test_index_js():
    return send_from_directory(app.static_folder, 'js/index.js')

@app.route('/login')
def login_page():
    return render_template('login.html')

#########################################
def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def ranklist(username):
    db = get_db()
    cursor = db.cursor()

    # 내림차순 정렬
    cursor.execute('''
        SELECT u.username, r.score, r.timestamp
        FROM User u
        JOIN Ranking r ON u.id = r.user_id
        ORDER BY r.score DESC
    ''')
    all_rankings = cursor.fetchall()

    # 최상위 100개
    top_100 = all_rankings[:100]

    # 특정 사용자의 주변 100개
    surrounding_100 = []
    user_rank = None
    start_index = 0  # 초기화

    if username:
        # 사용자의 위치를 찾기
        for index, row in enumerate(all_rankings):
            if row['username'] == username:

                user_rank = index + 1  # 순위는 1부터 시작하므로 index + 1
                start_index = max(index - 50, 0)
                end_index = min(index + 50, len(all_rankings))
                surrounding_100 = all_rankings[start_index:end_index]
                break

    # 최상위 100명 리스트 변환
    top_100_list = [{"username": row['username'], "score": row['score'], "user_rank": idx + 1} for idx, row in enumerate(top_100)]

    # 주변 100명 리스트 변환
    surrounding_100_list = [{"username": row['username'], "score": row['score'], "user_rank": start_index + idx + 1} for idx, row in enumerate(surrounding_100)]

    # # 콘솔에 리스트의 첫 5개 항목 출력
    # print("Top 100 List (first 5 items):", top_100_list[:5])
    # print("Surrounding 100 List (first 5 items):", surrounding_100_list[:5])

    return {
        "top_100": top_100_list,
        "surrounding_100": surrounding_100_list,
        "user_rank": user_rank
    }


@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    db = get_db()
    cursor = db.cursor()

    cursor.execute('SELECT * FROM User WHERE username = ?', (data['username'],))
    user = cursor.fetchone()

    # 비밀번호 검증
    if user and check_password_hash(user['password_hash'], data['password']):
        session['user_id'] = user['id']
        session['username'] = user['username']
        return jsonify({"status": "success", "ranklist": ranklist(user['username'])})

    return jsonify({"status": "error"}), 401


@app.route('/api/login', methods=['GET'])
def check_login():
    # 세션에서 유저네임을 가져옵니다 (가정: 로그인된 유저네임이 세션에 저장됨)
    username = session.get('username', None)
    
    if username:
        print(f"User is logged in: {username}")  # 서버에서 유저네임을 로그로 출력
        return jsonify({"status": "success", "username": username})
    else:
        print("User is not logged in.")  # 로그인되지 않은 경우 로그 출력
        return jsonify({"status": "error"}), 401


@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    db = get_db()
    cursor = db.cursor()

    cursor.execute('SELECT * FROM User WHERE username = ?', (data['username'],))
    if cursor.fetchone():
        return jsonify({"status": "error", "message": "username already exists"}), 409

    # 비밀번호 해시화
    hashed_password = generate_password_hash(data['password'])
    
    cursor.execute('INSERT INTO User (username, password_hash) VALUES (?, ?)', (data['username'], hashed_password))
    db.commit()
    return jsonify({"status": "success"}), 201






@app.route('/api/rank', methods=['POST'])
def update_rank():
    data = request.json
    print(f"Received data: {data}")  # 로그 추가
    db = get_db()
    cursor = db.cursor()

    # 사용자 검색
    cursor.execute('SELECT id FROM User WHERE username = ?', (data['username'],))
    user = cursor.fetchone()

    if user:
        user_id = user['id']
        
        # 기존 점수 검색
        cursor.execute('SELECT score FROM Ranking WHERE user_id = ?', (user_id,))
        existing_score = cursor.fetchone()
        
        if existing_score:
            # 새 점수가 기존 점수보다 높으면 업데이트
            if data['score'] > existing_score['score']:
                cursor.execute('''
                    UPDATE Ranking 
                    SET score = ?, timestamp = ?
                    WHERE user_id = ?
                ''', (data['score'], datetime.now(timezone.utc), user_id))
                db.commit()
                return jsonify({"message": "Score updated successfully"}), 200
            else:
                return jsonify({"message": "Existing score is higher or equal. No update made."}), 200
        else:
            # 기존 점수가 없으면 새 점수 삽입
            cursor.execute('INSERT INTO Ranking (user_id, score, timestamp) VALUES (?, ?, ?)', 
                           (user_id, data['score'], datetime.now(timezone.utc)))
            db.commit()
            return jsonify({"message": "Score added successfully"}), 201

    print("User not found")  # 로그 추가
    return jsonify({"message": "User not found"}), 404


@app.route('/api/rank', methods=['GET'])
def get_rank():
    username = request.args.get('username')

    rank_data = ranklist(username)

    response = {
        "rank": rank_data["user_rank"],
        "score": next((row['score'] for row in rank_data["surrounding_100"] if row['username'] == username), None),
        "username": username,
        "ranklist": rank_data
    }


    return jsonify(response)

if __name__ == '__main__':
    app.run(debug=True)
