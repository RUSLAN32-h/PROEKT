function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(tabName + '-tab').classList.add('active');
    event.currentTarget.classList.add('active');

    if (tabName !== 'audio') {
        audioPlayer.pause();
    }
    if (tabName !== 'video') {
        videoEditor.pause();
    }
    if (tabName !== 'interactive') {
        interactiveVideo.pause();
    }
}

const audioPlayer = document.getElementById('audioPlayer');
const playlist = document.getElementById('playlist');
const volumeControl = document.getElementById('volumeControl');
let currentTrackIndex = 0;
let tracks = Array.from(playlist.children);

const savedVolume = localStorage.getItem('audioVolume');
if (savedVolume) {
    audioPlayer.volume = parseFloat(savedVolume);
    volumeControl.value = savedVolume;
}

tracks.forEach((track, index) => {
    track.addEventListener('click', () => {
        playTrack(index);
    });
});

function playTrack(index) {
    currentTrackIndex = index;
    const track = tracks[index];
    const src = track.getAttribute('data-src');

    tracks.forEach(t => t.classList.remove('active'));
    track.classList.add('active');

    audioPlayer.src = src;
    audioPlayer.play();
}

function nextTrack() {
    currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
    playTrack(currentTrackIndex);
}

function prevTrack() {
    currentTrackIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
    playTrack(currentTrackIndex);
}

volumeControl.addEventListener('input', () => {
    audioPlayer.volume = volumeControl.value;
    localStorage.setItem('audioVolume', volumeControl.value);
});

audioPlayer.addEventListener('ended', nextTrack);

playTrack(0);

const videoEditor = document.getElementById('videoEditor');
const videoVolume = document.getElementById('videoVolume');
const brightnessControl = document.getElementById('brightnessControl');
const screenshotContainer = document.getElementById('screenshotContainer');

function changeSpeed(speed) {
    videoEditor.playbackRate = speed;
}

function takeScreenshot() {
    const canvas = document.createElement('canvas');
    canvas.width = videoEditor.videoWidth;
    canvas.height = videoEditor.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoEditor, 0, 0, canvas.width, canvas.height);
    
    const screenshot = new Image();
    screenshot.src = canvas.toDataURL('image/png');
    screenshot.style.maxWidth = '300px';
    screenshot.style.margin = '10px';
    
    screenshotContainer.appendChild(screenshot);
}

videoVolume.addEventListener('input', () => {
    videoEditor.volume = videoVolume.value;
});

brightnessControl.addEventListener('input', () => {
    videoEditor.style.filter = `brightness(${brightnessControl.value})`;
});

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const toggleVideoBtn = document.getElementById('toggleVideo');
const toggleMicBtn = document.getElementById('toggleMic');
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');

let localStream;
let videoEnabled = true;
let micEnabled = true;

async function setupVideoChat() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: true 
        });
        localVideo.srcObject = localStream;

        remoteVideo.srcObject = localStream.clone();
    } catch (err) {
        console.error('Ошибка доступа к медиаустройствам:', err);
    }
}

toggleVideoBtn.addEventListener('click', () => {
    videoEnabled = !videoEnabled;
    localStream.getVideoTracks()[0].enabled = videoEnabled;
    toggleVideoBtn.textContent = videoEnabled ? 'Выключить камеру' : 'Включить камеру';
});

toggleMicBtn.addEventListener('click', () => {
    micEnabled = !micEnabled;
    localStream.getAudioTracks()[0].enabled = micEnabled;
    toggleMicBtn.textContent = micEnabled ? 'Выключить микрофон' : 'Включить микрофон';
});

function sendMessage() {
    const message = messageInput.value.trim();
    if (message) {
        const messageElement = document.createElement('div');
        messageElement.textContent = `Вы: ${message}`;
        chatMessages.appendChild(messageElement);
        messageInput.value = '';

        setTimeout(() => {
            const replyElement = document.createElement('div');
            replyElement.textContent = `Участник: Привет! Я получил ваше сообщение: "${message}"`;
            chatMessages.appendChild(replyElement);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 1000);
        
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

document.getElementById('chat-tab').addEventListener('click', setupVideoChat);

const interactiveVideo = document.getElementById('interactiveVideo');
const choicePoints = document.getElementById('choicePoints');
const choicePopup = document.getElementById('choicePopup');
const progressStatus = document.getElementById('progressStatus');
let currentScene = 'start';
const progressData = {
    start: { time: 0, choices: {} },
    scene1: { time: 3, choices: {} },
    scene2: { time: 6, choices: {} }
};

function setupChoicePoints() {
    choicePoints.innerHTML = '';

    createChoicePoint(3, 50, 50, [
        { text: 'Выбор 1', scene: 'scene1' },
        { text: 'Выбор 2', scene: 'scene2' }
    ]);

    createChoicePoint(6, 80, 20, [
        { text: 'Конец', scene: 'end' },
        { text: 'Начать заново', scene: 'start' }
    ]);
}

function createChoicePoint(time, xPercent, yPercent, options) {
    const point = document.createElement('div');
    point.className = 'choice-point';
    point.dataset.time = time;

    point.style.left = `${xPercent}%`;
    point.style.top = `${yPercent}%`;
    
    point.addEventListener('click', (e) => {
        e.stopPropagation();
        showChoicePopup(point, options);
    });
    
    choicePoints.appendChild(point);
}

function showChoicePopup(point, options) {
    choicePopup.innerHTML = '';
    choicePopup.style.display = 'block';
    choicePopup.style.left = point.style.left;
    choicePopup.style.top = `calc(${point.style.top} + 30px)`;
    
    options.forEach(option => {
        const optionElement = document.createElement('div');
        optionElement.className = 'choice-option';
        optionElement.textContent = option.text;
        optionElement.addEventListener('click', () => {
            makeChoice(option.scene);
            choicePopup.style.display = 'none';
        });
        choicePopup.appendChild(optionElement);
    });
}

function makeChoice(scene) {
    currentScene = scene;
    progressStatus.textContent = `Текущая сцена: ${scene}`;
    
    if (scene === 'end') {
        interactiveVideo.pause();
    } else if (scene === 'start') {
        interactiveVideo.currentTime = 0;
        interactiveVideo.play();
    } else {
        interactiveVideo.currentTime = progressData[scene].time;
        interactiveVideo.play();
    }
}

function saveProgress() {
    localStorage.setItem('videoProgress', JSON.stringify({
        scene: currentScene,
        time: interactiveVideo.currentTime
    }));
    alert('Прогресс сохранен!');
}

function loadProgress() {
    const saved = localStorage.getItem('videoProgress');
    if (saved) {
        const progress = JSON.parse(saved);
        currentScene = progress.scene;
        interactiveVideo.currentTime = progress.time;
        progressStatus.textContent = `Загружен прогресс: ${currentScene}`;
        interactiveVideo.play();
    } else {
        alert('Сохраненный прогресс не найден');
    }
}

interactiveVideo.addEventListener('loadedmetadata', setupChoicePoints);
interactiveVideo.addEventListener('timeupdate', () => {
    const points = Array.from(choicePoints.children);
    points.forEach(point => {
        const pointTime = parseFloat(point.dataset.time);
        if (Math.abs(interactiveVideo.currentTime - pointTime) < 0.3) {
            interactiveVideo.pause();
            point.click();
        }
    });
});

document.addEventListener('click', () => {
    choicePopup.style.display = 'none';
});

progressStatus.textContent = `Текущая сцена: ${currentScene}`;