// Initialize Tone.js
let isPlaying = false;
let sequence = null;
let recorder = null;
let recordedAudio = null;
let savedPatterns = [];

// Create multiple synthesizers and effects
const mainSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: {
        type: ["sawtooth", "square", "triangle"][Math.floor(Math.random() * 3)]
    },
    envelope: {
        attack: 0.01 + Math.random() * 0.02,
        decay: 0.1 + Math.random() * 0.3,
        sustain: 0.1 + Math.random() * 0.2,
        release: 0.3 + Math.random() * 0.4
    }
}).toDestination();

// Massive bass synth
const bassSynth = new Tone.MonoSynth({
    oscillator: {
        type: "sawtooth",
        harmonicity: 4,
        modulationType: "square"
    },
    envelope: {
        attack: 0.001,
        decay: 0.4,
        sustain: 0.2,
        release: 0.5
    },
    filter: {
        type: "lowpass",
        frequency: 200,
        Q: 2
    }
}).toDestination();

// Hard kick synth
const kickSynth = new Tone.MonoSynth({
    oscillator: {
        type: "sine"
    },
    envelope: {
        attack: 0.001,
        decay: 0.2,
        sustain: 0,
        release: 0.1
    }
}).toDestination();

// Distorted guitar-like synth with more aggressive settings
const distSynth = new Tone.MonoSynth({
    oscillator: {
        type: "sawtooth",
        harmonicity: 3.5
    },
    envelope: {
        attack: 0.001,
        decay: 0.1,
        sustain: 0.4,
        release: 0.2
    }
}).toDestination();

// High-hat synth
const hihatSynth = new Tone.NoiseSynth({
    noise: {
        type: "white"
    },
    envelope: {
        attack: 0.001,
        decay: 0.1,
        sustain: 0,
        release: 0.1
    }
}).toDestination();

// Cymbal synth
const cymbalSynth = new Tone.NoiseSynth({
    noise: {
        type: "white"
    },
    envelope: {
        attack: 0.001,
        decay: 0.2,
        sustain: 0,
        release: 0.1
    }
}).toDestination();

// Create effects chain
const bassDistortion = new Tone.Distortion({
    distortion: 0.98,
    wet: 0.9
}).toDestination();

const distortion = new Tone.Distortion({
    distortion: 0.95,
    wet: 0.8
}).toDestination();

const reverb = new Tone.Reverb({
    decay: 2 + Math.random() * 4,
    wet: 0.3 + Math.random() * 0.4
}).toDestination();

const delay = new Tone.FeedbackDelay({
    delayTime: ["8n", "16n", "4n"][Math.floor(Math.random() * 3)],
    feedback: 0.3 + Math.random() * 0.4
}).toDestination();

// Connect the audio chain
mainSynth.connect(distortion);
distortion.connect(reverb);
reverb.connect(delay);
delay.toDestination();

bassSynth.connect(bassDistortion);
bassDistortion.connect(reverb);

kickSynth.connect(distortion);
distSynth.connect(distortion);
hihatSynth.connect(reverb);
cymbalSynth.connect(reverb);

// Define available notes and scales
const allNotes = ["C4", "Db4", "D4", "Eb4", "E4", "F4", "Gb4", "G4", "Ab4", "A4", "Bb4", "B4"];
const scaleTypes = {
    phrygian: { name: "Phrygian", intervals: [0, 1, 3, 5, 7, 8, 10] }, // C, Db, Eb, F, G, Ab, Bb
    harmonic: { name: "Harmonic", intervals: [0, 2, 4, 5, 7, 8, 11] }, // C, D, E, F, G, Ab, B
    diminished: { name: "Diminished", intervals: [0, 2, 3, 5, 6, 8, 9, 11] }, // C, D, Eb, F, Gb, Ab, A, B
    wholeTone: { name: "Whole Tone", intervals: [0, 2, 4, 6, 8, 10] }, // C, D, E, Gb, Ab, Bb
    pentatonic: { name: "Pentatonic", intervals: [0, 2, 4, 7, 9] } // C, D, E, G, A
};

// Initialize selected notes and scales
let selectedNotes = new Set(allNotes);
let selectedScales = new Set(Object.keys(scaleTypes));

