'use strict';

// Game global vars
const MINE = '💣';
const MARK = '🚩';

var gBoard;
var gLevel = {
    SIZE: 4,
    MINES: 2
};

// Timer vars
var gIsFirstClick = true; //using it to check if the user started the game to activate the timer.
var gIntervalTimer;
var gStartTime;

// Hints vars
var gHints = [];
var gIsHint = false;
var gHintCounter = 0;

// Lives vars
var gLivesNum = 3;

// Manual mode vars
var gIsManual = false;
var gManualCounter = 0;


function selectLevel() {
    var elLevel = document.querySelector('.dificulty')
    var level = elLevel.options;

    if (level[0].selected) {
        gLevel.SIZE = 4;
        gLevel.MINES = 2;
    }
    else if (level[1].selected) {
        gLevel.SIZE = 8;
        gLevel.MINES = 12;
    }
    else if (level[2].selected) {
        gLevel.SIZE = 12;
        gLevel.MINES = 25;
    }
    init()
}

function restartGame() {
    //DOM restart
    var elSmiley = document.querySelector('.smiley')
    elSmiley.innerText = '😀';
    var elManual = document.querySelector('.manual')
    elManual.innerText = 'Manual positioning'
    closeModal();
    
    // Timer restart
    var elTimer = document.querySelector('.timer');
    elTimer.style.visibility = 'hidden';
    gStartTime = 0;
    gIntervalTimer = 0

    gIsFirstClick = true;
    gHintCounter = 0;
    gLivesNum = 3;
    gManualCounter = 0;
}

function init() {
    restartGame();

    gBoard = buildBoard(gBoard);
    addMines(gBoard);
    setMinesNegsCount(gBoard);
    createHints();
    renderLives();
    renderBoard(gBoard);
}

function buildBoard() {
    var SIZE = gLevel.SIZE;
    var board = [];
    for (var i = 0; i < SIZE; i++) {
        board.push([]);
        for (var j = 0; j < SIZE; j++) {
            var cell = {
                minesAroundCount: null,
                isShown: false,
                isMine: false,
                isMarked: false
            };

            if (gIsManual) cell.minesAroundCount = ' ';

            board[i][j] = cell;
        }
    }
    return board;
}


function renderBoard(board) {
    var strHTML = '<table border="0"><tbody>';
    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>';
        for (var j = 0; j < board[0].length; j++) {
            var cell = board[i][j];
            if (cell.isMine) {
                cell.minesAroundCount = MINE;
            }
            strHTML += `<td class= "cell${i}-${j}" onclick="cellClicked(this,${i},${j})" oncontextmenu="cellMarked(this,${i},${j})">${cell.minesAroundCount} </td>`
        }
        strHTML += '</tr>'
    }
    strHTML += '</tbody></table>';
    var elBoard = document.querySelector('.board')
    elBoard.innerHTML = strHTML;
}



function addMines(board, currCell = 0) {
    if (gIsManual) return;

    // add mines randomly to the board
    var minesNum = gLevel.MINES;
    for (var i = 0; i < minesNum; i++) {
        var randomRow = getRandomInt(0, gLevel.SIZE);
        var randomCol = getRandomInt(0, gLevel.SIZE);
        var cell = board[randomRow][randomCol];
        // preventing the option that after clicking a mine in the first click another mine will be setted there
        if (randomRow === currCell.i && randomCol === currCell.j) {
            minesNum++
            continue;
        }
        if (cell.isMine) minesNum++;

        cell.isMine = true;
    }
}

function setMinesNegsCount(board) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            var negsNum = countNeighbors(i, j, board);
            var cell = board[i][j];
            cell.minesAroundCount = (negsNum === 0) ? ' ' : negsNum;
        }
    }
    return board;
}

