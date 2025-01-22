let caseState = undefined;

const originalText = document.getElementById("originalText");
const poolDisplay = document.getElementById("pool");
const signatureDisplay = document.getElementById("signature");
const scratchPad = document.getElementById("scratchPad");
const errorDisplay = document.getElementById("error");

let cb = document.getElementById("cbox");

cb.addEventListener("change", generatePool);

cb.checked = false;
cycle(cb);

originalText.addEventListener("input", generatePool);

scratchPad.addEventListener("input", updatePool);



let originalPool = "";
let pool = "";
let signature = "";

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

    poolDisplay.value = pool;

    signatureDisplay.textContent = signature;
}

function updatePool() {
    errorDisplay.textContent = "";
    let tempPool = originalPool.split(" ");
    let scratchLetters = scratchPad.value.toLowerCase().split("");


    for (let i = 0; i < scratchLetters.length; i++) {
        let found = false;
        for (let j = 0; j < tempPool.length; j++) {
            if (scratchLetters[i] === tempPool[j]) {
                tempPool.splice(j, 1);
                found = true;
                break;
            }
        }
        if (!found) {
            errorDisplay.textContent = "Invalid character entered.";
            scratchPad.value = scratchPad.value.slice(0, -1);
            return;
        }
    }
    pool = tempPool.join(" ");
    poolDisplay.textContent = pool;
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
        //console.log(caseState);

    }
    else
        if (!self.checked) {
            self.readOnly = self.indeterminate = true;
            caseState = "both";
            //console.log(caseState);

        } else {
            caseState = "upper";
            //console.log(caseState);
        }
}