// Function to generate a scale with specified parameters
const generateScale = (numNotes = 2, maxJump = 2, minSeparation = 1) => {
    // Filter available scale types
    const availableScaleTypes = Object.entries(scaleTypes)
        .filter(([key]) => selectedScales.has(key))
        .map(([key, value]) => ({ key, ...value }));
    
    if (availableScaleTypes.length === 0) return [];
    
    // Select a random scale type from available ones
    const scaleType = availableScaleTypes[Math.floor(Math.random() * availableScaleTypes.length)];
    const scaleIndices = scaleType.intervals;
    
    // Filter available notes
    const availableNotes = allNotes.filter(note => selectedNotes.has(note));
    if (availableNotes.length === 0) return [];
    
    // Start with a random note from available notes
    const startIndex = scaleIndices[Math.floor(Math.random() * scaleIndices.length)];
    const selectedIndices = [startIndex];
    
    // Add notes while respecting constraints
    while (selectedIndices.length < numNotes) {
        const lastIndex = selectedIndices[selectedIndices.length - 1];
        const possibleIndices = scaleIndices.filter(index => 
            Math.abs(index - lastIndex) <= maxJump && 
            Math.abs(index - lastIndex) >= minSeparation &&
            !selectedIndices.includes(index)
        );
        
        if (possibleIndices.length === 0) {
            return generateScale(numNotes, maxJump, minSeparation);
        }
        
        const randomIndex = possibleIndices[Math.floor(Math.random() * possibleIndices.length)];
        selectedIndices.push(randomIndex);
    }
    
    return selectedIndices.map(index => allNotes[index]);
};

// Generate scales with specified parameters
const generateScales = (numNotes = 2, maxJump = 2, minSeparation = 1) => {
    return {
        phrygian: generateScale(numNotes, maxJump, minSeparation),
        harmonic: generateScale(numNotes, maxJump, minSeparation),
        diminished: generateScale(numNotes, maxJump, minSeparation),
        wholeTone: generateScale(numNotes, maxJump, minSeparation),
        pentatonic: generateScale(numNotes, maxJump, minSeparation)
    };
};

// Initialize scales with default values
let scales = generateScales(2, 2, 1);
let currentMaxJump = 2;
let currentMinSeparation = 1;

// Function to update scales with new parameters
const updateScales = (numNotes, maxJump, minSeparation) => {
    scales = generateScales(numNotes, maxJump, minSeparation);
};

// Generate random note length
const getRandomNoteLength = () => {
    const lengths = ["16n", "8n", "32n"];
    return lengths[Math.floor(Math.random() * lengths.length)];
};

// Generate random velocity
const getRandomVelocity = () => {
    return 0.7 + Math.random() * 0.3; // Higher minimum velocity for more impact
};

