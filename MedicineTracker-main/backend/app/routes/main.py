from flask import Blueprint, jsonify

bp = Blueprint('main', __name__)

@bp.route('/api/test', methods=['GET'])
def test():
    return jsonify({
        'status': 'success',
        'message': 'Backend is running!'
    }) 