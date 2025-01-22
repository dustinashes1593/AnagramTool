let caseState = undefined;
let originalPool = "";
let pool = "";
let signature = "";

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





let previous = "";
function updatePool(e) {

    errorDisplay.textContent = "";
    let cur = currentPool.value.toLowerCase();





    if (e.data) {

        let data = e.data.toLowerCase().replace(/[^a-zA-Z]/g, "");



        for (c of data) {

            if (!cur.includes(c)) {
                errorDisplay.textContent = `Invalid character entered: ${c}`;

                if (e.inputType == "insertFromPaste") {

                    let f = e.data.toLowerCase().lastIndexOf(c);
                    console.log(f, e.data.substring(0, f), f <= 0 ? "" : e.data.substring(0, f));


                    scratchPad.value += e.data.substring(0, f);

                } else {

                    scratchPad.value = scratchPad.value.slice(0, -1);

                }
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



