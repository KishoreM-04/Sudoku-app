import random

# Simple backtracking solver/generator to produce a full board then remove cells.
# Not designed for production-grade unique-solution guarantees but works well for demos.

SIZE = 9
BOX = 3


def _is_valid(board, r, c, v):
    for i in range(SIZE):
        if board[r][i] == v:
            return False
        if board[i][c] == v:
            return False
    br, bc = (r // BOX) * BOX, (c // BOX) * BOX
    for i in range(br, br + BOX):
        for j in range(bc, bc + BOX):
            if board[i][j] == v:
                return False
    return True


def _solve(board):
    for r in range(SIZE):
        for c in range(SIZE):
            if board[r][c] == 0:
                vals = list(range(1, 10))
                random.shuffle(vals)
                for v in vals:
                    if _is_valid(board, r, c, v):
                        board[r][c] = v
                        if _solve(board):
                            return True
                        board[r][c] = 0
                return False
    return True


def generate_solution():
    board = [[0 for _ in range(SIZE)] for _ in range(SIZE)]
    _solve(board)
    return board


def generate_puzzle(remove_count=40):
    full = generate_solution()
    puzzle = [row[:] for row in full]
    coords = [(r, c) for r in range(SIZE) for c in range(SIZE)]
    random.shuffle(coords)
    removed = 0
    for (r, c) in coords:
        if removed >= remove_count:
            break
        puzzle[r][c] = 0
        removed += 1
    return puzzle


def solve_board(board):
    """Attempt to solve a board (list of lists). Returns solved board or None."""
    b = [[int(cell) if cell else 0 for cell in row] for row in board]
    if _solve(b):
        return b
    return None
