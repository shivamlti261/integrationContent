from flask import Blueprint, request
auth_bp = Blueprint('auth_routes', __name__, url_prefix='/auth')
auth_bp.strict_slashes = False

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    # Implement login logic here
    # check if access token is valid 
    # enter client_id, client_secret , token_url and get the token from the url
    # send that token here  and store it in redis with expiry time
    # if token is expired redirect to login page 

    return "Login Page"
