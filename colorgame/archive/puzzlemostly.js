document.addEventListener('DOMContentLoaded', (event) => {
    const color = getColorFromUrl();
    console.log("Current Color from URL:", color);
    logVisitedColor(color);
    if (!window.location.href.includes("endgame.html")) {
        updateColorPicker();
        checkGameCompletion();  // Always check completion after logging the color
    }
});

// Define the riddles and answers
const riddles = {
    food: {
        riddle: "In the children's realm, where stories unfold, A clue awaits by windows old. Seek nourishment for the mind and soul, But also a treat that will make you whole.",
        answers: {
            red: "apple",
            blue: "blueberry",
            green: "broccoli",
            orange: "orange",
            purple: "grape",
            yellow: "banana"
        }
    },
    shapes: {
        riddle: "In the land of shapes, where angles play, Seek the form that matches your color today.",
        answers: {
            red: "circle",
            blue: "square",
            green: "triangle",
            orange: "rectangle",
            purple: "pentagon",
            yellow: "hexagon"
        }
    },
    vehicles: {
        riddle: "In the world of wheels, where engines roar, Find the vehicle that's your color's core.",
        answers: {
            red: "firetruck",
            blue: "police car",
            green: "tractor",
            orange: "school bus",
            purple: "motorcycle",
            yellow: "taxi"
        }
    },
    animals: {
        riddle: "In the animal kingdom, wild and free, Seek the creature that matches your color's glee.",
        answers: {
            red: "ladybug",
            blue: "whale",
            green: "frog",
            orange: "tiger",
            purple: "elephant",
            yellow: "lion"
        }
    },
    birds: {
        riddle: "In the sky, where feathers soar, Find the bird that your color wore.",
        answers: {
            red: "cardinal",
            blue: "blue jay",
            green: "parrot",
            orange: "oriole",
            purple: "peacock",
            yellow: "canary"
        }
    },
    bugs: {
        riddle: "In the world of bugs, small and spry, Find the insect that catches your eye.",
        answers: {
            red: "ladybug",
            blue: "butterfly",
            green: "grasshopper",
            orange: "beetle",
            purple: "spider",
            yellow: "bee"
        }
    }
};

document.addEventListener('DOMContentLoaded', (event) => {
    if (!window.location.href.includes("endgame.html")) {
        checkGameCompletion();
        updateColorPicker();
        logVisitedColor();
        setupPuzzle();
    }
});

function updateColorPicker() {
    var usedColors = JSON.parse(localStorage.getItem('usedColors')) || [];
    var allColors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
    var availableColors = allColors.filter(color => !usedColors.includes(color));

    console.log("Used Colors:", usedColors);
    console.log("Available Colors:", availableColors);

    var box = document.querySelector('.box');
    if (box) {
        box.innerHTML = ''; // Clear existing cards

        availableColors.forEach(color => {
            var card = document.createElement('div');
            card.className = 'card ' + color;
            card.style.flex = '1';
            box.appendChild(card);
        });

        // Remove existing event listener to prevent duplication
        box.removeEventListener('click', startAnimation);
        if (availableColors.length > 0) {
            box.addEventListener('click', startAnimation);
        }
    }
}

let isAnimating = false;

function startAnimation() {
    if (isAnimating) return;
    isAnimating = true;

    completePage();  // Mark the current page as completed

    var usedColors = JSON.parse(localStorage.getItem('usedColors')) || [];
    var allColors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
    var availableColors = allColors.filter(color => !usedColors.includes(color));

    if (availableColors.length === 0) {
        alert("No more colors available!");
        isAnimating = false;
        return;
    } else if (availableColors.length === 1) {
        var lastColor = availableColors[0];
        displayColor(lastColor, true);
    } else {
        var box = document.querySelector('.box');
        var cards = box.querySelectorAll('.card');
        var duration = 3000;
        var interval = 250;
        var steps = duration / interval;
        var currentStep = 0;
        var intervalId = setInterval(function() {
            var color = availableColors[currentStep % availableColors.length];
            cards.forEach(function(card) {
                card.style.backgroundColor = color;
            });
            currentStep++;
            if (currentStep >= steps) {
                clearInterval(intervalId);
                var randomColor = availableColors[Math.floor(Math.random() * availableColors.length)];
                displayColor(randomColor, availableColors.length === 1);
                isAnimating = false;
            }
        }, interval);
    }
}

