"""WSGI entry point for the Flask application."""

import argparse
from tradekingbackend import create_app

def parse_args():
    parser = argparse.ArgumentParser(description='Run the TradeKing backend server')
    parser.add_argument('--port', type=int, default=5001,
                      help='Port to run the server on (default: 5001)')
    return parser.parse_args()

app = create_app()

if __name__ == '__main__':
    args = parse_args()
    app.run(host='0.0.0.0', port=args.port, debug=True) 