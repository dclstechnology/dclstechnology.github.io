document.addEventListener('DOMContentLoaded', (event) => {
    if (!window.location.href.includes("endgame.html")) {
        checkGameCompletion();
        updateColorPicker();
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

        if (availableColors.length > 0) {
            box.addEventListener('click', startAnimation);
        }
    }
}

function startAnimation() {
    var usedColors = JSON.parse(localStorage.getItem('usedColors')) || [];
    var allColors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
    var availableColors = allColors.filter(color => !usedColors.includes(color));

    if (availableColors.length === 0) {
        alert("No more colors available!");
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
                displayColor(randomColor, false);
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
        var usedColors = JSON.parse(localStorage.getItem('usedColors')) || [];
        usedColors.push(color);
        localStorage.setItem('usedColors', JSON.stringify(usedColors));

        if (isLastColor) {
            console.log("Last color used. Displaying complete puzzle button.");
            displayCompletePuzzleButton();
        } else {
            var nextPage = color + ".html";
            console.log("Redirecting to color page: " + nextPage);
            window.location.href = nextPage;
        }
    }, 500);
}

function checkGameCompletion() {
    var usedColors = JSON.parse(localStorage.getItem('usedColors')) || [];
    var allColors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

    if (usedColors.length === allColors.length) {
        console.log("All colors used. Displaying endgame button.");
        displayCompletePuzzleButton();
    }
}

function displayCompletePuzzleButton() {
    var buttonContainer = document.createElement('div');
    buttonContainer.style.marginTop = '20px';
    var completePuzzleButton = document.createElement('button');
    completePuzzleButton.innerText = 'Complete Puzzle';
    completePuzzleButton.className = 'submit-button';
    completePuzzleButton.addEventListener('click', function() {
        window.location.href = 'endgame.html';
    });
    buttonContainer.appendChild(completePuzzleButton);
    document.body.appendChild(buttonContainer);
}

function resetGame() {
    localStorage.removeItem('usedColors');
    updateColorPicker();
}
