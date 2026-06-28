import sys
sys.path.insert(0, '.')

from app.main import app

for route in app.routes:
    methods = getattr(route, "methods", None)
    path = getattr(route, "path", None)

    if methods and path:
        print(f"{methods} {path}")