// Add sound parameter controls
const addSoundControls = () => {
    const controlsDiv = document.getElementById('controls');
    
    // Sound Parameters Section
    const soundParamsDiv = document.createElement('div');
    soundParamsDiv.className = 'control-group';
    soundParamsDiv.innerHTML = `
        <div class="section-title">Sound Parameters</div>
        
        <div class="parameter-group">
            <label for="pitchRange">Pitch Range:</label>
            <input type="range" id="pitchRange" min="1" max="4" value="2" step="1">
            <span id="pitchRangeValue">2</span>
        </div>

        <div class="parameter-group">
            <label for="bassLevel">Bass Level:</label>
            <input type="range" id="bassLevel" min="0" max="100" value="80" step="1">
            <span id="bassLevelValue">80%</span>
        </div>

        <div class="parameter-group">
            <label for="distortionLevel">Distortion:</label>
            <input type="range" id="distortionLevel" min="0" max="100" value="80" step="1">
            <span id="distortionLevelValue">80%</span>
        </div>

        <div class="parameter-group">
            <label for="reverbLevel">Reverb:</label>
            <input type="range" id="reverbLevel" min="0" max="100" value="30" step="1">
            <span id="reverbLevelValue">30%</span>
        </div>

        <div class="parameter-group">
            <label for="delayLevel">Delay:</label>
            <input type="range" id="delayLevel" min="0" max="100" value="40" step="1">
            <span id="delayLevelValue">40%</span>
        </div>

        <div class="parameter-group">
            <label for="noteDensity">Note Density:</label>
            <input type="range" id="noteDensity" min="10" max="100" value="60" step="1">
            <span id="noteDensityValue">60%</span>
        </div>

        <div class="parameter-group">
            <label for="velocityRange">Velocity Range:</label>
            <input type="range" id="velocityRange" min="10" max="100" value="50" step="1">
            <span id="velocityRangeValue">50%</span>
        </div>
    `;
    controlsDiv.appendChild(soundParamsDiv);

    // Add event listeners for sound parameters
    const updateSoundParams = () => {
        // Update pitch range
        const pitchRange = parseInt(document.getElementById('pitchRange').value);
        document.getElementById('pitchRangeValue').textContent = pitchRange;
        
        // Update bass level
        const bassLevel = parseInt(document.getElementById('bassLevel').value) / 100;
        document.getElementById('bassLevelValue').textContent = `${Math.round(bassLevel * 100)}%`;
        bassSynth.volume.value = Tone.gainToDb(bassLevel);
        
        // Update distortion
        const distortionLevel = parseInt(document.getElementById('distortionLevel').value) / 100;
        document.getElementById('distortionLevelValue').textContent = `${Math.round(distortionLevel * 100)}%`;
        distortion.distortion = 0.5 + (distortionLevel * 0.5);
        bassDistortion.distortion = 0.7 + (distortionLevel * 0.3);
        
        // Update reverb
        const reverbLevel = parseInt(document.getElementById('reverbLevel').value) / 100;
        document.getElementById('reverbLevelValue').textContent = `${Math.round(reverbLevel * 100)}%`;
        reverb.wet.value = reverbLevel;
        
        // Update delay
        const delayLevel = parseInt(document.getElementById('delayLevel').value) / 100;
        document.getElementById('delayLevelValue').textContent = `${Math.round(delayLevel * 100)}%`;
        delay.wet.value = delayLevel;
        
        // Update note density
        const noteDensityElem = document.getElementById('noteDensity');
        const noteDensity = noteDensityElem ? parseInt(noteDensityElem.value) / 100 : 1;
        document.getElementById('noteDensityValue').textContent = `${Math.round(noteDensity * 100)}%`;
        
        // Update velocity range
        const velocityRangeElem = document.getElementById('velocityRange');
        const velocityRange = velocityRangeElem ? parseInt(velocityRangeElem.value) / 100 : 1;
        document.getElementById('velocityRangeValue').textContent = `${Math.round(velocityRange * 100)}%`;
    };

    // Add event listeners to all sound parameter controls
    const soundParams = document.querySelectorAll('.parameter-group input');
    soundParams.forEach(param => {
        param.addEventListener('input', updateSoundParams);
    });

    // Initial update
    updateSoundParams();
};

// Generate random pattern with more variations
const generateRandomPattern = (scale, length) => {
    const pattern = {
        notes: [],
        rhythm: [],
        noteLengths: [],
        velocities: [],
        scale: scale,
        timestamp: new Date().toISOString()
    };
    
    const noteDensityElem = document.getElementById('noteDensity');
    const noteDensity = noteDensityElem ? parseInt(noteDensityElem.value) / 100 : 1;
    
    const velocityRangeElem = document.getElementById('velocityRange');
    const velocityRange = velocityRangeElem ? parseInt(velocityRangeElem.value) / 100 : 1;
    
    if (!noteDensityElem) {
        console.warn('noteDensity slider not found!');
    }
    
    // Define section types with dynamic density
    const sectionTypes = {
        build: { density: 0.3 * noteDensity, velocity: 0.6 },
        drop: { density: 0.8 * noteDensity, velocity: 0.9 },
        breakdown: { density: 0.2 * noteDensity, velocity: 0.5 },
        main: { density: 0.6 * noteDensity, velocity: 0.7 }
    };
    
    // Generate sections with varying lengths
    let currentIndex = 0;
    while (currentIndex < length) {
        // Randomly choose section type
        const sectionType = Object.keys(sectionTypes)[Math.floor(Math.random() * Object.keys(sectionTypes).length)];
        const section = sectionTypes[sectionType];
        
        // Random section length between 16 and 32 steps
        const sectionLength = Math.min(16 + Math.floor(Math.random() * 16), length - currentIndex);
        
        // Generate notes for this section
        for (let i = 0; i < sectionLength; i++) {
            const rhythmChance = Math.random();
            let shouldPlay = false;
            
            if (i % 4 === 0) {
                shouldPlay = true; // Always play on main beats
            } else if (i % 2 === 0) {
                shouldPlay = rhythmChance > (1 - section.density); // Vary density based on section
            } else {
                shouldPlay = rhythmChance > (1 - section.density * 0.5); // Half density on odd beats
            }
            
            pattern.rhythm.push(shouldPlay);
            
            if (shouldPlay) {
                // Choose notes with more variation
                const noteIndex = Math.floor(Math.random() * scale.length);
                // Vary note lengths based on section
                const noteLength = sectionType === 'drop' ? 
                    (Math.random() > 0.7 ? "32n" : "16n") : // Shorter notes in drops
                    (Math.random() > 0.5 ? "8n" : "16n");   // Longer notes in other sections
                
                pattern.notes.push(scale[noteIndex]);
                pattern.noteLengths.push(noteLength);
                // Adjust velocity based on section
                pattern.velocities.push(section.velocity + Math.random() * 0.2);
            } else {
                pattern.notes.push(null);
                pattern.noteLengths.push("16n");
                pattern.velocities.push(0);
            }
        }
        
        currentIndex += sectionLength;
    }
    
    return pattern;
};

