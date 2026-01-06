// Story Engine
document.addEventListener('DOMContentLoaded', () => {
    const titleEl = document.getElementById('story-title');
    const contentEl = document.getElementById('story-content');
    const choicesEl = document.getElementById('story-choices');
    const feedbackEl = document.getElementById('story-feedback');

    // Load dungeons data from a hardcoded object for simplicity 
    // (In a real app, we'd fetch the JSON file, but CORS/File protocol issues might block fetch)
    const dungeonsData = {
        "dungeons": [
            {
                "name": "Forest of Death",
                "grade": "SS",
                "pre": {
                    "intro": "You step into the Forest of Death. The air feels heavy and creepy.",
                    "lore": "You spot something moving in the trees. It's Orochimaru, and he doesn't look happy to see you. Better be careful."
                },
                "npcs": {
                    "orochimaru": {
                        "name": "Orochimaru",
                        "dialogue": "Well, well, look who wandered in. Think you can get out of here?",
                        "question": "The forest is full of traps. Which way do you go?",
                        "type": "riddle",
                        "riddle_dialogue": "A whisper in the trees says, 'The path to true power lies where the shadows meet the sun.'",
                        "choices": [
                            {
                                "text": "Go towards the brightest light",
                                "outcome": "failure",
                                "failure_dialogue": "You walk into a trap! Orochimaru's curse mark hurts you."
                            },
                            {
                                "text": "Search for a dark cave",
                                "outcome": "failure",
                                "failure_dialogue": "You find a cave, but it's full of snakes. Ouch!"
                            },
                            {
                                "text": "Follow the trail of ninja tools",
                                "outcome": "success",
                                "success_dialogue": "You follow the tools and find the scroll. Suddenly, a big snake shows up!"
                            }
                        ]
                    }
                }
            }
        ]
    };

    let currentDungeon = dungeonsData.dungeons[0]; // Forest of Death
    let currentPhase = 'intro'; // intro -> lore -> encounter

    function render() {
        if (currentPhase === 'intro') {
            titleEl.textContent = currentDungeon.name;
            contentEl.textContent = currentDungeon.pre.intro;
            renderButton('Next', () => {
                currentPhase = 'lore';
                render();
            });
        } else if (currentPhase === 'lore') {
            contentEl.textContent = currentDungeon.pre.lore;
            renderButton('Continue', () => {
                currentPhase = 'encounter';
                render();
            });
        } else if (currentPhase === 'encounter') {
            // Hardcoded to Orochimaru for this demo
            const npc = currentDungeon.npcs.orochimaru;
            titleEl.textContent = "Encounter: " + npc.name;
            contentEl.textContent = npc.dialogue + "\n\n" + npc.question;

            choicesEl.innerHTML = '';
            npc.choices.forEach(choice => {
                const btn = document.createElement('button');
                btn.className = 'btn-choice';
                btn.textContent = choice.text;
                btn.onclick = () => handleChoice(choice);
                choicesEl.appendChild(btn);
            });
        }
    }

    function renderButton(text, onClick) {
        choicesEl.innerHTML = '';
        const btn = document.createElement('button');
        btn.className = 'btn-primary';
        btn.textContent = text;
        btn.onclick = onClick;
        choicesEl.appendChild(btn);
    }

    function handleChoice(choice) {
        choicesEl.innerHTML = '';
        feedbackEl.classList.remove('hidden');
        if (choice.outcome === 'success') {
            feedbackEl.textContent = choice.success_dialogue;
            feedbackEl.style.color = '#4ade80'; // Green
            setTimeout(() => {
                alert("Mission Complete! You survived the Forest of Death.");
                location.href = 'index.html';
            }, 3000);
        } else {
            feedbackEl.textContent = choice.failure_dialogue;
            feedbackEl.style.color = '#f87171'; // Red
            setTimeout(() => {
                alert("Game Over.");
                location.reload();
            }, 2000);
        }
    }

    render();
});
