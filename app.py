from flask import Flask, render_template, jsonify, request
import puzzles
from datetime import datetime

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/new')
def new_puzzle():
    # returns a new puzzle as 9x9 list with 0 for empty cells
    diff = request.args.get('difficulty', 'medium').lower()
    # remove_count = how many cells to remove (higher = harder)
    mapping = {
        'easy': 36,   # 81-36 = 45 clues
        'medium': 44, # 37 clues
        'hard': 52    # 29 clues
    }
    remove = mapping.get(diff, 44)
    puzzle = puzzles.generate_puzzle(remove_count=remove)
    return jsonify({'puzzle': puzzle})

@app.route('/solve', methods=['POST'])
def solve():
    data = request.get_json() or {}
    raw = data.get('board')
    if not raw or not isinstance(raw, list) or len(raw) != 9:
        return jsonify({'ok': False, 'message': 'Invalid board format.'}), 400

    # normalize board
    board = []
    for r in range(9):
        row = []
        for c in range(9):
            v = raw[r][c]
            try:
                iv = int(v) if v is not None and v != '' else 0
            except Exception:
                iv = 0
            row.append(iv)
        board.append(row)

    solution = puzzles.solve_board(board)
    if solution is None:
        return jsonify({'ok': False, 'message': 'No solution found.'}), 400
    return jsonify({'ok': True, 'solution': solution})

@app.route('/check', methods=['POST'])
def check():
    data = request.get_json() or {}
    raw = data.get('board')
    if not raw or not isinstance(raw, list) or len(raw) != 9:
        return jsonify({'valid': False, 'complete': False, 'errors': ['invalid_board'], 'message': 'Invalid board format.'}), 400

    # normalize board to ints (0 for empty)
    board = []
    for r in range(9):
        row = []
        for c in range(9):
            v = raw[r][c]
            try:
                iv = int(v) if v is not None and v != '' else 0
            except Exception:
                iv = 0
            row.append(iv)
        board.append(row)

    errors = []

    # check rows
    for i in range(9):
        vals = [v for v in board[i] if v != 0]
        if len(vals) != len(set(vals)):
            errors.append({'type': 'row', 'index': i})

    # check cols
    for j in range(9):
        vals = [board[i][j] for i in range(9) if board[i][j] != 0]
        if len(vals) != len(set(vals)):
            errors.append({'type': 'col', 'index': j})

    # check 3x3 boxes
    for br in range(3):
        for bc in range(3):
            vals = []
            for i in range(br*3, br*3+3):
                for j in range(bc*3, bc*3+3):
                    if board[i][j] != 0:
                        vals.append(board[i][j])
            if len(vals) != len(set(vals)):
                errors.append({'type': 'box', 'index': br*3 + bc})

    complete = all(all(cell != 0 and 1 <= cell <= 9 for cell in row) for row in board)
    valid = (len(errors) == 0) and complete
    message = 'Solved!' if valid else ('Board is incomplete or has duplicates.' if not complete or errors else 'There are issues.')

    return jsonify({'valid': valid, 'complete': complete, 'errors': errors, 'message': message})

if __name__ == '__main__':
    app.run(debug=True)