// Save pattern to local storage
const savePattern = (pattern) => {
    savedPatterns.push(pattern);
    localStorage.setItem('savedPatterns', JSON.stringify(savedPatterns));
    updatePatternList();
};

// Load patterns from local storage
const loadPatterns = () => {
    const saved = localStorage.getItem('savedPatterns');
    if (saved) {
        savedPatterns = JSON.parse(saved);
        updatePatternList();
    }
};

// Update pattern list in UI
const updatePatternList = () => {
    const patternList = document.getElementById('patternList');
    patternList.innerHTML = '';
    
    savedPatterns.forEach((pattern, index) => {
        const patternElement = document.createElement('div');
        patternElement.className = 'pattern-item';
        patternElement.innerHTML = `
            <span>Pattern ${index + 1} (${new Date(pattern.timestamp).toLocaleString()})</span>
            <button onclick="playPattern(${index})">Play</button>
            <button onclick="deletePattern(${index})">Delete</button>
        `;
        patternList.appendChild(patternElement);
    });
};

// Play a specific pattern
window.playPattern = (index) => {
    if (sequence) {
        sequence.dispose();
    }
    
    const pattern = savedPatterns[index];
    sequence = new Tone.Sequence(
        (time, i) => {
            if (pattern.rhythm[i]) {
                mainSynth.triggerAttackRelease(pattern.notes[i], "16n", time);
            }
        },
        Array.from({ length: pattern.rhythm.length }, (_, i) => i),
        "16n"
    );
    
    Tone.Transport.bpm.value = parseInt(bpmSlider.value);
    sequence.start(0);
    Tone.Transport.start();
};

// Delete a pattern
window.deletePattern = (index) => {
    savedPatterns.splice(index, 1);
    localStorage.setItem('savedPatterns', JSON.stringify(savedPatterns));
    updatePatternList();
};

