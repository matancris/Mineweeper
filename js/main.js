'use strict';


//minesweeper game by 101computing.net - www.101computing.et/minesweeper-in-javascript/
const MINE = '💣';
const MARK = '🚩'
var gBoard;
var gGame = {
    isOn: false,
    shownCount: 0,
    markedCount: 0,
    secsPassed: 0
}
var gLevel = {
    SIZE: 4,
    MINES: 2
};
var gClickCounter = 0; //using it to check if the user starte the game to activate the timer.
var gIntervalTimer;
var gStartTime;

function selectLevel() {
    var elLevel = document.querySelector('.dificulty')
    var level = elLevel.options;

    if (level[0].selected) {
        gLevel.SIZE = 4
        gLevel.MINES = 2
    }
    else if (level[1].selected) {
        gLevel.SIZE = 8
        gLevel.MINES = 2
    }
    else if (level[2].selected) {
        gLevel.SIZE = 12
        gLevel.MINES = 2
    }
    init()
}


function init() {
    console.log(gClickCounter);
    //restarting the elements in the game
    var elTimer = document.querySelector('.timer');
    elTimer.style.visibility = 'hidden';
    gStartTime = 0;
    gIntervalTimer = 0
    gClickCounter = 0;
    var elSmiley = document.querySelector('.smiley')
    elSmiley.innerText = '😀';
    console.log(gClickCounter);

    gBoard = buildBoard(gBoard);
    addMines(gBoard)
    setMinesNegsCount(gBoard)
    renderBoard(gBoard)


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

            }
                ;
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



function addMines(board) {
    // add mines randomly to the board according to the number of mines that in the mines array
    var minesNum = gLevel.MINES;
    for (var i = 0; i < minesNum; i++) {
        var randomRow = getRandomInt(0, gLevel.SIZE);
        var randomCol = getRandomInt(0, gLevel.SIZE);
        var cell = board[randomRow][randomCol];
        if (cell.isMine) minesNum++;

        cell.isMine = true;
        cell.minesAroundCoun = MINE

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
    if (gBoard[i][j].isMarked || gBoard[i][j].isShown) return
    //this "if" happens only on the first click
    if (!gClickCounter) {
        gStartTime = Date.now();
        var elTimer = document.querySelector('.timer');
        elTimer.style.visibility = 'visible';
        gIntervalTimer = setInterval(setTimer, 20)

        //this "if" happens if the first click is on a mine
        if (gBoard[i][j].isMine) {
            gBoard = buildBoard(gBoard);
            addMines(gBoard)
            setMinesNegsCount(gBoard)
            renderBoard(gBoard)
        }
    }
    gClickCounter = 1;
    elCell.classList.add('clicked');
    gBoard[i][j].isShown = true;
    if (gBoard[i][j].isMine) {
        elCell.classList.add('mine')
        revealMines(gBoard)
        gameOver(false)
        return
    }
    if (gBoard[i][j].minesAroundCount === ' ') {
        // elCell.classList.add('clicked');
        revealNegs(i, j, gBoard);


    }
    checkGameOver()
}

// for (var i = 0; i < gBoard.length; i++){
//     for (var j = 0; j < gBoard[0].length; j++){
//         if (gBoard[i][j].minesAroundCount === ' '){

//             cellClicked(elCell, i, j)

//         }
//     }
// }
// if (mineCount == 0) {
//     //Reveal all adjacent cells as they do not have a mine
//     for (var i = Math.max(cellRow - 1, 0); i <= Math.min(cellRow + 1, 9); i++) {
//         for (var j = Math.max(cellCol - 1, 0); j <= Math.min(cellCol + 1, 9); j++) {
//             //Recursive Call
//             if (grid.rows[i].cells[j].innerHTML == "") clickCell(grid.rows[i].cells[j]);



function revealNegs(cellI, cellJ, mat) {
    // reveals the neighbors of the cell if its not a mine
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= mat.length) continue;
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (i === cellI && j === cellJ) continue;
            if (j < 0 || j >= mat[i].length) continue;
            if (!mat[i][j].isMine) {
                mat[i][j].isShown = true;
                var elCell = document.querySelector(`.cell${i}-${j}`)
                elCell.classList.add('clicked')
                cellClicked(elCell, i, j);
            }
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

function setTimer() {
    var currTime = Date.now()
    var diffTime = new Date(currTime - gStartTime)
    var pritedTime = diffTime.getSeconds() + '.' + diffTime.getMilliseconds();
    var elTimer = document.querySelector('.timer');
    elTimer.innerText = 'Timer:\n' + pritedTime;
    //  return pritedTime;
}

function checkGameOver() {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            var cell = gBoard[i][j];
            if (!cell.isShown && !cell.isMine ||
                cell.isMine && !cell.isMarked) return;
        }
    }
    gameOver(true)
}

function gameOver(isWin) {
    clearInterval(gIntervalTimer);
    console.log(gIntervalTimer);
    var elSmiley = document.querySelector('.smiley')
    if (!isWin) {
        elSmiley.innerText = '🤕';
    } else if (isWin) {
        elSmiley.innerText = '🥳';

    }

}




////////////////////////////////////////////////////////////////////////////////////////////////////////


// function checkLevelCompletion() {
//     var levelComplete = true;
//     for (var i = 0; i < 10; i++) {
//         for (var j = 0; j < 10; j++) {
//             if ((grid.rows[i].cells[j].getAttribute("data-mine") == "false") && (grid.rows[i].cells[j].innerHTML == "")) levelComplete = false;
//         }
//     }
//     if (levelComplete) {
//         alert("You Win!");
//         revealMines();
//     }
// }

function clickCell(cell) {
    //Check if the end-user clicked on a mine
    if (cell.getAttribute("data-mine") == "true") {
        revealMines();
        alert("Game Over");
    } else {
        cell.className = "clicked";
        //Count and display the number of adjacent mines
        var mineCount = 0;
        var cellRow = cell.parentNode.rowIndex;
        var cellCol = cell.cellIndex;
        //alert(cellRow + " " + cellCol);
        for (var i = Math.max(cellRow - 1, 0); i <= Math.min(cellRow + 1, 9); i++) {
            for (var j = Math.max(cellCol - 1, 0); j <= Math.min(cellCol + 1, 9); j++) {
                if (grid.rows[i].cells[j].getAttribute("data-mine") == "true") mineCount++;
            }
        }
        cell.innerHTML = mineCount;
        if (mineCount == 0) {
            //Reveal all adjacent cells as they do not have a mine
            for (var i = Math.max(cellRow - 1, 0); i <= Math.min(cellRow + 1, 9); i++) {
                for (var j = Math.max(cellCol - 1, 0); j <= Math.min(cellCol + 1, 9); j++) {
                    //Recursive Call
                    if (grid.rows[i].cells[j].innerHTML == "") clickCell(grid.rows[i].cells[j]);
                }
            }
        }
        checkLevelCompletion();
    }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
