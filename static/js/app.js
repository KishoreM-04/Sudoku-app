// Elements
const gridEl = document.getElementById('sudoku-grid')
const newBtn = document.getElementById('newBtn')
const showSolBtn = document.getElementById('showSolBtn')
const checkBtn = document.getElementById('checkBtn')
const resetBtn = document.getElementById('resetBtn')
const leaderBtn = document.getElementById('leaderBtn')
const messages = document.getElementById('messages')
const timerEl = document.getElementById('timer')
const modal = document.getElementById('complete-modal')
const completeTimeEl = document.getElementById('complete-time')
const closeModal = document.getElementById('closeModal')

// Modals and flow
const nameModal = document.getElementById('name-modal')
const startNameBtn = document.getElementById('startNameBtn')
const nameInput = document.getElementById('playerName')
const difficultyModal = document.getElementById('difficulty-modal')
const difficultyButtons = document.querySelectorAll('.difficulty')
const cancelDifficulty = document.getElementById('cancelDifficulty')
const leaderModal = document.getElementById('leader-modal')
const closeLeader = document.getElementById('closeLeader')
const clearLeader = document.getElementById('clearLeader')
const leaderBoardEl = document.getElementById('leaderboard')

let puzzle = []
let initial = []
let timer = null
let startTime = null
let playerName = null
let difficulty = 'medium'

const timerValue = document.getElementById('timer-value')

// Difficulty info (seconds target)
const difficultyInfo = {
  easy: {target: 600, label: 'Easy', desc: 'Relaxed pace, more clues.'},
  medium: {target: 360, label: 'Medium', desc: 'Balanced challenge.'},
  hard: {target: 180, label: 'Hard', desc: 'Tough puzzles.'}
}

// Show name modal on load (with focus and subtle animation)
function showNameModal(){
  nameModal.classList.remove('hidden')
  const card = nameModal.querySelector('.modal-content')
  card.classList.add('open')
  setTimeout(()=> { nameInput.focus() }, 160)
}

function hideNameModal(){
  const card = nameModal.querySelector('.modal-content')
  card.classList.remove('open')
  setTimeout(()=> nameModal.classList.add('hidden'), 180)
}

function showDifficultyModal(){
  difficultyModal.classList.remove('hidden')
  const card = difficultyModal.querySelector('.modal-content')
  card.classList.add('open')
}
function hideDifficultyModal(){
  const card = difficultyModal.querySelector('.modal-content')
  card.classList.remove('open')
  setTimeout(()=> difficultyModal.classList.add('hidden'), 180)
}

function showLeaderModal(){
  renderLeaderboard()
  leaderModal.classList.remove('hidden')
  leaderModal.querySelector('.modal-content').classList.add('open')
}
function hideLeaderModal(){
  const card = leaderModal.querySelector('.modal-content')
  card.classList.remove('open')
  setTimeout(()=> leaderModal.classList.add('hidden'), 180)
}

// name modal enter key support
nameInput.addEventListener('keydown', (e)=>{ if (e.key === 'Enter') startNameBtn.click() })

startNameBtn.addEventListener('click', ()=>{
  const name = nameInput.value.trim() || 'Player'
  playerName = name
  hideNameModal()
  showDifficultyModal()
})

cancelDifficulty.addEventListener('click', ()=>{
  hideDifficultyModal()
  showNameModal()
})

// difficulty click handlers: read dataset and update target display
difficultyButtons.forEach(btn => btn.addEventListener('click', (e)=>{
  const el = e.currentTarget
  const d = el.dataset.diff
  difficulty = d
  // show target
  const info = difficultyInfo[d] || difficultyInfo['medium']
  const td = document.getElementById('target-display')
  td.textContent = formatSeconds(info.target)
  hideDifficultyModal()
  startGame(difficulty)
}))

// leader modal buttons
newBtn.addEventListener('click', ()=>{ showDifficultyModal() })
leaderBtn.addEventListener('click', ()=>{ showLeaderModal() })
closeLeader.addEventListener('click', ()=>{ hideLeaderModal() })
clearLeader.addEventListener('click', ()=>{ localStorage.removeItem('sudoku_scores'); renderLeaderboard(); })


newBtn.addEventListener('click', ()=>{ showDifficultyModal() })
leaderBtn.addEventListener('click', ()=>{ showLeaderModal() })
closeLeader.addEventListener('click', ()=>{ hideLeaderModal() })
clearLeader.addEventListener('click', ()=>{ localStorage.removeItem('sudoku_scores'); renderLeaderboard(); })

