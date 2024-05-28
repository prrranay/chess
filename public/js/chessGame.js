const socket = io();
const chess = new Chess();

const info = document.querySelector(".info");
const boardElement = document.querySelector(".chessBoard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = "";
    board.forEach((row, index) => {
        row.forEach((piece, pieceIndex) => {
            const square = document.createElement("div");
            square.classList.add("square", (index + pieceIndex) % 2 === 0 ? "light" : "dark");

            square.dataset.row = index;
            square.dataset.col = pieceIndex;
            if (piece) {
                const pieceElement = document.createElement("div");
                pieceElement.classList.add("piece", piece.color === "w" ? "white" : "black");
                pieceElement.innerHTML = getPieceUnicode(piece);
                pieceElement.draggable = playerRole === piece.color;

                pieceElement.addEventListener("dragstart", (e) => {
                    if (pieceElement.draggable) {
                        draggedPiece = pieceElement;
                        sourceSquare = { row: index, col: pieceIndex };
                        e.dataTransfer.setData("text/plain", "");
                    }
                });

                pieceElement.addEventListener("touchstart", (e) => {
                    if (pieceElement.draggable) {
                        draggedPiece = pieceElement;
                        sourceSquare = { row: index, col: pieceIndex };
                        e.preventDefault();
                    }
                });

                pieceElement.addEventListener("dragend", () => {
                    draggedPiece = null;
                    sourceSquare = null;
                });

                pieceElement.addEventListener("touchend", (e) => {
                    e.preventDefault();
                    if (draggedPiece) {
                        const touch = e.changedTouches[0];
                        const targetElement = document.elementFromPoint(touch.clientX, touch.clientY).closest(".square");
                        if (targetElement) {
                            const targetSquare = {
                                row: parseInt(targetElement.dataset.row),
                                col: parseInt(targetElement.dataset.col)
                            };
                            handleMove(sourceSquare, targetSquare);
                        }
                        draggedPiece = null;
                        sourceSquare = null;
                    }
                });

                square.appendChild(pieceElement);
            }

            square.addEventListener("dragover", (e) => {
                e.preventDefault();
            });

            square.addEventListener("touchmove", (e) => {
                e.preventDefault();
            });

            square.addEventListener("drop", (e) => {
                const targetElement = e.target.closest(".square");
                if (!targetElement) return;
                e.preventDefault();
                if (draggedPiece) {
                    const targetSquare = {
                        row: parseInt(targetElement.dataset.row),
                        col: parseInt(targetElement.dataset.col)
                    };
                    handleMove(sourceSquare, targetSquare);
                }
            });

            boardElement.appendChild(square);
        });
    });
    if (playerRole === "b") {
        boardElement.classList.add("flipped");
    } else {
        boardElement.classList.remove("flipped");
    }
};

const handleMove = (source, target) => {
    const move = {
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
        promotion: "q"
    };
    socket.emit("move", move);
};

const getPieceUnicode = (piece) => {
    const chessPiecesUnicode = {
        k: '\u2654', // white king
        q: '\u2655', // white queen
        r: '\u2656', // white rook
        b: '\u2657', // white bishop
        n: '\u2658', // white knight
        p: '\u2659', // white pawn
        K: '\u265A', // black king
        Q: '\u265B', // black queen
        R: '\u265C', // black rook
        B: '\u265D', // black bishop
        N: '\u265E', // black knight
        P: '\u265F'  // black pawn
    };
    return chessPiecesUnicode[piece.type] || "";
};

socket.on("playerRole", function (role) {
    playerRole = role;
    if (role === 'w') {
        info.innerText = "You're White";
    } else if (role === 'b') {
        info.innerText = "You're Black";
    }
    renderBoard();
});

socket.on("spectatorRole", function () {
    playerRole = null;
    info.innerText = "Spectator";
    renderBoard();
});

socket.on("boardState", function (fen) {
    chess.load(fen);
    renderBoard();
});

socket.on("move", function (move) {
    chess.move(move);
    renderBoard();
});

socket.on("whiteMove", function () {
    info.innerText = "White's Turn";
    renderBoard();
});

socket.on("blackMove", function () {
    info.innerText = "Black's Turn";
    renderBoard();
});

socket.on("invalidMove", function (move) {
    console.log(move);
    info.innerText = `Invalid move: from ${move.from} to ${move.to}`;
    renderBoard();
});

renderBoard();
