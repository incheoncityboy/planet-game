import unittest
import json
from backend.app.app import app, init_db
class FlaskTestCase(unittest.TestCase):

    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True
        with app.app_context():
            init_db()  # Initialize the database for each test

    def test_register(self):
        response = self.app.post('/api/register', data=json.dumps({
            'username': 'testuser',
            'password': 'testpass'
        }), content_type='application/json')
        self.assertEqual(response.status_code, 201)
        self.assertIn('success', response.get_data(as_text=True))

    def test_login(self):
        self.app.post('/api/register', data=json.dumps({
            'username': 'testuser',
            'password': 'testpass'
        }), content_type='application/json')

        response = self.app.post('/api/login', data=json.dumps({
            'username': 'testuser',
            'password': 'testpass'
        }), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertIn('success', response.get_data(as_text=True))

    def test_update_rank(self):
        self.app.post('/api/register', data=json.dumps({
            'username': 'testuser',
            'password': 'testpass'
        }), content_type='application/json')

        response = self.app.post('/api/rank', data=json.dumps({
            'username': 'testuser',
            'score': 100
        }), content_type='application/json')
        self.assertEqual(response.status_code, 201)
        self.assertIn('Score updated successfully', response.get_data(as_text=True))

    def test_get_rank(self):
        self.app.post('/api/register', data=json.dumps({
            'username': 'testuser',
            'password': 'testpass'
        }), content_type='application/json')

        self.app.post('/api/rank', data=json.dumps({
            'username': 'testuser',
            'score': 100
        }), content_type='application/json')

        response = self.app.get('/api/rank', query_string={'username': 'testuser'})
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.get_data(as_text=True))
        self.assertEqual(data['username'], 'testuser')
        self.assertEqual(data['rank'], 1)
        self.assertEqual(data['score'], 100)

if __name__ == '__main__':
    unittest.main()