function cellClicked(elCell, i, j) {
    if (gBoard[i][j].isMarked ||
        gBoard[i][j].isShown && !gIsManual ||
        gIsManual && gLevel.MINES === gManualCounter) return;

    // Clicked in Manual mode
    if (gIsManual && gManualCounter < gLevel.MINES) {
        gManualCounter++
        gBoard[i][j].isMine = true;
        elCell.innerText = MINE;
        setMinesNegsCount(gBoard)
        return;
    }

    if (gIsFirstClick) {
        startTimer();
        //this "if" happens if the first click is on a mine
        if (gBoard[i][j].isMine) {
            var currCell = { i, j };
            gBoard = buildBoard(gBoard);
            addMines(gBoard, currCell)
            setMinesNegsCount(gBoard)
            renderBoard(gBoard)
            elCell = document.querySelector(`.cell${i}-${j}`)
        }
    }
    // Clicked after clicking one of the Hints buttons
    if (gIsHint && gHints) { // checks if there are hints left;
        revealNegsTemp(i, j, gBoard);
        return;
    }

    gIsFirstClick = false;
    elCell.classList.add('clicked');
    gBoard[i][j].isShown = true;

    if (gBoard[i][j].isMine) {
        if (gLivesNum) {
            var elLife = document.querySelector(`.life${gLivesNum - 1}`)
            elLife.classList.remove('lighted');
            gLivesNum--;
            renderModal('lost life');
        }
        if (!gLivesNum) { //in the third click the lighted class removed + game over
            elCell.classList.add('mine');
            revealMines(gBoard);
            gameOver(false);
            return;
        }
    }
    //Recursion reavealing
    if (gBoard[i][j].minesAroundCount === ' ') {
        revealNegs(i, j, gBoard);
    }
    checkGameOver()
}


function revealNegs(cellI, cellJ, mat) {

    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= mat.length) continue;
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (i === cellI && j === cellJ) continue;
            if (j < 0 || j >= mat[i].length) continue;
            var elCell = document.querySelector(`.cell${i}-${j}`)

            //Recursion reavealing
            cellClicked(elCell, i, j);
            mat[i][j].isShown = true;
            elCell.classList.add('clicked')
        }
    }
}

function revealMines(board) {
    //reveals all the mines on the board
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            var cell = board[i][j]
            if (cell.isMine) {
                var elCell = document.querySelector(`.cell${i}-${j}`)
                cell.className = elCell.classList.add('mine');
            }
        }
    }
}

function cellMarked(elCell, i, j) {
    window.addEventListener('contextmenu', function (elCell) { // makes the contextmenu not to show up
        elCell.preventDefault();
    }, false);

    if (gIsFirstClick) startTimer();

    gIsFirstClick = false;
    if (!gBoard[i][j].isShown) {
        if (!gBoard[i][j].isMarked) {
            elCell.classList.add('marked')
            gBoard[i][j].isMarked = true
            elCell.innerText = MARK
        }
        else {
            elCell.classList.remove('marked')
            gBoard[i][j].isMarked = false
            elCell.innerText = gBoard[i][j].minesAroundCount;
        }
    }
    checkGameOver()
}


function checkGameOver() {

    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            var cell = gBoard[i][j];
            if (!cell.isShown && !cell.isMine ||
                cell.isMine && !cell.isMarked && !cell.isShown) return; // the !cell.isShown is for the mines that were reveald while there was still lives.
        }
    }
    gameOver(true)
}

function gameOver(isWin) {
    clearInterval(gIntervalTimer);
    var elSmiley = document.querySelector('.smiley')
    if (!isWin) {
        elSmiley.innerText = '🤕';
        renderModal('lose')
    } else if (isWin) {
        elSmiley.innerText = '🥳';
        renderModal('win')
    }
}

// TIMER ZONE

function startTimer() {
    gStartTime = Date.now();
    var elTimer = document.querySelector('.timer');
    elTimer.style.visibility = 'visible';
    gIntervalTimer = setInterval(setTimer, 20)
}

function setTimer() {
    var currTime = Date.now()
    var diffTime = new Date(currTime - gStartTime)
    var printedTime = diffTime.getMinutes() + ':' + diffTime.getSeconds();
    var elTimer = document.querySelector('.timer');
    elTimer.innerText = 'Timer:\n' + printedTime;
}



// HINT ZONE

