# Sudoku - Flask Demo

Simple Flask-based Sudoku web app.

Features:
- 9×9 Sudoku grid with prefilled and user-input cells
- Validation to prevent duplicate numbers in rows, columns and 3×3 boxes (client highlights and server verifies)
- "Check Solution" button
- "Show Solution" button (server-powered solver)
- "Reset / New Game" options
- Timer to track completion time
- Completion message on success
- Name entry screen and difficulty selection (Easy/Medium/Hard)
- Local leaderboard (stored in browser localStorage) to compare previous matches

Quick start

1. Create and activate a virtualenv (recommended):

   python -m venv venv
   venv\Scripts\activate

2. Install dependencies:

   pip install -r requirements.txt

3. Run the app:

   python app.py

4. Open http://127.0.0.1:5000

Notes

- The puzzle generator uses a simple backtracking approach and removes cells randomly; it is intended for demo and local use.
- Server endpoint `/check` performs authoritative validation; `/solve` attempts to solve a board and is used by the "Show Solution" feature.
- Scores are stored locally in your browser using `localStorage` (no server-side persistence).
