const wordInput = document.getElementById('wordInput');
const widthInput = document.getElementById('widthInput');
const heightInput = document.getElementById('heightInput');
const canvas = document.getElementById('canvas');
const recordButton = document.getElementById('recordButton');
const gifOutput = document.getElementById('gifOutput');
const downloadButton = document.getElementById('downloadButton');
const ctx = canvas.getContext('2d');
const bgColor = document.getElementById('bgColor');
const textColor = document.getElementById('textColor');
const fontFamily = document.getElementById('fontFamily');

let currentWordIndex = 0;
let isRecording = false;
let isPlaying = false;
let timings = [];
let recordStartTime;
let playbackInterval;

function getCurrentWord() {
    const words = wordInput.value.split(' ').filter(word => word.trim() !== '');
    if (words.length === 0) return '';
    
    currentWordIndex = currentWordIndex % words.length;
    return words[currentWordIndex];
}

function stopPlayback() {
    if (playbackInterval) {
        clearTimeout(playbackInterval);
        playbackInterval = null;
    }
    isPlaying = false;
}

function startRecording() {
    isRecording = true;
    timings = [];
    currentWordIndex = 0;
    recordStartTime = Date.now();
    recordButton.textContent = 'Next Word';
    recordButton.classList.add('recording');
    
    // Show canvas, hide gif output when starting new recording
    canvas.style.display = 'block';
    gifOutput.style.display = 'none';
    
    // Hide download button when starting new recording
    downloadButton.style.display = 'none';
    
    updateCanvas();
}

function recordNextWord() {
    const currentTime = Date.now();
    timings.push(currentTime - recordStartTime);
    recordStartTime = currentTime;
    
    const words = wordInput.value.split(' ').filter(word => word.trim() !== '');
    currentWordIndex++;
    
    if (currentWordIndex >= words.length) {
        finishRecording();
    } else {
        updateCanvas();
    }
}

function finishRecording() {
    isRecording = false;
    recordButton.textContent = 'Record Timing';
    recordButton.classList.remove('recording');
    createGif();
}

function startPlayback() {
    if (timings.length === 0) return;
    
    isPlaying = true;
    currentWordIndex = 0;
    let timeIndex = 0;
    updateCanvas();

    function playNextWord() {
        if (!isPlaying) return;  // Stop if playback was cancelled
        
        currentWordIndex = (currentWordIndex + 1) % timings.length;
        timeIndex = (timeIndex + 1) % timings.length;
        
        updateCanvas();
        
        if (timeIndex === 0) {
            // Start the sequence over
            currentWordIndex = 0;
            updateCanvas();
        }
        
        playbackInterval = setTimeout(playNextWord, timings[timeIndex]);
    }
    
    // Start the first timeout
    playbackInterval = setTimeout(playNextWord, timings[0]);
}

function updateCanvas(targetCanvas = canvas) {
    const targetCtx = targetCanvas.getContext('2d');
    
    // Get current word
    const word = getCurrentWord();
    
    // Get canvas dimensions
    const width = parseInt(widthInput.value) || 64;
    const height = parseInt(heightInput.value) || 64;
    
    // Update canvas size
    targetCanvas.width = width;
    targetCanvas.height = height;
    
    // Fill background
    targetCtx.fillStyle = bgColor.value;
    targetCtx.fillRect(0, 0, width, height);
    
    if (word) {
        // Set font properties
        targetCtx.textAlign = 'center';
        targetCtx.textBaseline = 'middle';
        
        // Start with a large font size
        let fontSize = 100;
        targetCtx.font = `${fontSize}px ${fontFamily.value}`;
        
        // Measure text
        let textMetrics = targetCtx.measureText(word);
        let textWidth = textMetrics.width;
        let textHeight = fontSize;
        
        // Calculate scale factors for width and height
        const scaleWidth = (width * 0.9) / textWidth;
        const scaleHeight = (height * 0.9) / textHeight;
        
        // Use the smaller scale to ensure text fits both dimensions
        const scale = Math.min(scaleWidth, scaleHeight);
        
        // Set final font size
        fontSize = Math.floor(fontSize * scale);
        targetCtx.font = `${fontSize}px ${fontFamily.value}`;
        
        // Draw the text
        targetCtx.fillStyle = textColor.value;
        targetCtx.fillText(word, width / 2, height / 2);
    }
}

function createGif() {
    if (timings.length === 0) {
        alert('Record some timings first!');
        return;
    }

    // Create GIF encoder
    const gif = new GIF({
        workers: 2,
        quality: 10,
        width: parseInt(widthInput.value) || 64,
        height: parseInt(heightInput.value) || 64,
        workerScript: 'gif.worker.js'
    });

    // Prepare for GIF creation
    const words = wordInput.value.split(' ').filter(word => word.trim() !== '');
    let frameIndex = 0;

    function addFrame() {
        if (frameIndex >= words.length) {
            // Finish GIF creation
            gif.render();
            return;
        }

        // Create a new canvas for this frame
        const frameCanvas = document.createElement('canvas');
        currentWordIndex = frameIndex;
        
        // Update the new canvas
        updateCanvas(frameCanvas);
        
        // Add frame to GIF
        gif.addFrame(frameCanvas, {delay: timings[frameIndex]});
        frameIndex++;
        
        // Process next frame
        setTimeout(addFrame, 0);
    }

    // Start creating frames
    addFrame();

    // Handle GIF completion
    gif.on('finished', function(blob) {
        gifOutput.innerHTML = '';
        
        // Create and add the GIF image
        const img = document.createElement('img');
        img.src = URL.createObjectURL(blob);
        gifOutput.appendChild(img);

        // Update download button
        downloadButton.href = img.src;
        const filename = wordInput.value.slice(0, 100).trim().replace(/[^a-z0-9]/gi, '_') + '.gif';
        downloadButton.download = filename;
        downloadButton.style.display = 'block';

        // Hide canvas and show gif output
        canvas.style.display = 'none';
        gifOutput.style.display = 'block';
    });
}

function showCanvas() {
    canvas.style.display = 'block';
    gifOutput.style.display = 'none';
    downloadButton.style.display = 'none';
}

// Update the click handlers
canvas.addEventListener('click', () => {
    if (isPlaying) {
        stopPlayback();
    } else {
        currentWordIndex++;
        updateCanvas();
    }
});

recordButton.addEventListener('click', () => {
    if (isPlaying) {
        stopPlayback();
    }
    
    if (isRecording) {
        recordNextWord();
    } else {
        startRecording();
    }
});

// Update the text input event listener to use default canvas
wordInput.addEventListener('input', () => {
    showCanvas();
    updateCanvas();  // Uses default canvas argument
});

// Add event listeners
widthInput.addEventListener('input', () => {
    showCanvas();
    updateCanvas();
});

heightInput.addEventListener('input', () => {
    showCanvas();
    updateCanvas();
});

bgColor.addEventListener('input', () => {
    showCanvas();
    updateCanvas();
});

textColor.addEventListener('input', () => {
    showCanvas();
    updateCanvas();
});

fontFamily.addEventListener('change', () => {
    showCanvas();
    updateCanvas();
});

// Initial render
updateCanvas(); 