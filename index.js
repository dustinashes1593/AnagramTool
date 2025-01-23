let caseState = undefined;
let originalPool = "";
let pool = "";
let signature = "";
let previous = "";

const originalText = document.getElementById("originalText");
const currentPool = document.getElementById("current-pool");
const signatureDisplay = document.getElementById("signature");
const scratchPad = document.getElementById("scratchPad");
const errorDisplay = document.getElementById("error");
const originalPoolE = document.getElementById("original-pool");

let cb = document.getElementById("cbox");

cb.addEventListener("change", generatePool);

cb.checked = true;
cycle(cb);

originalText.addEventListener("input", () => {
    currentPool.value = "";
    scratchPad.value = "";
    generatePool();
});

scratchPad.addEventListener("input", updatePool);

scratchPad.addEventListener('paste', (event) => {
    event.preventDefault();

    errorDisplay.textContent = "";
    let cur = currentPool.value.toLowerCase();

    let pastedText = (event.clipboardData || window.clipboardData).getData('text');

    let data = pastedText.toLowerCase();

    for (let i = 0; i < data.length; i++) {
        let c = data[i];

        if (!isAlphabetic(c)) continue;

        if (!cur.includes(c)) {
            errorDisplay.textContent = `Character '${c}' is not in the pool!`;

            pastedText = pastedText.substring(0, i);

            break;
        }

        cur = cur.replace(c, '');

    }

    currentPool.value = groupSameLetters(cur);

    const startPos = scratchPad.selectionStart;
    const endPos = scratchPad.selectionEnd;

    if (endPos - startPos > 0) {

        currentPool.value = groupSameLetters(cur + scratchPad.value.substring(startPos, endPos).toLowerCase().replace(/[^a-zA-Z]/g, ""));

    }

    scratchPad.value = scratchPad.value.substring(0, startPos) + pastedText + scratchPad.value.substring(endPos);

    previous = scratchPad.value.toLowerCase();

    scratchPad.selectionStart = scratchPad.selectionEnd = startPos + pastedText.length;
})

function generatePool() {
    errorDisplay.textContent = "";

    pool = groupSameLetters(originalText.value);
    originalPool = pool;

    let preProcessedSignature = pool.toUpperCase().replace(/\s+/g, '').split('').sort().join('');

    const letterCounts = {};
    for (const letter of preProcessedSignature) {
        letterCounts[letter] = (letterCounts[letter] || 0) + 1;
    }

    signature = Object.entries(letterCounts)
        .map(([letter, count]) => `${count}${letter}`)
        .join(" ");

    currentPool.value = (!currentPool.value) ? pool : groupSameLetters(currentPool.value);

    signatureDisplay.textContent = signature;
    originalPoolE.textContent = originalPool;
}


function updatePool(e) {

    errorDisplay.textContent = "";
    let cur = currentPool.value.toLowerCase();

    if (e.data) {

        let data = e.data.toLowerCase().replace(/[^a-zA-Z]/g, "");

        for (c of data) {

            if (!cur.includes(c)) {
                errorDisplay.textContent = `'${c}' is not in the pool!`;
                scratchPad.value = scratchPad.value.slice(0, -1);
                currentPool.value = groupSameLetters(cur);
                previous = scratchPad.value.toLowerCase();
                return;
            }

            cur = cur.replace(c, '');

        }

        currentPool.value = groupSameLetters(cur);

    } else {

        let diff = getDifference(previous, scratchPad.value.toLowerCase());

        currentPool.value = groupSameLetters(cur + diff);

    }

    previous = scratchPad.value.toLowerCase();

}

function getDifference(str1, str2) {

    const charCounts = {};

    for (const char of str1) {
        charCounts[char] = (charCounts[char] || 0) - 1;
    }

    for (const char of str2) {
        charCounts[char] = (charCounts[char] || 0) + 1;
    }

    let result = "";
    for (const char in charCounts) {
        if (charCounts[char] !== 0) {
            result += char.repeat(Math.abs(charCounts[char]));
        }
    }

    return result;
}


function groupSameLetters(str) {
    if (!str) return "";

    switch (caseState) {
        case "lower":
            str = str.toLowerCase();
            break;
        case "upper":
            str = str.toUpperCase();
            break;
    }

    const cleanStr = str.replace(/[^a-zA-Z]/g, "");
    if (!cleanStr) return "";

    const sortedLetters = cleanStr.split("").sort();

    return sortedLetters.reduce((result, letter, index) => {
        if (index === 0 || letter !== sortedLetters[index - 1]) {
            return result + (index === 0 ? "" : " ") + letter;
        } else {
            return result + letter;
        }
    }, "");
}



function cycle(self) {
    if (self.readOnly) {
        self.checked = self.readOnly = false;
        caseState = "lower";
    }
    else
        if (!self.checked) {
            self.readOnly = self.indeterminate = true;
            caseState = "both";
        } else {
            caseState = "upper";
        }
}

function isAlphabetic(char) {
    return /^[A-Za-z]$/.test(char);
}