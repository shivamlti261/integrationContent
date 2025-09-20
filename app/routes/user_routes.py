from flask import Blueprint, request
user_bp = Blueprint('user_routes', __name__, url_prefix='/users')
user_bp.strict_slashes = False