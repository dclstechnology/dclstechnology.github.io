document.addEventListener('DOMContentLoaded', (event) => {
    if (!window.location.href.includes("endgame.html")) {
        checkGameCompletion();
        updateColorPicker();
        logVisitedColor();
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
        var nextPage = color + ".html";
        console.log("Redirecting to color page: " + nextPage);
        window.location.href = nextPage;
    }, 500);
}

function checkGameCompletion() {
    var usedColors = JSON.parse(localStorage.getItem('usedColors')) || [];
    var allColors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

    if (usedColors.length === allColors.length) {
        console.log("All colors used. Redirecting to endgame.html.");
        window.location.href = 'endgame.html';
    }
}

function logVisitedColor() {
    var color = getColorFromUrl();
    if (color) {
        var usedColors = JSON.parse(localStorage.getItem('usedColors')) || [];
        if (!usedColors.includes(color)) {
            usedColors.push(color);
            localStorage.setItem('usedColors', JSON.stringify(usedColors));
            console.log("Visited color logged: " + color);
        }
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

function resetGame() {
    localStorage.removeItem('usedColors');
    updateColorPicker();
}