// Create song structure with more variations
const createSong = (bpm) => {
    if (sequence) {
        sequence.dispose();
    }

    const scaleKeys = Object.keys(scales);
    const randomScale = scales[scaleKeys[Math.floor(Math.random() * scaleKeys.length)]];

    // Generate patterns with different lengths for different sections
    const introPattern = generateRandomPattern(randomScale, 32);  // Longer intro
    const mainPattern = generateRandomPattern(randomScale, 64);   // Extended main section
    const breakdownPattern = generateRandomPattern(randomScale, 32); // Breakdown
    const dropPattern = generateRandomPattern(randomScale, 32);   // Drop section
    const outroPattern = generateRandomPattern(randomScale, 32);  // Outro

    savePattern(introPattern);
    savePattern(mainPattern);
    savePattern(breakdownPattern);
    savePattern(dropPattern);
    savePattern(outroPattern);

    const songLength = 192; // Longer song with more sections
    const songSequence = new Tone.Sequence(
        (time, index) => {
            // Main synth pattern with sections
            if (index < 32) {
                // Intro
                if (introPattern.rhythm[index % introPattern.rhythm.length]) {
                    const noteIndex = index % introPattern.notes.length;
                    mainSynth.triggerAttackRelease(
                        introPattern.notes[noteIndex],
                        introPattern.noteLengths[noteIndex],
                        time,
                        introPattern.velocities[noteIndex]
                    );
                }
            } else if (index < 96) {
                // Main section
                if (mainPattern.rhythm[index % mainPattern.rhythm.length]) {
                    const noteIndex = index % mainPattern.notes.length;
                    mainSynth.triggerAttackRelease(
                        mainPattern.notes[noteIndex],
                        mainPattern.noteLengths[noteIndex],
                        time,
                        mainPattern.velocities[noteIndex]
                    );
                }
            } else if (index < 128) {
                // Breakdown
                if (breakdownPattern.rhythm[index % breakdownPattern.rhythm.length]) {
                    const noteIndex = index % breakdownPattern.notes.length;
                    mainSynth.triggerAttackRelease(
                        breakdownPattern.notes[noteIndex],
                        breakdownPattern.noteLengths[noteIndex],
                        time,
                        breakdownPattern.velocities[noteIndex]
                    );
                }
            } else if (index < 160) {
                // Drop
                if (dropPattern.rhythm[index % dropPattern.rhythm.length]) {
                    const noteIndex = index % dropPattern.notes.length;
                    mainSynth.triggerAttackRelease(
                        dropPattern.notes[noteIndex],
                        dropPattern.noteLengths[noteIndex],
                        time,
                        dropPattern.velocities[noteIndex]
                    );
                }
            } else {
                // Outro
                if (outroPattern.rhythm[index % outroPattern.rhythm.length]) {
                    const noteIndex = index % outroPattern.notes.length;
                    mainSynth.triggerAttackRelease(
                        outroPattern.notes[noteIndex],
                        outroPattern.noteLengths[noteIndex],
                        time,
                        outroPattern.velocities[noteIndex]
                    );
                }
            }

            // Massive bass pattern
            if (index % 8 === 0) {
                // Main bass note
                bassSynth.triggerAttackRelease("C0", "8n", time, 1.0);
            } else if (index % 4 === 2) {
                // Additional bass note
                bassSynth.triggerAttackRelease("G0", "16n", time, 0.8);
            }

            // Hard kick pattern (typical hardstyle)
            if (index % 4 === 0) {
                // Main kick
                kickSynth.triggerAttackRelease("C1", "16n", time, 1.0);
            } else if (index % 8 === 6) {
                // Off-beat kick
                kickSynth.triggerAttackRelease("C1", "16n", time, 0.8);
            }

            // Triple high-hat pattern
            if (index % 4 === 0) {
                // Main beat
                hihatSynth.triggerAttackRelease("16n", time, 0.5);
            } else if (index % 4 === 1 || index % 4 === 3) {
                // Off-beats
                hihatSynth.triggerAttackRelease("32n", time, 0.3);
            }

            // Distorted guitar-like sounds with more variations
            if (index % 8 === 0) {
                // Main distorted notes
                const note = randomScale[Math.floor(Math.random() * randomScale.length)];
                distSynth.triggerAttackRelease(note, "8n", time, 0.9);
            } else if (index % 4 === 2 && Math.random() > 0.5) {
                // Additional distorted notes
                const note = randomScale[Math.floor(Math.random() * randomScale.length)];
                distSynth.triggerAttackRelease(note, "16n", time, 0.7);
            }

            // Cymbal hits (random)
            if (Math.random() > 0.95) {
                cymbalSynth.triggerAttackRelease("16n", time, 0.3);
            }

            // Random distortion modulation
            if (Math.random() > 0.98) {
                distortion.distortion = 0.8 + Math.random() * 0.2;
                bassDistortion.distortion = 0.9 + Math.random() * 0.1;
            }
        },
        Array.from({ length: songLength }, (_, i) => i),
        "16n"
    );

    Tone.Transport.bpm.value = bpm;
    return songSequence;
};

// UI Controls
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const clearBtn = document.getElementById("clearBtn");
const bpmSlider = document.getElementById("bpm");
const bpmValue = document.getElementById("bpmValue");

// Initialize audio chain
const initAudio = () => {
    // Just start Tone.js context, do NOT create new synths/effects here!
    Tone.start();
};

