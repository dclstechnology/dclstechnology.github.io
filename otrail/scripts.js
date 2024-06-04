document.addEventListener('DOMContentLoaded', (event) => {
    if (!window.location.href.includes("endgame.html")) {
        updateColorPicker();
    }
});

function updateColorPicker() {
    var usedColors = JSON.parse(localStorage.getItem('usedColors')) || [];
    var allColors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
    var availableColors = allColors.filter(color => !usedColors.includes(color));

    console.log("Used Colors:", usedColors);  // Debugging output
    console.log("Available Colors:", availableColors);  // Debugging output

    var box = document.querySelector('.box');
    if (box) {
        box.innerHTML = ''; // Clear existing cards

        availableColors.forEach(color => {
            var card = document.createElement('div');
            card.className = 'card ' + color;
            box.appendChild(card);
        });

        // Adjust the flex property of each card to fill the available space
        var cards = document.querySelectorAll('.card');
        cards.forEach(card => {
            card.style.flex = '1';
        });
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
        // Directly handle the last remaining color
        var lastColor = availableColors[0];
        console.log("Last color: " + lastColor); // Debugging output
        displayColor(lastColor, true); // Pass true to indicate it's the last color
    } else {
        var box = document.querySelector('.box');
        var cards = box.querySelectorAll('.card');
        var duration = 3000; // Duration in milliseconds
        var interval = 250; // Interval in milliseconds for color change
        var steps = duration / interval; // Number of steps
        var currentStep = 0;
        var intervalId = setInterval(function() {
            var color = availableColors[currentStep % availableColors.length]; // Get the next color in the cycle
            cards.forEach(function(card) {
                card.style.backgroundColor = color; // Set background color of all cards
            });
            currentStep++;
            if (currentStep >= steps) {
                clearInterval(intervalId); // Stop interval when all steps are completed
                var randomColor = availableColors[Math.floor(Math.random() * availableColors.length)]; // Randomly select a color
                console.log("Random color: " + randomColor); // Debugging output
                displayColor(randomColor, false); // Display the randomly selected color
            }
        }, interval);
    }
}

function displayColor(color, isLastColor) {
    var box = document.querySelector('.box');
    var cards = box.querySelectorAll('.card');
    cards.forEach(function(card) {
        card.style.backgroundColor = color; // Set background color of all cards to the selected color
    });

    setTimeout(function() {
        alert("You landed on " + color + "!");
        var usedColors = JSON.parse(localStorage.getItem('usedColors')) || [];
        usedColors.push(color);
        localStorage.setItem('usedColors', JSON.stringify(usedColors));

        console.log("Updated Used Colors:", usedColors);  // Debugging output

        if (!isLastColor) {
            // Ensure redirection happens after the color is added to usedColors
            window.location.href = color + ".html"; // Redirect to the color-specific puzzle page
        }
    }, 500); // Delay the pop-up message until after the color is displayed
}

function checkGameCompletion() {
    var usedColors = JSON.parse(localStorage.getItem('usedColors')) || [];
    var allColors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

    if (usedColors.length === allColors.length) {
        console.log("All colors used. Redirecting to endgame.html"); // Debugging output
        window.location.href = "endgame.html"; // Redirect to endgame page
    } else {
        console.log("Game not yet complete. Used colors:", usedColors.length); // Debugging output
    }
}

function resetGame() {
    localStorage.removeItem('usedColors');
    updateColorPicker();
}
