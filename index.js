let caseState = undefined;
let originalPool = "";
let pool = "";
let signature = "";
let previous = "";
let timeout;

const VU = ['u', 'v'];
const BASE_ANAGRAM_URL = "http://localhost:3000";
const DEBOUNCE_DELAY = 230;
const PING_DELAY = 3000;

const originalText = document.getElementById("originalText");
const currentPool = document.getElementById("current-pool");
const signatureDisplay = document.getElementById("signature");
const scratchPad = document.getElementById("scratchPad");
const errorDisplay = document.getElementById("error");
const originalPoolE = document.getElementById("original-pool");
const cb = document.getElementById("cbox");
const scratchPadHistory = document.getElementById("scratch-pad-history");
const poolIterations = document.getElementById("pool-iterations");
const iterationCounter = document.getElementById("iteration-counter");
const copyCurrentPoolBtn = document.getElementById("copyCurrentPoolBtn");
const anagramGenerator = document.getElementById("anagram-generator");
const anagramWords = document.getElementById("anagram-words");
const anagramsList = document.getElementById("anagrams-list");

anagramWords.addEventListener("input", function () {

    clearTimeout(timeout);

    timeout = setTimeout(() => {
        find_anagrams(anagramWords.value);
    }, DEBOUNCE_DELAY);
});

copyCurrentPoolBtn.addEventListener('click', copyCurrentPool);
copyCurrentPoolBtn.appendChild(getCopySVGIcon());

cb.addEventListener("change", () => {
    generatePool();
    buildPoolIterations();

});


cb.checked = true;
reset_anagram_module();
cycle(cb);
setInterval(ping_anagram_server, PING_DELAY);

currentPool.addEventListener("input", () => {

    if (scratchPad.value)
        scratchPadHistory.innerHTML = "<u>" + scratchPad.value + "</u><br/><br/>" + scratchPadHistory.textContent;

    scratchPad.select();
    document.execCommand("delete");

    currentPool.value = groupSameLetters(currentPool.value);

    currentPool.focus();
    currentPool.selectionStart = currentPool.value.length;

    buildPoolIterations();

});