function displayColor(color, isLastColor) {
    var box = document.querySelector('.box');
    var cards = box.querySelectorAll('.card');
    cards.forEach(function(card) {
        card.style.backgroundColor = color;
    });

    setTimeout(function() {
        alert("You landed on " + color + "!");
        var nextPage = color + ".html";
        console.log("Redirecting to color page: " + nextPage);
        window.location.href = nextPage;
    }, 500);
}

function checkGameCompletion() {
    var usedColors = JSON.parse(localStorage.getItem('usedColors')) || [];
    var completedPages = JSON.parse(localStorage.getItem('completedPages')) || [];
    var allColors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

    console.log("Checking game completion.");
    console.log("Used Colors Length:", usedColors.length);
    console.log("Completed Pages Length:", completedPages.length);

    if (usedColors.length === allColors.length && completedPages.length === allColors.length) {
        console.log("All colors used and pages completed. Redirecting to endgame.html.");
        window.location.href = 'endgame.html';
    }
}

function logVisitedColor(color) {
    var usedColors = JSON.parse(localStorage.getItem('usedColors')) || [];
    if (color && !usedColors.includes(color) && color !== 'endgame') {
        usedColors.push(color);
        localStorage.setItem('usedColors', JSON.stringify(usedColors));
        console.log("Visited color logged: " + color);
        console.log("Updated Used Colors after logging:", usedColors);
    } else if (!color) {
        console.log("No color to log.");
    }
}

function logPageCompletion(color) {
    var completedPages = JSON.parse(localStorage.getItem('completedPages')) || [];
    if (color && !completedPages.includes(color)) {
        completedPages.push(color);
        localStorage.setItem('completedPages', JSON.stringify(completedPages));
        console.log("Page completed logged: " + color);
        console.log("Updated Completed Pages after logging:", completedPages);
    }
}

function completePage() {
    var color = getColorFromUrl();
    if (color) {
        logPageCompletion(color);
        console.log("Puzzle for " + color + " completed!");
        checkGameCompletion();  // Check game completion after logging the page completion
    }
}

function getColorFromUrl() {
    var url = window.location.href;
    var colorPages = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
    for (var i = 0; i < colorPages.length; i++) {
        if (url.includes(colorPages[i] + ".html")) {
            return colorPages[i];
        }
    }
    if (url.includes("endgame.html")) {
        return 'endgame';
    }
    return null;
}

function setupPuzzle() {
    var color = getColorFromUrl();
    if (!color) return;
    
    var usedCategories = JSON.parse(localStorage.getItem('usedCategories')) || {};
    if (!usedCategories[color]) {
        usedCategories[color] = [];
    }

    var availableCategories = Object.keys(riddles).filter(cat => !usedCategories[color].includes(cat));
    if (availableCategories.length === 0) {
        // All categories have been used for this color
        alert("All categories have been used for this color!");
        return;
    }

    var randomCategory = availableCategories[Math.floor(Math.random() * availableCategories.length)];
    usedCategories[color].push(randomCategory);
    localStorage.setItem('usedCategories', JSON.stringify(usedCategories));

    var puzzleContainer = document.querySelector('.container');
    if (puzzleContainer) {
        puzzleContainer.innerHTML = `<h1>${color.toUpperCase()} PUZZLE</h1>
                                     <p>${riddles[randomCategory].riddle}</p>
                                     <input type="text" id="answerInput" placeholder="Enter your answer">
                                     <button onclick="checkAnswer('${randomCategory}', '${color}')">Submit</button>`;
    }
}

function checkAnswer(category, color) {
    var input = document.getElementById('answerInput').value.toLowerCase();
    var correctAnswer = riddles[category].answers[color].toLowerCase();

    if (input === correctAnswer) {
        logPageCompletion();
        alert("Correct! Moving to the next color.");
        window.location.href = 'colorpick.html';
    } else {
        alert("Incorrect. Try again!");
    }
}

function resetGame(event) {
    localStorage.removeItem('usedColors');
    localStorage.removeItem('completedPages');
	localStorage.removeItem('usedCategories');
    updateColorPicker();
    if (event) {
        window.location.href = 'colorgame.html';  // Redirect to index.html only if the function is called by an event (i.e., button click)
    }
}