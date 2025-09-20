from app import create_app
import os
app=create_app()

if __name__ == '__main__':
    # set it to port 8080
    # dont debug
    app.run(debug=False, host='0.0.0.0', port=8080)
    