originalText.addEventListener("input", () => {
    setCurrentPoolValue("");
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
            errorDisplay.textContent = `${c}' is not in the pool!`;

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

    let diff = "";
    let cur = currentPool.value.toLowerCase();


    switch (e.inputType) {
        case "deleteByDrag":
        case "insertFromDrop":
        case "historyUndo":
            scratchPad.value = previous;
            return;

    }

    if (e.data) {

        const start = scratchPad.selectionStart;
        const end = scratchPad.selectionEnd;

        let c = e.data.toLowerCase();

        if (isAlphabetic(c)) {

            if (!cur.includes(c)) {

                errorDisplay.textContent = `'${c}' is not in the pool!`;

                if (start === scratchPad.value.length) {
                    scratchPad.value = scratchPad.value.slice(0, start - 1);
                } else {
                    scratchPad.value = scratchPad.value.slice(0, start - 1) + scratchPad.value.slice(start);
                }


                if (start <= scratchPad.value.length) {
                    scratchPad.selectionStart = start - 1;
                    scratchPad.selectionEnd = start - 1;
                } else {
                    scratchPad.selectionStart = scratchPad.value.length;
                    scratchPad.selectionEnd = scratchPad.value.length;
                }

                diff = getDifference(previous, scratchPad.value.toLowerCase());


            } else {


                let d = undefined;
                let m = scratchPad.value.toLowerCase();
                if (m.includes(c)) {
                    m = m.replace(c, '');
                    d = getDifference(previous, m);
                } else {
                    d = getDifference(previous, m).replace(c, '');
                }

                cur += d;
                cur = cur.replace(c, '');
            }

        } else {
            diff = getDifference(previous, scratchPad.value.toLowerCase());

        }

    } else {

        diff = getDifference(previous, scratchPad.value.toLowerCase());

    }

    currentPool.value = groupSameLetters(cur + diff);

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


function clearEntry(id) {

    document.getElementById(id).textContent = "";

}

function buildPoolIterations() {
    poolIterations.innerHTML = "";
    iterationCounter.innerText = "0";

    let cur_pool = currentPool.value.toLowerCase();

    if (!VU.some(e => cur_pool.includes(e))) return;

    let iterations = new Set();
    iterations.add(cur_pool);

    let queue = [cur_pool];

    while (queue.length > 0) {
        let current = queue.shift();

        // U/V interchange
        for (let i = 0; i < current.length; i++) {
            if (current[i] === 'u') {
                let newIteration = current.substring(0, i) + 'v' + current.substring(i + 1);
                if (!iterations.has(newIteration)) {
                    iterations.add(newIteration);
                    queue.push(newIteration);
                }
            } else if (current[i] === 'v') {
                let newIteration = current.substring(0, i) + 'u' + current.substring(i + 1);
                if (!iterations.has(newIteration)) {
                    iterations.add(newIteration);
                    queue.push(newIteration);
                }
            }
        }

        let cur_sorted = current.split("").sort().join("");

        for (let i = 0; i < cur_sorted.length - 1; i++) {

            if ((cur_sorted[i] == 'u' || cur_sorted[i] == 'v') && (cur_sorted[i + 1] == 'u' || cur_sorted[i + 1] == 'v')) {

                let newIteration = cur_sorted.substring(0, i) + 'w' + cur_sorted.substring(i + 2);
                if (!iterations.has(newIteration)) {
                    iterations.add(newIteration);
                    queue.push(newIteration);
                }

            }

        }

    }

    let iterationsArray = Array.from(iterations);

    for (let i = 0; i < iterationsArray.length; i++) {
        iterationsArray[i] = groupSameLetters(iterationsArray[i].toUpperCase());
    }

    iterationsArray = [...new Set(iterationsArray)];

    iterationCounter.innerText = iterationsArray.length;


    buildIterationUI(iterationsArray);


    //console.log(iterationsArray);
    return iterationsArray;
}


function buildIterationUI(iterationArray) {

    for (let i = 0; i < iterationArray.length; i++) {

        const rowDiv = document.createElement('div');
        rowDiv.id = `row-div-${i}`;
        rowDiv.classList.add('row-div');

        const rowDivText = document.createElement('div');
        rowDivText.classList.add('row-div-text');
        rowDivText.textContent = iterationArray[i];

        const rowDivButtons = document.createElement('div');
        rowDivButtons.classList.add('row-div-buttons');


        const btnSetAsCurrentPool = document.createElement('button');
        btnSetAsCurrentPool.id = `set-as-current-pool-${i}`;
        const svg1 = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg1.setAttribute('viewBox', '0 0 24 24');
        svg1.setAttribute('fill', 'none');
        const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path1.setAttribute('d', 'M9.66088 8.53078C9.95402 8.23813 9.95442 7.76326 9.66178 7.47012C9.36913 7.17698 8.89426 7.17658 8.60112 7.46922L9.66088 8.53078ZM4.47012 11.5932C4.17698 11.8859 4.17658 12.3607 4.46922 12.6539C4.76187 12.947 5.23674 12.9474 5.52988 12.6548L4.47012 11.5932ZM5.51318 11.5771C5.21111 11.2936 4.73648 11.3088 4.45306 11.6108C4.16964 11.9129 4.18475 12.3875 4.48682 12.6709L5.51318 11.5771ZM8.61782 16.5469C8.91989 16.8304 9.39452 16.8152 9.67794 16.5132C9.96136 16.2111 9.94625 15.7365 9.64418 15.4531L8.61782 16.5469ZM5 11.374C4.58579 11.374 4.25 11.7098 4.25 12.124C4.25 12.5382 4.58579 12.874 5 12.874V11.374ZM15.37 12.124V12.874L15.3723 12.874L15.37 12.124ZM17.9326 13.1766L18.4614 12.6447V12.6447L17.9326 13.1766ZM18.25 15.7351C18.2511 16.1493 18.5879 16.4841 19.0021 16.483C19.4163 16.4819 19.7511 16.1451 19.75 15.7309L18.25 15.7351ZM8.60112 7.46922L4.47012 11.5932L5.52988 12.6548L9.66088 8.53078L8.60112 7.46922ZM4.48682 12.6709L8.61782 16.5469L9.64418 15.4531L5.51318 11.5771L4.48682 12.6709ZM5 12.874H15.37V11.374H5V12.874ZM15.3723 12.874C16.1333 12.8717 16.8641 13.1718 17.4038 13.7084L18.4614 12.6447C17.6395 11.8276 16.5267 11.3705 15.3677 11.374L15.3723 12.874ZM17.4038 13.7084C17.9435 14.245 18.2479 14.974 18.25 15.7351L19.75 15.7309C19.7468 14.572 19.2833 13.4618 18.4614 12.6447L17.4038 13.7084Z');
        path1.setAttribute('fill', '#000000');
        svg1.appendChild(path1);
        btnSetAsCurrentPool.addEventListener('click', (e) => {
            e.stopPropagation();
            setCurrentPoolValue(iterationArray[i]);


        });
        btnSetAsCurrentPool.appendChild(svg1);

        const btnCopyToClipboard = document.createElement('button');
        btnCopyToClipboard.id = `copy-to-clipboard-${i}`;

        btnCopyToClipboard.addEventListener('click', (e) => {

            navigator.clipboard.writeText(iterationArray[i])
                .catch((err) => {
                    errorDisplay.textContent = "Could not copy to clipboard!";
                });

        });
        btnCopyToClipboard.appendChild(getCopySVGIcon());


        const btnDelete = document.createElement('button');
        btnDelete.id = `delete-iteration-${i}`;
        const svg3 = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg3.setAttribute('fill', '#000000');
        svg3.setAttribute('viewBox', '0 0 482.428 482.429');
        const path3_1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path3_1.setAttribute('d', 'M381.163,57.799h-75.094C302.323,25.316,274.686,0,241.214,0c-33.471,0-61.104,25.315-64.85,57.799h-75.098c-30.39,0-55.111,24.728-55.111,55.117v2.828c0,23.223,14.46,43.1,34.83,51.199v260.369c0,30.39,24.724,55.117,55.112,55.117h210.236c30.389,0,55.111-24.729,55.111-55.117V166.944c20.369-8.1,34.83-27.977,34.83-51.199v-2.828C436.274,82.527,411.551,57.799,381.163,57.799z M241.214,26.139c19.037,0,34.927,13.645,38.443,31.66h-76.879C206.293,39.783,222.184,26.139,241.214,26.139z M375.305,427.312c0,15.978-13,28.979-28.973,28.979H136.096c-15.973,0-28.973-13.002-28.973-28.979V170.861h268.182V427.312z M410.135,115.744c0,15.978-13,28.979-28.973,28.979H101.266c-15.973,0-28.973-13.001-28.973-28.979v-2.828c0-15.978,13-28.979,28.973-28.979h279.897c15.973,0,28.973,13.001,28.973,28.979V115.744z');
        const path3_2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path3_2.setAttribute('d', 'M171.144,422.863c7.218,0,13.069-5.853,13.069-13.068V262.641c0-7.216-5.852-13.07-13.069-13.07c-7.217,0-13.069,5.854-13.069,13.07v147.154C158.074,417.012,163.926,422.863,171.144,422.863z');
        const path3_3 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path3_3.setAttribute('d', 'M241.214,422.863c7.218,0,13.07-5.853,13.07-13.068V262.641c0-7.216-5.854-13.07-13.07-13.07c-7.217,0-13.069,5.854-13.069,13.07v147.154C228.145,417.012,233.996,422.863,241.214,422.863z');
        const path3_4 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path3_4.setAttribute('d', 'M311.284,422.863c7.217,0,13.068-5.853,13.068-13.068V262.641c0-7.216-5.852-13.07-13.068-13.07c-7.219,0-13.07,5.854-13.07,13.07v147.154C298.213,417.012,304.067,422.863,311.284,422.863z');
        svg3.appendChild(path3_1);
        svg3.appendChild(path3_2);
        svg3.appendChild(path3_3);
        svg3.appendChild(path3_4);
        btnDelete.addEventListener('click', e => {

            const result = window.confirm(`Are you sure you want to delete this iteration?\n${iterationArray[i]}`);
            if (!result) return;

            const rowDiv = document.getElementById(`row-div-${i}`);
            if (!rowDiv) return;
            rowDiv.remove();

            iterationCounter.innerText = parseInt(iterationCounter.innerText) - 1;

        });
        btnDelete.appendChild(svg3);

        rowDivButtons.appendChild(btnSetAsCurrentPool);
        rowDivButtons.appendChild(btnCopyToClipboard);
        rowDivButtons.appendChild(btnDelete);

        rowDiv.appendChild(rowDivText);
        rowDiv.appendChild(rowDivButtons);

        poolIterations.appendChild(rowDiv);

    }

}

function setCurrentPoolValue(val) {

    previous = "";
    currentPool.value = val;
    scratchPad.value = "";
    generatePool();
    buildPoolIterations();

}


function copyCurrentPool() {

    navigator.clipboard.writeText(currentPool.value)
        .catch((err) => {
            errorDisplay.textContent = "Could not copy to clipboard!";
        });

}

function getCopySVGIcon() {

    const svg2 = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg2.setAttribute('viewBox', '0 0 24 24');
    svg2.setAttribute('fill', 'none');
    const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path2.setAttribute('d', 'M8 5.00005C7.01165 5.00082 6.49359 5.01338 6.09202 5.21799C5.71569 5.40973 5.40973 5.71569 5.21799 6.09202C5 6.51984 5 7.07989 5 8.2V17.8C5 18.9201 5 19.4802 5.21799 19.908C5.40973 20.2843 5.71569 20.5903 6.09202 20.782C6.51984 21 7.07989 21 8.2 21H15.8C16.9201 21 17.4802 21 17.908 20.782C18.2843 20.5903 18.5903 20.2843 18.782 19.908C19 19.4802 19 18.9201 19 17.8V8.2C19 7.07989 19 6.51984 18.782 6.09202C18.5903 5.71569 18.2843 5.40973 17.908 5.21799C17.5064 5.01338 16.9884 5.00082 16 5.00005M8 5.00005V7H16V5.00005M8 5.00005V4.70711C8 4.25435 8.17986 3.82014 8.5 3.5C8.82014 3.17986 9.25435 3 9.70711 3H14.2929C14.7456 3 15.1799 3.17986 15.5 3.5C15.8201 3.82014 16 4.25435 16 4.70711V5.00005M12 11V17M9 14H15');
    path2.setAttribute('stroke', '#000000');
    path2.setAttribute('stroke-width', '2');
    path2.setAttribute('stroke-linecap', 'round');
    path2.setAttribute('stroke-linejoin', 'round');
    svg2.appendChild(path2);

    return svg2;

}

async function ping_anagram_server() {

    try {
        await fetch(BASE_ANAGRAM_URL + '/health', { signal: AbortSignal.timeout(1000) }).then((response) => {
            if (response.ok) {
                anagramGenerator.classList.remove('disabled-container');

            } else {
                reset_anagram_module();

            }
        });

    } catch (e) {

        reset_anagram_module();

    }

}

function find_anagrams(word) {

    word = word.trim();

    if (!word) {
        reset_anagram_module();
        return;
    }

    fetch(`${BASE_ANAGRAM_URL}/words/anagrams?word=${encodeURIComponent(word)}`)
        .then(response => response.json())
        .then(data => {

            anagramsList.innerHTML = "";

            for (let anagram of data) {

                const anagram_div = document.createElement('div');
                const id = `anagram-${anagram.id}`
                anagram_div.id = id;
                anagram_div.innerText = anagram.word;
                anagram_div.classList.add('anagram-word');
                anagram_div.draggable = true;
                anagram_div.ondragstart = drag;
                anagram_div.addEventListener('click', () => {

                    navigator.clipboard.writeText(anagram.word)
                        .catch((_err) => {
                            errorDisplay.textContent = "Could not copy to clipboard!";
                        });

                })

                const delete_word = document.createElement('button');
                delete_word.classList.add('delete-word');
                delete_word.addEventListener('click', async () => {

                    const result = window.confirm(`Are you sure you want to delete this word '${anagram.word}' from the database?`);
                    if (!result) return;


                    await fetch(`${BASE_ANAGRAM_URL}/words/${anagram.id}`, {
                        method: "DELETE"
                    })
                        .then((response) => {

                            if (response.ok) {
                                const word_div = document.getElementById(id);
                                if (!word_div) return;

                                word_div.remove();
                            }

                        })
                        .catch((error) => {
                            console.error(error);
                            errorDisplay.textContent = "Could not delete this word!";
                        });


                });
                anagram_div.appendChild(delete_word);

                anagramsList.appendChild(anagram_div);
            }


        })
        .catch(error => {
            console.error("API request error:", error);
        });

}

function reset_anagram_module() {

    anagramGenerator.classList.add('disabled-container');
    anagramWords.value = "";
    anagramsList.innerHTML = "No items.";

}

function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.innerText);
}