function buildGrid() {
  gridEl.innerHTML = ''
  for (let r = 0; r < 9; r++) {
    const tr = document.createElement('tr')
    for (let c = 0; c < 9; c++) {
      const td = document.createElement('td')
      // box borders
      if ((c+1) % 3 === 0 && c !== 8) td.classList.add('box-border-right')
      if ((r+1) % 3 === 0 && r !== 8) td.classList.add('box-border-bottom')

      const input = document.createElement('input')
      input.type = 'text'
      input.maxLength = 1
      input.dataset.r = r
      input.dataset.c = c
      const val = puzzle[r][c]
      if (val && val !== 0) {
        input.value = val
        input.readOnly = true
        input.classList.add('prefilled')
      } else {
        input.value = ''
        input.addEventListener('input', onCellInput)
        input.addEventListener('keydown', onKeyDown)
      }
      td.appendChild(input)
      tr.appendChild(td)
    }
    gridEl.appendChild(tr)
  }
}

function onKeyDown(e){
  // allow digits 1-9 and backspace/delete
  if (e.key.length === 1 && !/[1-9]/.test(e.key)) {
    e.preventDefault()
  }
}

function onCellInput(e){
  const el = e.target
  const val = el.value.replace(/[^1-9]/g, '')
  el.value = val
  if (!startTime) startTimer()
  validateHighlights()
}

function readBoard(){
  const board = []
  for (let r = 0; r < 9; r++){
    const row = []
    for (let c = 0; c < 9; c++){
      const input = document.querySelector(`input[data-r='${r}'][data-c='${c}']`)
      const v = input.value === '' ? 0 : parseInt(input.value, 10)
      row.push(v)
    }
    board.push(row)
  }
  return board
}

function validateHighlights(){
  // clear errors
  document.querySelectorAll('input').forEach(i => i.classList.remove('error'))
  const b = readBoard()
  // rows
  for (let r = 0; r < 9; r++){
    const seen = {}
    for (let c = 0; c < 9; c++){
      const v = b[r][c]
      if (v === 0) continue
      if (seen[v]){
        // mark both
        document.querySelector(`input[data-r='${r}'][data-c='${c}']`).classList.add('error')
        document.querySelector(`input[data-r='${r}'][data-c='${seen[v]-1}']`).classList.add('error')
      } else seen[v] = c+1
    }
  }
  // cols
  for (let c = 0; c < 9; c++){
    const seen = {}
    for (let r = 0; r < 9; r++){
      const v = b[r][c]
      if (v === 0) continue
      if (seen[v]){
        document.querySelector(`input[data-r='${r}'][data-c='${c}']`).classList.add('error')
        document.querySelector(`input[data-r='${seen[v]-1}'][data-c='${c}']`).classList.add('error')
      } else seen[v] = r+1
    }
  }
  // boxes
  for (let br = 0; br < 3; br++){
    for (let bc = 0; bc < 3; bc++){
      const seen = {}
      for (let r = br*3; r < br*3+3; r++){
        for (let c = bc*3; c < bc*3+3; c++){
          const v = b[r][c]
          if (v === 0) continue
          const key = `${v}`
          if (seen[key]){
            document.querySelector(`input[data-r='${r}'][data-c='${c}']`).classList.add('error')
            const [pr, pc] = seen[key]
            document.querySelector(`input[data-r='${pr}'][data-c='${pc}']`).classList.add('error')
          } else seen[key] = [r, c]
        }
      }
    }
  }
}

function fetchNew(diff){
  messages.textContent = ''
  const url = diff ? `/new?difficulty=${diff}` : `/new?difficulty=${difficulty}`
  fetch(url).then(r => r.json()).then(data => {
    puzzle = data.puzzle
    initial = JSON.parse(JSON.stringify(puzzle))
    buildGrid()
    stopTimer()
    resetTimerDisplay()
  }).catch(err => { messages.textContent = 'Failed to get puzzle.' })
}

function startGame(diff){
  difficulty = diff || difficulty
  fetchNew(difficulty)
  // reset message & timers
  messages.textContent = ''
  resetTimerDisplay()
}

function resetToInitial(){
  puzzle = JSON.parse(JSON.stringify(initial))
  buildGrid()
  stopTimer()
  resetTimerDisplay()
}

async function checkSolution(){
  const board = readBoard()
  validateHighlights()
  const resp = await fetch('/check', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({board})
  })
  const data = await resp.json()
  if (data.valid){
    stopTimer()
    const elapsed = getElapsed()
    completeTimeEl.textContent = `Time: ${formatSeconds(elapsed)}`
    // celebration
    launchConfetti(80)
    // show success modal
    modal.classList.remove('hidden')
    modal.querySelector('.modal-content').classList.add('open')
    messages.textContent = ''
    // Save score
    saveScore({name: playerName, difficulty, time: elapsed})
  } else {
    messages.textContent = data.message || 'Not solved yet or there are duplicates.'
  }
}

showSolBtn && showSolBtn.addEventListener('click', async ()=>{
  if (!initial || initial.length === 0) return
  // Ask server to solve the original puzzle
  try{
    const resp = await fetch('/solve', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({board: initial})
    })
    const data = await resp.json()
    if (data.ok && data.solution){
      fillSolutionOnBoard(data.solution)
      stopTimer()
      messages.textContent = 'Solution revealed.'
    } else {
      messages.textContent = data.message || 'Could not solve.'
    }
  }catch(err){ messages.textContent = 'Could not solve.' }
})

