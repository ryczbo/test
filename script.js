// Main JavaScript file
console.log('Hello World from JavaScript!');

// Audio variables
let audioContext;
let audioBuffer;
let audioSource;
let isPlaying = false;
let analyser;
let dataArray;
let animationId;

// DOM elements
let playButton;
let tableCells = [];
let cellImages = []; // Store assigned images for each cell

// Image arrays
const inactiveImages = ['zgaszone1.jpg', 'zgaszone2.jpg'];
const activeImages = ['zapalone1.jpg', 'zapalone2.jpg', 'zapalone3.jpg', 'zapalone4.jpg'];

// Initialize the application
function init() {
    console.log('Application initialized');
    
    // Get DOM elements
    playButton = document.getElementById('playButton');
    
    // Get all table cells and store them in a 2D array
    const table = document.getElementById('dataTable');
    const rows = table.querySelectorAll('tr');
    for (let i = 0; i < rows.length; i++) {
        tableCells[i] = [];
        cellImages[i] = [];
        const cells = rows[i].querySelectorAll('td');
        for (let j = 0; j < cells.length; j++) {
            tableCells[i][j] = cells[j];
            // Assign random images to this cell
            cellImages[i][j] = {
                inactive: inactiveImages[Math.floor(Math.random() * inactiveImages.length)],
                active: activeImages[Math.floor(Math.random() * activeImages.length)]
            };
        }
    }
    
    console.log('Table cells initialized:', tableCells.length, 'rows x', tableCells[0].length, 'columns');
    
    // Assign inactive images to all cells immediately
    assignInactiveImagesToAllCells();
    
    // Initialize audio context
    initAudio();
    
    // Add event listeners
    playButton.addEventListener('click', togglePlay);
}

// Assign inactive images to all cells
function assignInactiveImagesToAllCells() {
    for (let i = 0; i < tableCells.length; i++) {
        for (let j = 0; j < tableCells[i].length; j++) {
            setCellImage(tableCells[i][j], i, j, false);
        }
    }
}

// Initialize audio context and load audio file
async function initAudio() {
    try {
        // Create audio context
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create analyser node with larger FFT size for better frequency resolution
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 512; // Increased for better frequency resolution
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        
        // Load audio file
        const response = await fetch('erykah badu cowbell typeof beat.mp3');
        const arrayBuffer = await response.arrayBuffer();
        
        // Decode audio data
        audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Enable play button
        playButton.disabled = false;
        playButton.textContent = 'Play';
        
        console.log('Audio loaded successfully');
        console.log('Analyser buffer length:', bufferLength);
    } catch (error) {
        console.error('Error loading audio:', error);
        playButton.textContent = 'Error loading audio';
    }
}

// Toggle play/pause
function togglePlay() {
    if (isPlaying) {
        stopAudio();
    } else {
        playAudio();
    }
}

// Play audio
function playAudio() {
    if (!audioBuffer || !audioContext) return;
    
    // Resume audio context if suspended
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    
    // Create audio source
    audioSource = audioContext.createBufferSource();
    audioSource.buffer = audioBuffer;
    
    // Connect source to analyser, then analyser to destination
    audioSource.connect(analyser);
    analyser.connect(audioContext.destination);
    
    // Play audio
    audioSource.start(0);
    isPlaying = true;
    
    // Update button
    playButton.textContent = 'Stop';
    
    // Start frequency analysis
    startFrequencyAnalysis();
    
    // Handle audio end
    audioSource.onended = () => {
        isPlaying = false;
        playButton.textContent = 'Play';
        stopFrequencyAnalysis();
        clearVisualization();
    };
}

// Stop audio
function stopAudio() {
    if (audioSource) {
        audioSource.stop();
        audioSource = null;
    }
    isPlaying = false;
    playButton.textContent = 'Play';
    stopFrequencyAnalysis();
    clearVisualization();
}

// Start frequency analysis
function startFrequencyAnalysis() {
    console.log('Starting frequency analysis...');
    analyzeFrequency();
}

// Stop frequency analysis
function stopFrequencyAnalysis() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    console.log('Stopped frequency analysis');
}

// Clear visualization
function clearVisualization() {
    for (let i = 0; i < tableCells.length; i++) {
        for (let j = 0; j < tableCells[i].length; j++) {
            setCellImage(tableCells[i][j], i, j, false);
        }
    }
}

// Set cell image based on active state using pre-assigned images
function setCellImage(cell, row, col, isActive) {
    const assignedImage = isActive ? cellImages[row][col].active : cellImages[row][col].inactive;
    cell.style.backgroundImage = `url(${assignedImage})`;
    
    // Add brightness filter for inactive images
    if (isActive) {
        cell.classList.remove('cell-inactive');
    } else {
        cell.classList.add('cell-inactive');
    }
}

// Analyze frequency data and visualize in table
function analyzeFrequency() {
    if (!isPlaying) return;
    
    // Get frequency data
    analyser.getByteFrequencyData(dataArray);
    
    // Map frequency data to table cells
    visualizeFrequencies();
    
    // Continue analysis
    animationId = requestAnimationFrame(analyzeFrequency);
}

// Visualize frequencies in the table
function visualizeFrequencies() {
    const numColumns = tableCells[0].length; // 10 columns
    const numRows = tableCells.length; // 32 rows
    
    // Focus on human-audible frequencies (roughly 20Hz - 20kHz)
    // Map the first 10 frequency bins to the 10 columns
    // We'll use a subset of the frequency data that corresponds to audible frequencies
    
    // Use frequency bins 2-11 (skipping very low frequencies that are less audible)
    const startBin = 2;
    const endBin = startBin + numColumns;
    
    for (let col = 0; col < numColumns; col++) {
        const freqBin = startBin + col;
        const frequencyValue = dataArray[freqBin] || 0;
        
        // Map frequency value (0-255) to number of rows to color
        // Use a threshold to make visualization more responsive
        const threshold = 30; // Minimum value to start coloring
        const maxValue = 255;
        const normalizedValue = Math.max(0, frequencyValue - threshold);
        const maxPossibleValue = maxValue - threshold;
        
        // Calculate how many rows to color (0 to numRows)
        const rowsToColor = Math.floor((normalizedValue / maxPossibleValue) * numRows);
        
        // Color cells from bottom to top (reverse the row indexing)
        for (let row = 0; row < numRows; row++) {
            const cell = tableCells[row][col];
            // Check if this row should be colored (from bottom up)
            if (row >= (numRows - rowsToColor)) {
                setCellImage(cell, row, col, true);
            } else {
                setCellImage(cell, row, col, false);
            }
        }
    }
    
    // Log some frequency data for debugging
    const maxFreq = Math.max(...dataArray);
    const avgFreq = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;
    console.log('Max frequency:', maxFreq, 'Average frequency:', avgFreq.toFixed(2));
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    init();
}); 