import sqlite3

def check_db():
    conn = sqlite3.connect('backend/nlap_db.sqlite3')
    cursor = conn.cursor()
    
    # List all tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [t[0] for t in cursor.fetchall()]
    print("Tables in SQLite database:")
    for table in tables:
        cursor.execute(f"PRAGMA table_info({table});")
        columns = [col[1] for col in cursor.fetchall()]
        cursor.execute(f"SELECT COUNT(*) FROM {table};")
        count = cursor.fetchone()[0]
        print(f" - {table}: {count} records, columns: {columns}")
        
    conn.close()

if __name__ == "__main__":
    check_db()