// Start/Stop functionality
startBtn.addEventListener("click", async () => {
    try {
        if (!isPlaying) {
            // Start the audio context
            await Tone.start();
            console.log("Audio context started");
            
            // Initialize recorder
            recorder = new Tone.Recorder();
            Tone.Destination.connect(recorder);
            
            // Start the transport
            Tone.Transport.start();
            console.log("Transport started");
            
            // Create and start the sequence
            sequence = createSong(parseInt(bpmSlider.value));
            sequence.start(0);
            console.log("Sequence created and started");
            
            isPlaying = true;
            
            // Stop recording after 4 minutes (typical psy trance track length)
            setTimeout(async () => {
                if (isPlaying) {
                    const recording = await recorder.stop();
                    const url = URL.createObjectURL(recording);
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `psy-trance-${timestamp}.webm`;
                    a.click();
                    stopBtn.click();
                }
            }, 240000); // 4 minutes

            mainSynth.volume.value = 0;
            bassSynth.volume.value = 0;
            kickSynth.volume.value = 0;
            distSynth.volume.value = 0;
            hihatSynth.volume.value = 0;
            cymbalSynth.volume.value = 0;
        }
    } catch (error) {
        console.error("Error starting audio:", error);
    }
});
// Clear all sound
clearBtn.addEventListener("click", () => {
    // Force stop transport
    Tone.Transport.stop();
    Tone.Transport.cancel();
    
    // Stop and dispose of sequence
    if (sequence) {
        sequence.stop();
        sequence.dispose();
        sequence = null;
    }
    
    // Release all notes
    mainSynth.releaseAll();
    
    // Reset state
    isPlaying = false;
    
    // Reset UI
    bpmSlider.value = 200;
    bpmValue.textContent = "200";
    
    console.log("All sound cleared");
});

// BPM control
bpmSlider.addEventListener("input", (e) => {
    const bpm = parseInt(e.target.value);
    bpmValue.textContent = bpm;
    if (isPlaying) {
        Tone.Transport.bpm.value = bpm;
    }
});

// Audio visualization
const canvas = document.getElementById("visualizer");
const canvasCtx = canvas.getContext("2d");
const analyser = new Tone.Analyser("waveform", 256);


