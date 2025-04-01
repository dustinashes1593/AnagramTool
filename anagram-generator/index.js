customElements.define('anagram-generator',
    class extends HTMLElement {
        constructor() {
            super();

            const DEBOUNCE_DELAY = 240;

            this.BASE_URL = ''; //'http://localhost:3003/';

            let timeout;
            let template = document.createElement("template");

            template.innerHTML = `
                <div class="divider-item">
                  <h3>Anagram Generator</h3>
                  <div id="anagram-generator" class="display-box">
                    <div>
                      <input
                        type="text"
                        name="words"
                        id="anagram-words"
                        placeholder="Words..."
                        autocomplete="off"
                        spellcheck="false"
                      />
                    </div>
                    <div id="anagrams-list" class="display-box grower"></div>
                  </div>
                </div>
  
            `;

            const shadowRoot = this.attachShadow({ mode: 'open' });
            shadowRoot.appendChild(template.content.cloneNode(true));

            const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
            styles.forEach(style => {
                shadowRoot.appendChild(style.cloneNode(true));
            });

            this.anagramWords = shadowRoot.getElementById("anagram-words");
            this.anagramsList = shadowRoot.getElementById("anagrams-list");

            this.reset_anagram_module();

            this.anagramWords.addEventListener("input", () => {

                clearTimeout(timeout);

                timeout = setTimeout(() => {
                    this.find_anagrams(this.anagramWords.value);
                }, DEBOUNCE_DELAY);
            });

        }



        find_anagrams(word) {

            word = word.trim();

            if (!word) {
                this.reset_anagram_module();
                return;
            }

            fetch(`${this.BASE_URL}words/anagrams?word=${encodeURIComponent(word)}`)
                .then(response => response.json())
                .then(data => {

                    this.anagramsList.innerHTML = "";

                    for (let anagram of data) {

                        const anagram_div = document.createElement('div');
                        const id = `anagram-${anagram.id}`
                        anagram_div.id = id;
                        anagram_div.innerText = anagram.word;
                        anagram_div.classList.add('anagram-word');
                        anagram_div.draggable = true;
                        anagram_div.ondragstart = this.drag;
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


                            await fetch(`${this.BASE_URL}words/${anagram.id}`, {
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

                        this.anagramsList.appendChild(anagram_div);
                    }


                })
                .catch(error => {
                    this.reset_anagram_module("Unexpected Error!");
                    console.error("API request error:", error);
                });

        }

        reset_anagram_module(msg = "No items") {

            this.anagramWords.value = "";
            this.anagramsList.innerHTML = msg;

        }

        drag(ev) {
            ev.dataTransfer.setData("text", ev.target.innerText);
        }


    }
);