function fillSolutionOnBoard(solution){
  for (let r = 0; r < 9; r++){
    for (let c = 0; c < 9; c++){
      const input = document.querySelector(`input[data-r='${r}'][data-c='${c}']`)
      if (input){
        input.value = solution[r][c]
        input.readOnly = true
        input.classList.add('prefilled')
      }
    }
  }
}

function startTimer(){
  startTime = Date.now()
  // immediately show
  timerValue.textContent = formatSeconds(getElapsed())
  timer = setInterval(()=>{
    timerValue.textContent = formatSeconds(getElapsed())
  }, 1000)
}

function stopTimer(){
  if (timer) clearInterval(timer)
  timer = null
}

function getElapsed(){
  if (!startTime) return 0
  return Math.floor((Date.now() - startTime)/1000)
}

function resetTimerDisplay(){
  startTime = null
  timerValue.textContent = '00:00'
}

function formatSeconds(s){
  const mm = String(Math.floor(s/60)).padStart(2,'0')
  const ss = String(s%60).padStart(2,'0')
  return `${mm}:${ss}`
}

// Confetti effect (simple, no libs)
function launchConfetti(count = 60){
  const container = document.getElementById('confetti')
  if (!container) return
  const colors = ['#ff5e5b','#ffb86b','#ffd56b','#9ad3bc','#7ad7f0','#8aa0ff','#c58cff']
  const w = window.innerWidth
  for (let i = 0; i < count; i++){
    const el = document.createElement('div')
    el.className = 'confetti-piece'
    el.style.left = Math.floor(Math.random()*100) + '%'
    el.style.top = '-10px'
    el.style.background = colors[Math.floor(Math.random()*colors.length)]
    el.style.opacity = 1
    el.style.transform = `translateY(0) rotate(${Math.random()*360}deg)`
    const delay = Math.random()*300
    container.appendChild(el)
    // animate by applying transform after a short delay
    setTimeout(()=>{
      const endY = window.innerHeight + 100 + Math.random()*200
      const rotate = Math.random()*720 - 360
      el.style.transition = `transform ${2.6 + Math.random()*0.8}s cubic-bezier(.2,.8,.3,1), opacity 1.2s ease ${0.6 + Math.random()*0.6}s`
      el.style.transform = `translateY(${endY}px) translateX(${(Math.random()*200-100)}px) rotate(${rotate}deg)`
      el.style.opacity = 0
    }, delay)
    // cleanup
    setTimeout(()=>{ try{ container.removeChild(el) }catch(e){} }, 4200)
  }
}

// Scoreboard persistence
function saveScore(entry){
  try{
    const key = 'sudoku_scores'
    const raw = localStorage.getItem(key)
    const items = raw ? JSON.parse(raw) : []
    items.push({...entry, date: new Date().toISOString()})
    // keep last 100
    while(items.length > 100) items.shift()
    localStorage.setItem(key, JSON.stringify(items))
  }catch(e){console.warn(e)}
  renderLeaderboard()
}

function renderLeaderboard(){
  const raw = localStorage.getItem('sudoku_scores')
  const items = raw ? JSON.parse(raw) : []
  if (!leaderBoardEl) return
  const filter = document.getElementById('leaderFilter') && document.getElementById('leaderFilter').value
  const filtered = items.filter(it => (filter === 'all' || !filter) ? true : it.difficulty === filter)
  if (filtered.length === 0){ leaderBoardEl.innerHTML = '<p>No scores yet. Play a game!</p>'; return }
  // sort by time asc
  filtered.sort((a,b)=>a.time - b.time)
  // build table
  let html = `<table aria-label="Leaderboard"><thead><tr><th>#</th><th>Player</th><th>Difficulty</th><th>Time</th><th>Date</th></tr></thead><tbody>`
  filtered.forEach((it, idx) => {
    const d = new Date(it.date)
    html += `<tr><td>${idx+1}</td><td><strong>${it.name}</strong><div class="meta">${it.name === playerName ? 'You' : ''}</div></td><td>${it.difficulty}</td><td><strong>${formatSeconds(it.time)}</strong></td><td class="meta">${d.toLocaleString()}</td></tr>`
  })
  html += '</tbody></table>'
  leaderBoardEl.innerHTML = html
}

// leader filter handler
const leaderFilterEl = document.getElementById('leaderFilter')
if (leaderFilterEl){ leaderFilterEl.addEventListener('change', ()=> renderLeaderboard()) }


newBtn.addEventListener('click', ()=>{ showDifficultyModal() })
resetBtn.addEventListener('click', ()=>{ resetToInitial() })
checkBtn.addEventListener('click', ()=>{ checkSolution() })
closeModal && closeModal.addEventListener('click', ()=>{ const card = modal.querySelector('.modal-content'); card.classList.remove('open'); setTimeout(()=> modal.classList.add('hidden'), 180); })

// initial load: start with name prompt
showNameModal()
