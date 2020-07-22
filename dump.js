const board = [
  ["s", "o", "s", "o"],
  ["s", "o", "o", "s"],
  ["s", "s", "s", "s"],
];
console.log(board.length);
const word = "sos";

function wordCount(board, word) {
  let map = {};
  for (let i = 0; i < board.length; i++) {
    let item = board[i];
    map[item] = (map[item] + 1) || 1;
  }
  return map;
}

console.log(wordCount(board, "sos"));
