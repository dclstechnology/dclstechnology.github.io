document.addEventListener('DOMContentLoaded', (event) => {
    updateColorPicker();
});

function updateColorPicker() {
    var usedColors = JSON.parse(localStorage.getItem('usedColors')) || [];
    var allColors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
    var availableColors = allColors.filter(color => !usedColors.includes(color));

    console.log("Used Colors:", usedColors);  // Debugging output
    console.log("Available Colors:", availableColors);  // Debugging output

    var box = document.querySelector('.box');
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

function startAnimation() {
    var usedColors = JSON.parse(localStorage.getItem('usedColors')) || [];
    var allColors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
    var availableColors = allColors.filter(color => !usedColors.includes(color));

    if (availableColors.length === 0) {
        alert("No more colors available!");
        return;
    }

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
            displayColor(randomColor); // Display the randomly selected color
        }
    }, interval);
}

function displayColor(color) {
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

        // Redirect after ensuring the new color is added
        var allColors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
        if (usedColors.length < allColors.length) {
            window.location.href = color + ".html"; // Redirect to the color-specific puzzle page
        } else if (usedColors.length === allColors.length) { // Check if all 6 colors have been used
            window.location.href = "endgame.html"; // Redirect to endgame page
        }
    }, 500); // Delay the pop-up message until after the color is displayed
}

function resetGame() {
    localStorage.removeItem('usedColors');
    updateColorPicker();
}