function draw() {
    requestAnimationFrame(draw);
    const waveform = analyser.getValue();
    
    canvasCtx.fillStyle = "rgb(0, 0, 0)";
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = "#00ff88";
    canvasCtx.beginPath();

    const sliceWidth = canvas.width / waveform.length;
    let x = 0;

    for (let i = 0; i < waveform.length; i++) {
        const v = waveform[i] * 50;
        const y = canvas.height / 2 + v;

        if (i === 0) {
            canvasCtx.moveTo(x, y);
        } else {
            canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
    }

    canvasCtx.lineTo(canvas.width, canvas.height / 2);
    canvasCtx.stroke();
}

// Initialize note and scale checkboxes
const initializeNoteAndScaleGrids = () => {
    const noteGrid = document.getElementById('noteGrid');
    const scaleGrid = document.getElementById('scaleGrid');
    
    // Add note checkboxes
    noteGrid.innerHTML = allNotes.map(note => `
        <label class="note-checkbox">
            <input type="checkbox" class="note-select" value="${note}" checked>
            ${note}
        </label>
    `).join('');
    
    // Add scale checkboxes
    scaleGrid.innerHTML = Object.entries(scaleTypes).map(([key, value]) => `
        <label class="scale-checkbox">
            <input type="checkbox" class="scale-select" value="${key}" checked>
            ${value.name}
        </label>
    `).join('');
};

// Initialize all controls
const initializeControls = () => {
    // Get all control elements
    const noteCountSlider = document.getElementById('noteCount');
    const noteCountValue = document.getElementById('noteCountValue');
    const maxJumpSlider = document.getElementById('maxJump');
    const maxJumpValue = document.getElementById('maxJumpValue');
    const minSeparationSlider = document.getElementById('minSeparation');
    const minSeparationValue = document.getElementById('minSeparationValue');
    const rootNoteSelect = document.getElementById('rootNote');
    const scaleTypeSelect = document.getElementById('scaleType');
    const octaveRangeSlider = document.getElementById('octaveRange');
    const octaveRangeValue = document.getElementById('octaveRangeValue');
    const scaleModeSelect = document.getElementById('scaleMode');
    const bpmSlider = document.getElementById('bpm');
    const bpmValue = document.getElementById('bpmValue');
    
    // Function to update all controls
    const updateAllControls = () => {
        const numNotes = parseInt(noteCountSlider.value);
        const maxJump = parseInt(maxJumpSlider.value);
        const minSeparation = parseInt(minSeparationSlider.value);
        
        // Ensure maxJump is always greater than minSeparation
        if (maxJump <= minSeparation) {
            maxJumpSlider.value = minSeparation + 1;
            maxJumpValue.textContent = minSeparation + 1;
        }
        
        noteCountValue.textContent = numNotes;
        maxJumpValue.textContent = maxJump;
        minSeparationValue.textContent = minSeparation;
        octaveRangeValue.textContent = octaveRangeSlider.value;
        bpmValue.textContent = bpmSlider.value;
        
        // Update selected notes and scales
        selectedNotes = new Set();
        document.querySelectorAll('.note-select').forEach(checkbox => {
            if (checkbox.checked) {
                selectedNotes.add(checkbox.value);
            }
        });
        
        selectedScales = new Set();
        document.querySelectorAll('.scale-select').forEach(checkbox => {
            if (checkbox.checked) {
                selectedScales.add(checkbox.value);
            }
        });
        
        // Update scales with new parameters
        updateScales(numNotes, maxJump, minSeparation);
    };

    // Add event listeners
    noteCountSlider.addEventListener('input', updateAllControls);
    maxJumpSlider.addEventListener('input', updateAllControls);
    minSeparationSlider.addEventListener('input', updateAllControls);
    rootNoteSelect.addEventListener('change', updateAllControls);
    scaleTypeSelect.addEventListener('change', updateAllControls);
    octaveRangeSlider.addEventListener('input', updateAllControls);
    scaleModeSelect.addEventListener('change', updateAllControls);
    bpmSlider.addEventListener('input', updateAllControls);
    
    document.querySelectorAll('.note-select').forEach(checkbox => {
        checkbox.addEventListener('change', updateAllControls);
    });
    
    document.querySelectorAll('.scale-select').forEach(checkbox => {
        checkbox.addEventListener('change', updateAllControls);
    });

    // Initial update
    updateAllControls();
};

// Add CSS for the new controls
const addStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
        .note-grid, .scale-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
            gap: 10px;
            margin: 10px 0;
        }
        .note-checkbox, .scale-checkbox {
            display: flex;
            align-items: center;
            gap: 5px;
            padding: 5px;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 4px;
            cursor: pointer;
        }
        .note-checkbox:hover, .scale-checkbox:hover {
            background: rgba(0, 255, 136, 0.1);
        }
        .note-checkbox input, .scale-checkbox input {
            margin: 0;
        }
        .parameter-group {
            display: flex;
            flex-direction: column;
            gap: 4px;
            margin: 0;
            padding: 6px 0;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 5px;
        }
        .parameter-group label {
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
            margin-bottom: 2px;
        }
        .parameter-group input[type="range"] {
            width: 100%;
            box-sizing: border-box;
            margin: 0;
            /* Optional: make the slider thumb more visible */
            accent-color: #00ff88;
        }
        .parameter-group span {
            margin-left: 10px;
            color: #00ff88;
            min-width: 50px;
            display: inline-block;
        }
        .parameter-group select {
            background: rgba(0, 0, 0, 0.3);
            color: #00ff88;
            border: 1px solid rgba(0, 255, 136, 0.3);
            padding: 5px;
            border-radius: 4px;
            min-width: 150px;
        }
        .parameter-group select:hover {
            background: rgba(0, 255, 136, 0.1);
        }
        .section-title {
            color: #00ff88;
            margin: 20px 0 10px 0;
            font-size: 1.2em;
            border-bottom: 1px solid rgba(0, 255, 136, 0.3);
            padding-bottom: 5px;
        }
        .control-group {
            margin: 20px 0;
            padding: 15px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 8px;
        }
    `;
    document.head.appendChild(style);
};

// Add meta tag to disable caching
const addNoCacheMeta = () => {
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Cache-Control';
    meta.content = 'no-cache, no-store, must-revalidate';
    document.head.appendChild(meta);
    
    const pragma = document.createElement('meta');
    pragma.httpEquiv = 'Pragma';
    pragma.content = 'no-cache';
    document.head.appendChild(pragma);
    
    const expires = document.createElement('meta');
    expires.httpEquiv = 'Expires';
    expires.content = '0';
    document.head.appendChild(expires);
};

// Call this when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // First add the no-cache meta tags
    addNoCacheMeta();
    
    // Initialize audio
    initAudio();
    
    // Then add the styles
    addStyles();
    
    // Initialize note and scale grids
    initializeNoteAndScaleGrids();
    
    // Initialize all controls
    initializeControls();
    
    // Load patterns and start visualization
    loadPatterns();
    draw();
}); 