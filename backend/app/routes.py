from flask import jsonify, request
from app import app, db
from app.models import User


def ranklist(username):
    # Join User and Ranking tables and order by score desc
    all_rankings = db.session.query(User.username, Ranking.score).join(Ranking).order_by(Ranking.score.desc()).all()

    # Get top 100 rankings
    top_100 = all_rankings[:100]

    # Get surrounding 100 rankings for a specific user
    surrounding_100 = []
    if username:
        user_index = next((index for index, (uname, score) in enumerate(all_rankings) if uname == username), None)
        #위아래 50명씩
        if user_index is not None:
            start_index = max(user_index - 50, 0)
            end_index = min(user_index + 50, len(all_rankings))
            surrounding_100 = all_rankings[start_index:end_index]

    top_100_list = [{"username": uname, "score": score} for uname, score in top_100]
    surrounding_100_list = [{"username": uname, "score": score} for uname, score in surrounding_100]

    return {
        "top_100": top_100_list,
        "surrounding_100": surrounding_100_list
    }


@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(username=data['username']).first()

    if user and user.password_hash == data['password']:
        session['user_id'] = user.id
        session['username'] = user.username
        return jsonify({"status": "success", "ranklist": ranklist(user.username)})

    return jsonify({"status" : "error"}), 401

@app.route('/api/login', method=['GET'])
def login_status():
    if 'user_id' in session:
        return jsonify({"status": "success"})
    return jsonify({"status": "error"})

@app.route('/api/register', method=['POST'])
def register():
    data = request.json
    if User.query.filter_by(username=data['username'], password_hash=data['password'])
        return jsonify({"status": "error", "message": "username already exists"}), 409

    new_user = User(username=data['username'], password_hash=data['password'])
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"status": "success"}), 201

@app.route('/api/rank', methods=['POST'])
def update_rank():
    data = request.json
    user = User.query.filter_by(username=data['username']).first()

    if user:
        new_ranking = Ranking(user_id=user.id, score=data['score'])
        db.session.add(new_ranking)
        db.session.commit()
        return jsonify({"message": "Score updated successfully"}), 201

    return jsonify({"message": "User not found"}), 404

@app.route('/api/rank', meghods=['GET'])
def get_rank():
    username = request.args.get('username')
    rank_data = ranklist(username)
    return jsonify(rank_data)

