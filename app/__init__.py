from flask import Flask, redirect, request, jsonify, url_for
from logging import log
from dotenv import load_dotenv
import os
import redis
from flask import render_template
import requests
from werkzeug import Response
load_dotenv()
redis_host = os.getenv("REDIS_HOST")
redis_port = int(os.getenv("REDIS_PORT"))
redis_username = os.getenv("REDIS_USERNAME")
redis_password = os.getenv("REDIS_PASSWORD")

r = redis.Redis(
    host=redis_host,
    port=redis_port,
    decode_responses=True,
    username=redis_username,
    password=redis_password,
)

def create_app():

    app = Flask(__name__, static_folder='static')

    @app.route('/', methods=['GET'])
    def index():
       # logic 
       # set your token here 
       return render_template('welcome.html')

    @app.route('/dashboard', methods=['GET'])
    def dashboard():
        return render_template('dashboard.html')
    """
    
    
    @app.route('/proxy', methods=['POST'])
    def proxy():
        url=request.json.get('url')
        token=request.json.get('token')
        
        headers = {
           "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
         }
        
        response = requests.get(url, headers=headers)
        
        if(response.text=="token is invalid, please re-authenticate"):
            return redirect(url_for('logout'))

        return Response(response.text, content_type=response.headers.get('Content-Type'))
    
    """
    @app.route('/logout', methods=['GET'])
    def logout():
        return render_template('logout.html')
    # api for getting key or getting access token

    #TODO
    # make ui for showing it to users 
    # api for getting intgration content 
    @app.route('/register',methods=['POST'])
    def register():
        """
        will get client id , client secret , token url , tenent url , username , password from user
        will store the details in redis as hash with username as key
        return 400 if user not exists
        """
        client_id=request.json.get('client_id')
        client_secret=request.json.get('client_secret')
        token_url=request.json.get('token_url')
        tenent_url=request.json.get('tenent_url')
        username=request.json.get('username')
        password=request.json.get('password')
        # find if username exists in redis 
        if r.exists(username):
            return jsonify({"message":"user already exists"}), 400
        
        data = {
            'username': username,
            'password': password,
            'tenent_url': tenent_url,
            'client_id': client_id,
            'client_secret': client_secret,
            'token_url': token_url
        }
        # convert data to string and store in redis as hash

        r.hset(username, mapping=data)

        # get the token from the token url post request , application/x-www-form-urlencoded, in body client_id, client_secret, grant_type=client_credentials
        data={  
            'client_id': client_id,
            'client_secret': client_secret,
            'grant_type': 'client_credentials',
        }
        # also add content type in headers
        response = requests.post(token_url, data=data, headers={'Content-Type': 'application/x-www-form-urlencoded'})
        if response.status_code != 200:
            return jsonify({"message":"invalid client id or client secret"}), 400
        token=response.json().get('access_token')
        expires_in=response.json().get('expires_in')
        # store the token in redis with expiry time
        r.set("T"+username, token, ex=expires_in)
        # return successful response
        return jsonify({"message":"user registered successfully"}), 200
    # api for login and getting token from redis or fetch from cpi if expired
    @app.route('/login', methods=['POST'])
    def login():
        """
        get username and password from user
        check if username exists in redis
        if not exists return 400
        if exists check if password matches
        if not matches return 400
        if matches check if token exists in redis
        if not then set token 
        """
        username=request.json.get('username')
        password=request.json.get('password')
        # find if username exists in redis 
        if not r.exists(username):
            return jsonify({"message":"user does not exist"}), 400
        # check password
        stored_password=r.hget(username, 'password')
        if password != stored_password:
            return jsonify({"message":"invalid password"}), 400
        # check if token exists in redis
        if r.exists("T"+username):
            token=r.get("T"+username)
            
        
        client_id=r.hget(username, 'client_id')
        client_secret=r.hget(username, 'client_secret')
        token_url=r.hget(username, 'token_url')
        data={
            'client_id': client_id,
            'client_secret': client_secret,
            'grant_type': 'client_credentials',
        }
        # also add content type in headers
        response = requests.post(token_url, data=data, headers={'Content-Type': 'application/x-www-form-urlencoded'})
        if response.status_code != 200:
            return jsonify({"message":"invalid client id or client secret"}), 400
        token=response.json().get('access_token')
        expires_in=response.json().get('expires_in')
        # store the token in redis with expiry time
        r.set("T"+username, token, ex=expires_in)
        return jsonify({"message":"user logged in successfully","Token": token}), 200
        
    @app.route('/get_integration_content', methods=['GET'])
    def get_integration_content():
        """
        get username and token from body
        and compare the token with redis token
        if not matches return unauthorised 400
    
        """
        username=request.json.get('username')
        token=request.json.get('token')
        if not r.exists(username):
            return jsonify({"message":"user does not exist"}), 400
        stored_token=r.get("T"+username)
        if token != stored_token:
            return jsonify({"message":"invalid token"}), 400
        # if matches return integration content
        user_tenet_url=r.hget(username, 'tenent_url')
        # set authorisation header with bearer token
        headers = {
           "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
         }
        response = requests.get(f"{user_tenet_url}/api/v1/IntegrationPackages", headers=headers)
        if(response.text=="token is invalid, please re-authenticate"):
            return redirect(url_for('logout'))
        return Response(response.text, content_type=response.headers.get('Content-Type'))
    
    @app.route('/IntegrationRuntimeArtifacts', methods=['GET'])
    def get_integration_runtime_artifacts():
        """
            verify user
            return runtime artifact detail to user in xml format
        """
        username=request.json.get('username')
        token=request.json.get('token')
        if not r.exists(username):
            return jsonify({"message":"user does not exist"}), 400
        stored_token=r.get("T"+username)
        if token != stored_token:
            return jsonify({"message":"invalid token"}), 400
        # if matches return integration content
        user_tenet_url=r.hget(username, 'tenent_url')
        # set authorisation header with bearer token
        headers = {
           "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        response = requests.get(f"{user_tenet_url}/api/v1/IntegrationRuntimeArtifacts", headers=headers)
        if(response.text=="token is invalid, please re-authenticate"):
            return redirect(url_for('logout'))
        
        return Response(response.text, content_type=response.headers.get('Content-Type'))
    
    @app.route("/MessageMappingDesigntimeArtifacts", methods=['GET'])
    def get_runtime_artifact_details():

        """
            verify user
            return runtime artifact details to user in xml format
        """
        username=request.json.get('username')
        token=request.json.get('token')
        if not r.exists(username):
            return jsonify({"message":"user does not exist"}), 400
        stored_token=r.get("T"+username)
        if token != stored_token:
            return jsonify({"message":"invalid token"}), 400
        # if matches return integration content
        user_tenet_url=r.hget(username, 'tenent_url')
        # set authorisation header with bearer token
        headers = {
           "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(f"{user_tenet_url}/api/v1/MessageMappingDesigntimeArtifacts", headers=headers)
        if(response.text=="token is invalid, please re-authenticate"):
            return redirect(url_for('logout'))
        return Response(response.text, content_type=response.headers.get('Content-Type'))
    
    @app.route("/ValueMappingDesigntimeArtifacts", methods=['GET'])
    def get_value_mapping_designtime_artifacts():
        """
            verify user
            return value mapping designtime artifacts to user in xml format
        """
        username=request.json.get('username')
        token=request.json.get('token')
        if not r.exists(username):
            return jsonify({"message":"user does not exist"}), 400
        stored_token=r.get("T"+username)
        if token != stored_token:
            return jsonify({"message":"invalid token"}), 400
        # if matches return integration content
        user_tenet_url=r.hget(username, 'tenent_url')
        # set authorisation header with bearer token
        headers = {
           "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(f"{user_tenet_url}/api/v1/ValueMappingDesigntimeArtifacts", headers=headers)
        if(response.text=="token is invalid, please re-authenticate"):
            return redirect(url_for('logout'))
        return Response(response.text, content_type=response.headers.get('Content-Type'))

    # i want to return jwt token for successfull login and need to verify it in every api call
    # api for getting list of all integrations

    # api for getting artifact details
    # api for getting deploy status 
    # api for list of all packages 
    # api for list of deployed packages
    # if token is valid show the integration content

    return app