function renderHints(hintsNum) {
    var strHTML = ''
    for (var i = 0; i < hintsNum; i++) {
        strHTML += `<div class="hint${i}" onclick="activateHint(this, ${i})">💡</div>`;
    }
    var elHint = document.querySelector('.hint');
    elHint.innerHTML = strHTML;
}

function createHints() {
    var hintsNum = 3
    for (var i = 0; i < hintsNum; i++) {
        gHints.push(i)
    }
    renderHints(hintsNum)
}

function activateHint(elHint, i) {
    if (!gHints.includes(i)) return;
    gHints.splice(i, 1);
    gIsHint = true;
    elHint.classList.add('lighted');
}

// **CHECK IF CAN BE INCLUDED IN THE REGULAR REVEAL NEGS FUNCTION, FOR PREVENTING REPITITION**

function revealNegsTemp(cellI, cellJ, mat) {
    var beenShownCells = [] // an array of cell numbers by the negs search. that's for the closeNegs() won't close cells that already have been showned.
    var cellNum = 0;
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= mat.length) continue;
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (j < 0 || j >= mat[i].length) continue;
            cellNum++
            if (mat[i][j].isShown === true) {
                beenShownCells.push(cellNum)
                continue;
            }
            var elCell = document.querySelector(`.cell${i}-${j}`)
            mat[i][j].isShown = true; // prevent clicking a cell while hint reveal
            elCell.classList.add('clicked')
        }
    }
    setTimeout(closeNegs, 1000, cellI, cellJ, mat, beenShownCells)
}

function closeNegs(cellI, cellJ, mat, beenShownCells) {
    var cellNum = 0;
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= mat.length) continue;
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            cellNum++
            if (j < 0 || j >= mat[i].length) continue;
            if (beenShownCells.includes(cellNum)) continue;
            var elCell = document.querySelector(`.cell${i}-${j}`)
            gBoard[i][j].isShown = false;
            elCell.classList.remove('clicked');
        }
    }
    gIsHint = false;
}


// LIVES ZONE


function renderLives() {
    var strHTML = ''
    for (var i = 0; i < gLivesNum; i++) {
        strHTML += `<div class="life${i} lighted">❤️</div>`;
    }
    var elLife = document.querySelector('.life');
    console.log(elLife);
    elLife.innerHTML = strHTML;
}



// MODAL ZONE

function renderModal(status) {
    var elModal = document.querySelector('.modal');
    elModal.style.visibility = 'visible';
    elModal.classList.add('animated');

    switch (status) {
        case 'lose':
            elModal.innerText = 'Boooom! you lost!';
            break;
        case 'win':
            elModal.innerText = 'You are on fire!';
            break;
        case 'lost life':
            elModal.innerText = (gLivesNum == 1) ? `${gLivesNum} life remain!` : `${gLivesNum} lives remain!`;
            setTimeout(closeModal, 4000);
            break;
         case 'manual':
            elModal.innerText = `Place ${gLevel.MINES}\n mines`;
            break;
    }
}

function closeModal() {
    var elModal = document.querySelector('.modal');
    elModal.style.visibility = 'hidden';
    elModal.classList.remove('animated');
}


// MANUAL POSITIONING ZONE

function setManualMode(elCell) {
    if (!gIsFirstClick) return;

    gIsManual = true;
    if (!gManualCounter) {
        elCell.innerText = 'Start the game!';
        renderModal('manual');
        gBoard = buildBoard(gBoard);
        renderBoard(gBoard);
        for (var i = 0; i < gBoard.length; i++) {
            for (var j = 0; j < gBoard[0].length; j++) {
                console.log('hi');
                var elCell = document.querySelector(`.cell${i}-${j}`);
                elCell.classList.add('clicked');
            }
        }
        return;
    }
    if (gIsManual && gManualCounter === gLevel.MINES) {
        gIsManual = false;
        elCell.style.backgroundColor = 'black';
        elCell.innerText = 'Game is on!'
        closeModal();
        restartGame();
        setMinesNegsCount(gBoard)
        renderBoard(gBoard)
    }
}





