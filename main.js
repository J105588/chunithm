(async function() {
    'use strict';
    const CURRENT_VERSION = "X-VERSE";

    const GITHUB_USER = "j105588";
    const GITHUB_REPO = "chunithm";
    const CONST_DATA_URL = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/main/chunithm.json`;

    const BASE_URL = "https://new.chunithm-net.com/chuni-mobile/html/mobile/";
    const URL_PLAYER_DATA = BASE_URL + "home/playerData/";
    const URL_RATING_BEST = URL_PLAYER_DATA + "ratingDetailBest/";
    const URL_RATING_RECENT = URL_PLAYER_DATA + "ratingDetailRecent/";
    const URL_SEND_DETAIL = BASE_URL + "record/musicGenre/sendMusicDetail/";
    const URL_DETAIL = BASE_URL + "record/musicDetail/";
    const URL_RANKING_MASTER_SEND = BASE_URL + "ranking/sendMaster/";
    const URL_RANKING_MASTER = BASE_URL + "ranking/master/";
    const URL_RANKING_DETAIL_SEND = BASE_URL + "ranking/sendRankingDetail/";
    const URL_RANKING_DETAIL = BASE_URL + "ranking/musicRankingDetail/";
    const URL_RANKING_ULTIMA_SEND = URL_RANKING_DETAIL + "sendRankingUltima/";
    const URL_RANKING_EXPERT_SEND = URL_RANKING_DETAIL + "sendRankingExpert/";


    let isAborted = false;

    const overlay = document.createElement('div');
    const message = document.createElement('div');
    const globalCloseButton = document.createElement('button');

    // エラーメッセージ
    const showError = (errorMessage) => {
        console.error(errorMessage);
        overlay.innerHTML = '';
        message.style.cssText = `
            text-align: center;
            font-size: 18px;
            background-color: rgba(244, 67, 54, 0.2);
            padding: 20px;
            border-radius: 10px;
            border: 1px solid rgba(244, 67, 54, 0.5);
        `;
        message.textContent = `エラー: ${errorMessage}`;
        overlay.appendChild(message);
        overlay.appendChild(globalCloseButton);
        if (!document.body.contains(overlay)) {
            document.body.appendChild(overlay);
        }
    };

    if (window.location.hostname !== 'new.chunithm-net.com') {
        document.body.appendChild(overlay);
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.85); z-index: 9999; display: flex;
            justify-content: center; align-items: center; color: white;
            font-family: sans-serif; padding: 20px; box-sizing: border-box;
        `;
        showError("このブックマークレットはCHUNITHM-NET内でのみ実行できます");
        globalCloseButton.onclick = () => document.body.removeChild(overlay);
        return;
    }

    const addGlobalStyles = () => {
        const style = document.createElement('style');
        style.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&display=swap');
            @keyframes fadeIn {
                from { opacity: 0; transform: scale(0.95); }
                to { opacity: 1; transform: scale(1); }
            }
            @keyframes pulseGlow {
                0% { box-shadow: 0 0 8px #5cb85c, 0 0 12px #5cb85c; }
                50% { box-shadow: 0 0 16px #6fdc6f, 0 0 24px #6fdc6f; }
                100% { box-shadow: 0 0 8px #5cb85c, 0 0 12px #5cb85c; }
            }
            @keyframes backgroundShine {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
            }
        `;
        document.head.appendChild(style);
    };
    addGlobalStyles();

    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.85); z-index: 9999; display: flex;
        justify-content: center; align-items: center; color: white;
        font-family: 'Noto Sans JP', sans-serif; padding: 20px; box-sizing: border-box;
    `;
    document.body.appendChild(overlay);

    globalCloseButton.innerHTML = '&times;';
    globalCloseButton.style.cssText = `
        position: fixed;
        top: 15px;
        right: 20px;
        z-index: 10000;
        background: rgba(0, 0, 0, 0.4);
        color: white;
        border: 2px solid rgba(255, 255, 255, 0.5);
        border-radius: 50%;
        width: 40px;
        height: 40px;
        font-size: 28px;
        line-height: 38px;
        text-align: center;
        cursor: pointer;
        padding: 0;
        transition: background-color 0.2s, transform 0.1s;
    `;
    globalCloseButton.onmouseover = () => { globalCloseButton.style.backgroundColor = 'rgba(244, 67, 54, 0.8)'; };
    globalCloseButton.onmouseout = () => { globalCloseButton.style.backgroundColor = 'rgba(0, 0, 0, 0.4)'; };
    globalCloseButton.onmousedown = () => { globalCloseButton.style.transform = 'scale(0.9)'; };
    globalCloseButton.onmouseup = () => { globalCloseButton.style.transform = 'scale(1)'; };

    globalCloseButton.onclick = () => {
        isAborted = true;
        console.log("処理がユーザーによって中断されました");
        if (document.body.contains(overlay)) {
            document.body.removeChild(overlay);
        }
    };
    overlay.appendChild(globalCloseButton);

    /**
     * @returns {Promise<{mode: string, delay: number, scanMode: string, bestConstThreshold: number, newConstThreshold: number}>} - 選択された設定を解決するPromise
     */
    const askForSettings = () => {
        return new Promise(resolve => {
            let selectedMode = null;
            let selectedScanMode = 'paid'; // デフォルトは有料ユーザーね
            let scrapeDelay = 1.0;
            let bestConstThreshold = 14.5; // ベスト枠用のデフォルト値
            let newConstThreshold = 13.5; // 新曲枠用のデフォルト値

            const container = document.createElement('div');
            container.style.cssText = `
                background: linear-gradient(180deg, #0b0f13, #0e1216);
                padding: 40px; border-radius: 20px;
                box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7);
                border: 1px solid rgba(255, 255, 255, 0.08);
                text-align: center; width: 90%; max-width: 700px; max-height: 90vh; overflow-y: auto;
                backdrop-filter: blur(6px);
                animation: fadeIn 0.5s ease-out;
            `;

            const title = document.createElement('h2');
            title.textContent = 'CHUNITHM 画像ジェネレーター設定';
            title.style.cssText = 'font-size: 28px; margin-bottom: 10px; font-weight: bold; color: #f5f5f5; line-height: 1.4;';
            container.appendChild(title);

            const subtitle = document.createElement('p');
            subtitle.innerHTML = '動作モード、画像レイアウト、取得間隔を設定してください <br> 取得間隔によってはCHUNITHM-NETのサーバーに負荷をかける可能性があります';
            subtitle.style.cssText = 'font-size: 15px; margin-bottom: 28px; color: #9ca3af;';
            container.appendChild(subtitle);

            // 選択画面のUIとか
            const scanModeSection = document.createElement('div');
            scanModeSection.style.cssText = 'margin-bottom: 28px;';
            const scanModeLabel = document.createElement('label');
            scanModeLabel.textContent = '動作モード';
            scanModeLabel.style.cssText = 'display: block; font-size: 18px; font-weight: bold; color: #e5e7eb; margin-bottom: 12px;';
            scanModeSection.appendChild(scanModeLabel);
            const scanModeButtonsContainer = document.createElement('div');
            scanModeButtonsContainer.style.cssText = 'display: flex; justify-content: center; gap: 16px; flex-wrap: wrap;';
            const constThresholdSection = document.createElement('div');
            constThresholdSection.style.cssText = 'margin-top: 20px; display: none;';

            const createScanModeButton = (text, scanMode) => {
                const button = document.createElement('button');
                button.innerHTML = text;
                button.dataset.scanMode = scanMode;
                button.style.cssText = `
                    flex: 1; min-width: 220px; padding: 14px; font-size: 15px; font-weight: bold; cursor: pointer;
                    background-color: #0d1117; color: #e5e7eb; border: 1px solid #263041; border-radius: 10px;
                    transition: all 0.2s ease-out;
                `;
                button.onmouseover = () => {
                    button.style.transform = 'translateY(-2px)';
                    button.style.boxShadow = '0 8px 20px rgba(0, 212, 255, 0.10)';
                };
                button.onmouseout = () => {
                    button.style.transform = 'translateY(0)';
                    button.style.boxShadow = 'none';
                };
                button.onclick = () => {
                    selectedScanMode = scanMode;
                    updateScanModeButtons();
                    checkIfReady();
                };
                return button;
            };

            const updateScanModeButtons = () => {
                 document.querySelectorAll('button[data-scan-mode]').forEach(btn => {
                    const isSelected = btn.dataset.scanMode === selectedScanMode;
                    btn.style.backgroundColor = isSelected ? '#0f172a' : '#0d1117';
                    btn.style.borderColor = isSelected ? '#00D4FF' : '#263041';
                    btn.style.color = isSelected ? '#e6f9ff' : '#e5e7eb';
                });
                constThresholdSection.style.display = selectedScanMode === 'free' ? 'block' : 'none';
            };

            scanModeButtonsContainer.appendChild(createScanModeButton('通常モード<br><small>(Rating準拠 / 課金ユーザー)</small>', 'paid'));
            scanModeButtonsContainer.appendChild(createScanModeButton('無料モード<br><small>(全曲スキャン / 無料ユーザー)</small>', 'free'));
            scanModeSection.appendChild(scanModeButtonsContainer);
            container.appendChild(scanModeSection);

            // 無料ユーザーはconstantの最小値を設定しないと恐ろしいことになるよ
            const constInputsContainer = document.createElement('div');
            constInputsContainer.style.cssText = 'display: flex; justify-content: center; gap: 24px; align-items: center; flex-wrap: wrap;';

            // ベスト枠・新曲枠用の入力を作成するヘルパー関数
            const createConstInput = (labelText, value, callback) => {
                const wrapper = document.createElement('div');
                const label = document.createElement('label');
                label.textContent = labelText;
                label.style.cssText = 'display: block; font-size: 14px; color: #cbd5e1; margin-bottom: 8px;';
                wrapper.appendChild(label);

                const input = document.createElement('input');
                input.type = 'number';
                input.value = value;
                input.min = '13.0';
                input.max = '15.4';
                input.step = '0.1';
                input.style.cssText = `
                    width: 100px; padding: 10px; font-size: 18px; text-align: center;
                    background-color: #0d1117; color: #e5e7eb; border: 1px solid #263041; border-radius: 8px;
                    transition: border-color 0.2s;
                `;
                input.onfocus = () => { input.style.borderColor = '#00D4FF'; };
                input.onblur = () => { input.style.borderColor = '#263041'; };
                input.onchange = () => {
                    const val = parseFloat(input.value);
                    if (!isNaN(val) && val >= 13.0 && val <= 15.4) {
                        callback(val);
                    } else {
                        input.value = callback(null); // 不正な値は元の値に戻す
                    }
                };
                wrapper.appendChild(input);
                return wrapper;
            };

            const bestInputWrapper = createConstInput('BEST枠 最小定数', bestConstThreshold, (val) => {
                if (val !== null) bestConstThreshold = val;
                return bestConstThreshold;
            });
            const newInputWrapper = createConstInput('新曲枠 最小定数', newConstThreshold, (val) => {
                if (val !== null) newConstThreshold = val;
                return newConstThreshold;
            });

            constInputsContainer.appendChild(bestInputWrapper);
            constInputsContainer.appendChild(newInputWrapper);
            constThresholdSection.appendChild(constInputsContainer);

            const freeModeWarning = document.createElement('p');
            freeModeWarning.innerHTML = '⚠️ <strong>注意:</strong> 無料ユーザーモードは公式サイトの楽曲ランキングから全曲のスコアを取得するため、完了までに<strong>数分以上</strong>かかる場合があります<br>また大量にアクセスするため、取得間隔によってはCHUNITHM-NETのサーバーに負荷をかける可能性があります';// CHUNITHM-NETのサーバーがどれだけの強度を誇るのかはわからない
            freeModeWarning.style.cssText = 'font-size: 13px; margin-top: 12px; color: #f59e0b; background-color: rgba(245, 158, 11, 0.08); padding: 10px; border-radius: 8px; border: 1px solid rgba(245, 158, 11, 0.25);';
            constThresholdSection.appendChild(freeModeWarning);
            container.appendChild(constThresholdSection);


            // Chunithm-netへの負荷軽減だったり、レートリミット対策だったり
            const delaySection = document.createElement('div');
            delaySection.style.cssText = 'margin-bottom: 30px; margin-top: 20px;';
            const delayLabel = document.createElement('label');
            delayLabel.textContent = '取得間隔 (秒)';
            delayLabel.style.cssText = 'display: block; font-size: 18px; font-weight: bold; color: #e5e7eb; margin-bottom: 12px;';
            delaySection.appendChild(delayLabel);
            const delayControls = document.createElement('div');
            delayControls.style.cssText = 'display: flex; justify-content: center; align-items: center; gap: 8px;';
            const delayValueSpan = document.createElement('span');
            delayValueSpan.textContent = scrapeDelay.toFixed(1);
            delayValueSpan.style.cssText = 'font-size: 24px; font-weight: bold; color: #7DD3FC; width: 80px;';
            const createControlButton = (text) => {
                const button = document.createElement('button');
                button.textContent = text;
                button.style.cssText = `
                    width: 50px; height: 50px; margin: 0 10px; font-size: 24px;
                    cursor: pointer; background-color: #0e1216; color: #e5e7eb;
                    border: 1px solid #263041; border-radius: 50%; transition: all 0.2s ease-out; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
                `;
                button.onmouseover = () => {
                    button.style.backgroundColor = '#0f172a';
                    button.style.transform = 'scale(1.08)';
                    button.style.boxShadow = '0 0 0 3px rgba(0, 212, 255, 0.25)';
                };
                button.onmouseout = () => {
                    button.style.backgroundColor = '#0e1216';
                    button.style.transform = 'scale(1)';
                    button.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.4)';
                };
                button.onmousedown = () => { button.style.transform = 'scale(0.95)'; };
                button.onmouseup = () => { button.style.transform = 'scale(1.08)'; };
                return button;
            };
            const minusButton = createControlButton('-');
            minusButton.onclick = () => {
                if (scrapeDelay > 0) {
                    scrapeDelay = Math.max(0, scrapeDelay - 0.5);
                    delayValueSpan.textContent = scrapeDelay.toFixed(1);
                }
            };
            const plusButton = createControlButton('+');
            plusButton.onclick = () => {
                if (scrapeDelay < 3) {
                    scrapeDelay = Math.min(3, scrapeDelay + 0.5);
                    delayValueSpan.textContent = scrapeDelay.toFixed(1);
                }
            };
            delayControls.appendChild(minusButton);
            delayControls.appendChild(delayValueSpan);
            delayControls.appendChild(plusButton);
            delaySection.appendChild(delayControls);
            container.appendChild(delaySection);


            // 個人的には横派
            const modeSection = document.createElement('div');
            modeSection.style.cssText = 'margin-bottom: 36px;';
            const modeLabel = document.createElement('label');
            modeLabel.textContent = '画像レイアウト';
            modeLabel.style.cssText = 'display: block; font-size: 18px; font-weight: bold; color: #e5e7eb; margin-bottom: 12px;';
            modeSection.appendChild(modeLabel);
            const modeButtonsContainer = document.createElement('div');
            modeButtonsContainer.style.cssText = 'display: flex; justify-content: center; gap: 16px; flex-wrap: wrap;';
            const generateButton = document.createElement('button');
            const createModeButton = (text, mode) => {
                const button = document.createElement('button');
                button.textContent = text;
                button.dataset.mode = mode;
                button.style.cssText = `
                    display: inline-block; width: 200px; padding: 14px;
                    font-size: 16px; font-weight: bold; cursor: pointer;
                    background-color: #0d1117; color: #e5e7eb;
                    border: 1px solid #263041; border-radius: 10px;
                    transition: all 0.2s ease-out; transform: translateY(0);
                `;
                button.onmouseover = () => {
                    button.style.transform = 'translateY(-2px)';
                    button.style.boxShadow = '0 8px 20px rgba(0, 212, 255, 0.10)';
                };
                button.onmouseout = () => {
                    button.style.transform = 'translateY(0)';
                    button.style.boxShadow = 'none';
                };
                button.onclick = () => {
                    selectedMode = mode;
                    document.querySelectorAll('button[data-mode]').forEach(btn => {
                        const isSelected = btn.dataset.mode === selectedMode;
                        btn.style.backgroundColor = isSelected ? '#0f172a' : '#0d1117';
                        btn.style.borderColor = isSelected ? '#00D4FF' : '#263041';
                        btn.style.color = isSelected ? '#e6f9ff' : '#e5e7eb';
                    });
                    checkIfReady();
                };
                return button;
            };
            modeButtonsContainer.appendChild(createModeButton('縦', 'vertical'));
            modeButtonsContainer.appendChild(createModeButton('横', 'horizontal'));
            modeSection.appendChild(modeButtonsContainer);
            container.appendChild(modeSection);


            // 無駄に目立たせてみた開始ボタン
            const checkIfReady = () => {
                if (selectedMode && selectedScanMode) {
                    generateButton.disabled = false;
                    generateButton.style.opacity = '1';
                    generateButton.style.cursor = 'pointer';
                    generateButton.style.animation = 'pulseGlow 2s infinite';
                }
            };

            generateButton.textContent = '生成開始';
            generateButton.disabled = true;
            generateButton.style.cssText = `
                width: 100%; padding: 18px; font-size: 20px; font-weight: bold;
                cursor: not-allowed; background: linear-gradient(145deg, #00D4FF, #00AEEF);
                color: #0b0f13; border: none; border-radius: 12px; transition: all 0.2s; opacity: 0.5;
            `;
            generateButton.onmouseover = () => { if (!generateButton.disabled) generateButton.style.background = 'linear-gradient(145deg, #00AEEF, #007EA7)'; };
            generateButton.onmouseout = () => { if (!generateButton.disabled) generateButton.style.background = 'linear-gradient(145deg, #00D4FF, #00AEEF)'; };
            generateButton.onclick = () => {
                if (selectedMode && selectedScanMode) {
                    resolve({ mode: selectedMode, delay: scrapeDelay, scanMode: selectedScanMode, bestConstThreshold, newConstThreshold });
                }
            };
            container.appendChild(generateButton);

            overlay.innerHTML = '';
            overlay.appendChild(container);
            overlay.appendChild(globalCloseButton);
            
            // 初期状態を更新
            updateScanModeButtons();
        });
    };

    const updateMessage = (text, progress) => {
        console.log(text);

        if (!document.body.contains(message)) {
            message.style.cssText = `
                position: absolute;
                background-color: rgba(11, 15, 19, 0.9);
                padding: 40px;
                border-radius: 15px;
                width: 90%;
                max-width: 600px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                border: 1px solid rgba(255, 255, 255, 0.1);
                text-align: center;
                animation: fadeIn 0.5s;
            `;
            message.innerHTML = `
                <div class="progress-text" style="font-size: 18px; color: #e5e7eb; margin-bottom: 25px; transition: opacity 0.2s;">${text}</div>
                <div class="progress-bar-container" style="background-color: #1f2937; border-radius: 10px; height: 12px; overflow: hidden; box-shadow: inset 0 2px 4px rgba(0,0,0,0.4);">
                    <div class="progress-bar-inner" style="width: 0%; height: 100%; background: linear-gradient(90deg, #38bdf8, #3b82f6); border-radius: 10px; transition: width 0.5s cubic-bezier(0.25, 1, 0.5, 1);"></div>
                </div>
            `;
            overlay.innerHTML = '';
            overlay.appendChild(message);
            overlay.appendChild(globalCloseButton);
        }

        const textElement = message.querySelector('.progress-text');
        if (textElement) {
            textElement.style.opacity = '0';
            setTimeout(() => {
                textElement.textContent = text;
                textElement.style.opacity = '1';
            }, 200);
        }

        if (progress !== undefined) {
            const barElement = message.querySelector('.progress-bar-inner');
            if (barElement) {
                barElement.style.width = `${progress}%`;
            }
        }
    };
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // セッション切れ、あまりにも長時間操作がなかったり、他の場所からログインしたりすると切れるやつ、そんなのでエラー報告来たら泣くから
    const fetchDocument = async (url, options = {}) => {
        const response = await fetch(url, options);
        // 503はメンテナンス中だからね
        if (response.status === 503) throw new Error("現在CHUNITHM-NETはメンテナンス中です！");
        if (!response.ok) throw new Error(`HTTPエラーが発生しました: ${response.status} (${url})`);
        
        const htmlText = await response.text();
        if (htmlText.includes("再度ログインしてください")) {
            throw new Error("セッションが切れました。CHUNITHM-NETに再度ログインしてください。(他の場所でログインした場合もセッションが無効になります)");
        }
        
        return new DOMParser().parseFromString(htmlText, 'text/html');
    };

    const scrapeRatingList = async (url) => {
        const doc = await fetchDocument(url);
        const songForms = doc.querySelectorAll('form[action$="sendMusicDetail/"]');
        const songs = [];
        for (const form of songForms) {
            const difficultyClass = form.querySelector('div[class*="bg_"]').className;
            let difficulty = "UNKNOWN";
            if (difficultyClass.includes("master")) difficulty = "MASTER";
            else if (difficultyClass.includes("expert")) difficulty = "EXPERT";
            else if (difficultyClass.includes("ultima")) difficulty = "ULTIMA";

            songs.push({
                title: form.querySelector('.music_title').innerText,
                score_str: form.querySelector('.text_b').innerText,
                score_int: parseInt(form.querySelector('.text_b').innerText.replace(/,/g, ''), 10),
                difficulty: difficulty,
                params: {
                    idx: form.querySelector('input[name="idx"]').value,
                    token: form.querySelector('input[name="token"]').value,
                    genre: form.querySelector('input[name="genre"]').value,
                    diff: form.querySelector('input[name="diff"]').value,
                }
            });
        }
        return songs;
    };
    const scrapeMusicDetail = async (params) => {
        const formData = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => formData.append(key, value));

        await fetch(URL_SEND_DETAIL, { method: 'POST', body: formData });
        const doc = await fetchDocument(URL_DETAIL);

        const artist = doc.querySelector('.play_musicdata_artist')?.innerText || 'N/A';
        const jacketUrl = doc.querySelector('.play_jacket_img img')?.src || '';

        let playCount = 'N/A';
        const difficultyMap = { '0': 'basic', '1': 'advanced', '2': 'expert', '3': 'master', '4': 'ultima' };
        const diffSelector = `.music_box.bg_${difficultyMap[params.diff]}`;
        const difficultyBlock = doc.querySelector(diffSelector);

        if (difficultyBlock) {
            const dataRows = difficultyBlock.querySelectorAll('.block_underline.ptb_5');
            for (const row of dataRows) {
                const titleElement = row.querySelector('.musicdata_score_title');
                if (titleElement && titleElement.innerText.includes('プレイ回数')) {
                    const countElement = row.querySelector('.musicdata_score_num .text_b');
                    if (countElement) {
                        playCount = countElement.innerText;
                    }
                    break;
                }
            }
        }
        return { artist, jacketUrl, playCount };
    };
    /*
    const calculateRating = (score, constant) => {
        if (!constant) return 0.0;
        constant = parseFloat(constant);
        let ratingValue = 0.0;
        if (score >= 1009000) {
            ratingValue = constant + 2.15;
        } else if (score >= 1007500) {
            ratingValue = constant + 2.0 + (score - 1007500) * 0.0001;
        } else if (score >= 1005000) {
            ratingValue = constant + 1.5 + (score - 1005000) * 0.0002;
        } else if (score >= 1000000) {
            ratingValue = constant + 1.0 + (score - 1000000) * 0.0001;
        } else if (score >= 975000) {
            ratingValue = constant + (score - 975000) / 25000;
        } else if (score >= 950000) {
            ratingValue = constant - 1.5 + (score - 950000) / 25000 * 1.5;
        } else if (score >= 925000) {
            ratingValue = constant - 3.0 + (score - 925000) / 25000 * 1.5;
        } else if (score >= 900000) {
            ratingValue = constant - 5.0 + (score - 900000) / 25000 * 2.0;
        }

        return Math.round(ratingValue * 100) / 100;
    };:*/
    const calculateRating = (score, constant) => {
        if (!constant) return 0.0;
        constant = parseFloat(constant);

        let ratingValue = 0.0;

        if (score >= 1009000) {
            ratingValue = constant + 2.15;
        }
        else if (score >= 1007500) {
            ratingValue = constant + 2.0;
        }
        else if (score >= 1005000) {
            ratingValue = constant + 1.5 + (score - 1005000) * 0.0002;
        }
        else if (score >= 1000000) {
            ratingValue = constant + 1.0 + (score - 1000000) * 0.0001;
        }
        else if (score >= 975000) {
            ratingValue = constant + (score - 975000) / 25000;
        }
        else {
            ratingValue = constant - 3 * (975000 - score) / 250000;
        }

        return Math.floor(ratingValue * 100) / 100;
    };

    const getRankInfo = (score) => {
        if (score >= 1009000) return { rank: "SSS+", color: "#FFD700" };
        if (score >= 1007500) return { rank: "SSS", color: "#ffdf75" };
        if (score >= 1005000) return { rank: "SS+", color: "#ffda8aff" };
        if (score >= 1000000) return { rank: "SS", color: "#fcc652ff" };
        if (score >= 975000) return { rank: "S", color: "#ffaf47ff" };
        if (score >= 950000) return { rank: "AAA", color: "#f44336" };
        if (score >= 925000) return { rank: "AA", color: "#f44336" };
        if (score >= 900000) return { rank: "A", color: "#f44336" };
        if (score >= 800000) return { rank: "BBB", color: "#2196F3" };
        if (score >= 700000) return { rank: "BB", color: "#2196F3" };
        if (score >= 600000) return { rank: "B", color: "#2196F3" };
        if (score >= 500000) return { rank: "C", color: "#795548" };
        return { rank: "D", color: "#9E9E9E" };
    };
    const drawRoundRect = (ctx, x, y, width, height, radius) => {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    };
    const loadImage = (url) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve(img);
            img.onerror = (err) => reject(new Error(`画像の読み込みに失敗しました: ${url}`));
            img.src = url;
        });
    };

    /**
     * 無料ユーザー向けの楽曲データ取得
     */
    const fetchAllSongsForFreeUser = async (bestConstThreshold, newConstThreshold, delay, constData) => {
        updateMessage("ランキングページにアクセス中...", 5);
        const token = document.cookie.split('; ').find(row => row.startsWith('_t=')).split('=')[1];
        await fetch(URL_RANKING_MASTER_SEND, {
            method: 'POST',
            body: new URLSearchParams({ genre: '99', token: token })
        });
        const rankingDoc = await fetchDocument(URL_RANKING_MASTER);
        if (isAborted) return null;

        const songForms = rankingDoc.querySelectorAll('form[action$="sendRankingDetail/"]');
        let initialSongList = [];
        songForms.forEach(form => {
            initialSongList.push({
                title: form.querySelector('.music_title').innerText,
                params: {
                    idx: form.querySelector('input[name="idx"]').value,
                    token: form.querySelector('input[name="token"]').value,
                    genre: form.querySelector('input[name="genre"]').value,
                    diff: form.querySelector('input[name="diff"]').value,
                }
            });
        });

        updateMessage("定数データと楽曲リストを照合中...", 10);
        let filteredNewSongs = [];
        let filteredOldSongs = [];
        const diffMap = { 'MAS': '3', 'EXP': '2', 'ULT': '4' };

        for (const songData of constData) {
            const isNewSong = songData.version === CURRENT_VERSION;
            const threshold = isNewSong ? newConstThreshold : bestConstThreshold;

            if (songData.const >= threshold) {
                const initialSong = initialSongList.find(s => s.title === songData.title);
                if (initialSong && diffMap[songData.diff]) {
                    const songObject = {
                        title: songData.title,
                        artist: songData.artist,
                        difficulty: { 'MAS': 'MASTER', 'EXP': 'EXPERT', 'ULT': 'ULTIMA' }[songData.diff],
                        const: songData.const,
                        jacketUrl: `https://new.chunithm-net.com/chuni-mobile/images/jacket/${songData.img}.jpg`,
                        playCount: 'N/A',
                        params: { ...initialSong.params, diff: diffMap[songData.diff] }
                    };
                    
                    if (isNewSong) {
                        filteredNewSongs.push(songObject);
                    } else {
                        filteredOldSongs.push(songObject);
                    }
                }
            }
        }
        
        // 重複削除
        filteredNewSongs = filteredNewSongs.filter((song, index, self) => index === self.findIndex(s => s.title === song.title && s.difficulty === song.difficulty));
        filteredOldSongs = filteredOldSongs.filter((song, index, self) => index === self.findIndex(s => s.title === song.title && s.difficulty === song.difficulty));

        const processSongList = async (list, type, startProgress, progressShare) => {
            let detailedSongs = [];
            const total = list.length;
            for (let i = 0; i < total; i++) {
                if (isAborted) break;
                const song = list[i];
                const progress = startProgress + (i / total) * progressShare;
                if (i > 0 && delay > 0) {
                    updateMessage(`待機中... (${delay.toFixed(1)}秒) - (${i}/${total})`, progress);
                    await sleep(delay * 1000);
                }
                if (isAborted) break;
                try {
                    updateMessage(`${type}取得中: ${song.title} [${song.difficulty}] (${i + 1}/${total})`, progress);
                    await fetch(URL_RANKING_DETAIL_SEND, { method: 'POST', body: new URLSearchParams(song.params) });
                    let scoreDoc;
                    if (song.difficulty === 'ULTIMA') {
                        await fetch(URL_RANKING_ULTIMA_SEND, { method: 'POST', body: new URLSearchParams({ ...song.params, category: '1', region: '1' }) });
                        scoreDoc = await fetchDocument(URL_RANKING_DETAIL);
                    } else if (song.difficulty === 'EXPERT') {
                        await fetch(URL_RANKING_EXPERT_SEND, { method: 'POST', body: new URLSearchParams({ ...song.params, category: '1', region: '1' }) });
                        scoreDoc = await fetchDocument(URL_RANKING_DETAIL);
                    } else {
                        scoreDoc = await fetchDocument(URL_RANKING_DETAIL);
                    }
                    const scoreElement = scoreDoc.querySelector('.rank_playdata_highscore .text_b');
                    const jacketElement = scoreDoc.querySelector('.play_jacket_img img');
                    if (scoreElement) {
                        const score_str = scoreElement.innerText;
                        const score_int = parseInt(score_str.replace(/,/g, ''), 10);
                        if (score_int > 0) {
                            const finalJacketUrl = jacketElement ? jacketElement.src : song.jacketUrl;
                            detailedSongs.push({ ...song, score_str, score_int, jacketUrl: finalJacketUrl });
                        }
                    } else {
                        detailedSongs.push({ ...song, score_str: '0', score_int: 0 });
                    }
                } catch (e) {
                    console.warn(`スコア取得失敗: ${song.title}`, e);
                }
            }
            return detailedSongs;
        };

        const detailedNewSongs = await processSongList(filteredNewSongs, "新曲枠", 15, 40);
        if (isAborted) return null;
        const detailedOldSongs = await processSongList(filteredOldSongs, "BEST枠", 55, 40);
        if (isAborted) return null;
        
        return { detailedNewSongs, detailedOldSongs };
    };


    const generateImage = async (playerData, bestList, recentList, mode) => {
        await document.fonts.load('bold 20px "Noto Sans JP"');
        await document.fonts.load('20px "Noto Sans JP"');

        updateMessage("背景画像を読み込み中...");
        const BG_BASE_URL = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/main/`;
        const bgUrl = mode === 'vertical' ? `${BG_BASE_URL}bg_portrait.png` : `${BG_BASE_URL}bg_landscape.png`;
        let backgroundImage;
        try {
            backgroundImage = await loadImage(bgUrl);
        } catch (e) {
            console.error("背景画像の読み込みに失敗しました:", e);
            // フォールバック用の背景を準備
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const wrapText = (context, text, x, y, maxWidth, lineHeight, align = 'left', maxLines = Infinity) => {
            const words = text.split('');
            let line = '';
            let currentY = y;
            let lineCount = 1;

            const drawLine = (line, y) => {
                let drawX = x;
                if (align === 'center') {
                    const lineWidth = context.measureText(line).width;
                    drawX = x + (maxWidth - lineWidth) / 2;
                }
                context.fillText(line, drawX, y);
            };

            for (let n = 0; n < words.length; n++) {
                const testLine = line + words[n];
                const metrics = context.measureText(testLine);
                const testWidth = metrics.width;
                if (testWidth > maxWidth && n > 0) {
                    if (lineCount >= maxLines) {
                        let truncatedLine = line;
                        while (context.measureText(truncatedLine + '…').width > maxWidth) {
                            truncatedLine = truncatedLine.slice(0, -1);
                        }
                        drawLine(truncatedLine + '…', currentY);
                        return { finalY: currentY, lines: lineCount };
                    }
                    drawLine(line, currentY);
                    line = words[n];
                    currentY += lineHeight;
                    lineCount++;
                } else {
                    line = testLine;
                }
            }
            drawLine(line, currentY);
            return { finalY: currentY, lines: lineCount };
        };

        const calculateAverageRating = (list) => {
            if (!list || list.length === 0) return 0.0;
            const total = list.reduce((sum, song) => sum + (song.rating ?? 0), 0);
            return total / list.length;
        };

        // --- レイアウト定数 ---
        let WIDTH, COLS, BLOCK_WIDTH, CENTER_GAP;
        const PADDING = 30;
        const HEADER_HEIGHT = 280;
        const BLOCK_HEIGHT = 400;
        const FONT_FAMILY = '"Noto Sans JP", sans-serif';

        if (mode === 'vertical') {
            WIDTH = 1920;
            COLS = 8;
            BLOCK_WIDTH = (WIDTH - PADDING * (COLS + 1)) / COLS;
            CENTER_GAP = 50;
        } else { // horizontal
            COLS = 6;
            BLOCK_WIDTH = 210;
            CENTER_GAP = 75;
            const gridWidth = (BLOCK_WIDTH * COLS) + (PADDING * (COLS - 1));
            WIDTH = PADDING + gridWidth + CENTER_GAP + gridWidth + PADDING;
        }
        const JACKET_SIZE = BLOCK_WIDTH * 0.85;

        const calcListHeight = (list, cols) => {
            if (!list.length) return 0;
            const rows = Math.ceil(list.length / cols);
            return 70 + (rows * (BLOCK_HEIGHT + PADDING));
        };

        canvas.width = WIDTH;
        if (mode === 'vertical') {
            canvas.height = HEADER_HEIGHT + calcListHeight(bestList, COLS) + CENTER_GAP + calcListHeight(recentList, COLS) + PADDING;
        } else {
            canvas.height = HEADER_HEIGHT + Math.max(calcListHeight(bestList, COLS), calcListHeight(recentList, COLS)) + PADDING;
        }

        // --- 背景描画 ---
        if (backgroundImage) {
            ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
        } else {
            const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            bgGradient.addColorStop(0, '#1a1a1a');
            bgGradient.addColorStop(1, '#000000');
            ctx.fillStyle = bgGradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // --- ヘッダー描画 ---
        const headerX = PADDING / 2;
        const headerY = PADDING / 2;
        const headerW = WIDTH - PADDING;
        const headerH = HEADER_HEIGHT - PADDING;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        drawRoundRect(ctx, headerX, headerY, headerW, headerH, 15);
        ctx.fill();
        ctx.stroke();

        const leftX = PADDING * 1.5;
        ctx.font = `24px ${FONT_FAMILY}`;
        ctx.fillStyle = '#B0A5C8';
        ctx.fillText('PLAYER NAME', leftX, headerY + 50);

        ctx.font = `bold 64px ${FONT_FAMILY}`;
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = 'rgba(255, 255, 255, 0.7)';
        ctx.shadowBlur = 15;
        ctx.fillText(playerData.name, leftX, headerY + 125);
        ctx.shadowBlur = 0;

        const now = new Date();
        const dateTimeString = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        ctx.font = `20px ${FONT_FAMILY}`;
        ctx.fillStyle = '#888';
        ctx.textAlign = 'left';
        ctx.fillText(`Generated at: ${dateTimeString}`, leftX, headerY + headerH - 30);


        const ratingX = WIDTH - PADDING * 1.5;
        ctx.textAlign = 'right';

        const drawRatingBox = (label, value, valueColor, x, y, width, height) => {
            ctx.font = `24px ${FONT_FAMILY}`;
            ctx.fillStyle = '#B0A5C8';
            ctx.fillText(label, x, y);

            ctx.font = `bold 64px ${FONT_FAMILY}`;
            ctx.fillStyle = valueColor;
            ctx.shadowColor = valueColor;
            ctx.shadowBlur = 15;
            ctx.fillText(value, x, y + 75);
            ctx.shadowBlur = 0;
        };

        const maxRatingWidth = 250;
        const recentRatingWidth = 250;
        const bestRatingWidth = 250;

        drawRatingBox('MAX RATING', playerData.maxRating, '#FFB86C', ratingX, headerY + 50, maxRatingWidth, 100);
        drawRatingBox('RECENT', calculateAverageRating(recentList).toFixed(4), '#8BE9FD', ratingX - maxRatingWidth - 50, headerY + 50, recentRatingWidth, 100);
        drawRatingBox('BEST', calculateAverageRating(bestList).toFixed(4), '#50FA7B', ratingX - maxRatingWidth - recentRatingWidth - 100, headerY + 50, bestRatingWidth, 100);

        // --- 楽曲リスト描画 ---
        const drawSongList = async (list, title, startY, startX, areaWidth, areaHeight) => {
            ctx.font = `bold 48px ${FONT_FAMILY}`;
            ctx.fillStyle = '#FFFFFF';
            ctx.textAlign = 'left';
            const titleWidth = ctx.measureText(title).width;
            ctx.fillText(title, startX, startY);

            const titleUnderlineGradient = ctx.createLinearGradient(startX, 0, startX + titleWidth, 0);
            titleUnderlineGradient.addColorStop(0, '#50FA7B');
            titleUnderlineGradient.addColorStop(1, '#8BE9FD');
            ctx.fillStyle = titleUnderlineGradient;
            ctx.fillRect(startX, startY + 10, titleWidth, 4);

            const listStartY = startY + 70;
            let col = 0, row = 0;

            const jacketPromises = list.map(song => loadImage(`https://corsproxy.io/?${encodeURIComponent(song.jacketUrl)}`).catch(e => {
                console.error(e);
                return null; // 画像が読めなくても処理は続行
            }));
            const jacketImages = await Promise.all(jacketPromises);

            for (let i = 0; i < list.length; i++) {
                const song = list[i];
                const jacketImg = jacketImages[i];

                const x = startX + col * (BLOCK_WIDTH + PADDING);
                const y = listStartY + row * (BLOCK_HEIGHT + PADDING);

                // カード背景
                ctx.fillStyle = 'rgba(10, 15, 20, 0.6)';
                ctx.strokeStyle = `rgba(255,255,255, ${song.isNew ? 0.4 : 0.15})`;
                ctx.lineWidth = song.isNew ? 2 : 1;
                drawRoundRect(ctx, x, y, BLOCK_WIDTH, BLOCK_HEIGHT, 12);
                ctx.fill();
                ctx.stroke();

                // ジャケット
                const jacketX = x + (BLOCK_WIDTH - JACKET_SIZE) / 2;
                const jacketY = y + PADDING * 0.7;
                if (jacketImg) {
                    ctx.drawImage(jacketImg, jacketX, jacketY, JACKET_SIZE, JACKET_SIZE);
                } else {
                    ctx.fillStyle = '#333';
                    ctx.fillRect(jacketX, jacketY, JACKET_SIZE, JACKET_SIZE);
                    ctx.fillStyle = '#fff';
                    ctx.font = `18px ${FONT_FAMILY}`;
                    ctx.textAlign = 'center';
                    ctx.fillText('No Image', jacketX + JACKET_SIZE/2, jacketY + JACKET_SIZE/2);
                }

                // 難易度
                const diffColors = { "MASTER": "#C858E5", "ULTIMA": "#F44336", "EXPERT": "#FFC107" };
                ctx.fillStyle = diffColors[song.difficulty] || "#9E9E9E";
                ctx.font = `bold 20px ${FONT_FAMILY}`;
                ctx.textAlign = 'center';
                ctx.fillText(song.difficulty, x + BLOCK_WIDTH / 2, jacketY + JACKET_SIZE + 28);
                
                // 曲名
                ctx.fillStyle = '#FFFFFF';
                ctx.font = `bold ${BLOCK_WIDTH * 0.08}px ${FONT_FAMILY}`;
                wrapText(ctx, song.title, x, jacketY + JACKET_SIZE + 48, BLOCK_WIDTH, BLOCK_WIDTH * 0.08 + 4, 'center', 2);

                // スコア
                const scoreY = y + BLOCK_HEIGHT - 65;
                ctx.font = `bold ${BLOCK_WIDTH * 0.1}px ${FONT_FAMILY}`;
                ctx.fillText(song.score_str, x + BLOCK_WIDTH / 2, scoreY);
                const { rank, color } = getRankInfo(song.score_int);
                ctx.fillStyle = color;
                ctx.font = `bold ${BLOCK_WIDTH * 0.1}px ${FONT_FAMILY}`;
                ctx.fillText(rank, x + BLOCK_WIDTH / 2, scoreY + BLOCK_WIDTH * 0.1);

                // レーティング値
                ctx.fillStyle = '#BD93F9';
                ctx.font = `bold ${BLOCK_WIDTH * 0.07}px ${FONT_FAMILY}`;
                ctx.textAlign = 'left';
                ctx.fillText(`C:${song.const.toFixed(1)}`, x + 15, y + BLOCK_HEIGHT - 15);
                ctx.textAlign = 'right';
                ctx.fillText(`R:${song.rating.toFixed(2)}`, x + BLOCK_WIDTH - 15, y + BLOCK_HEIGHT - 15);

                col++;
                if (col >= COLS) {
                    col = 0;
                    row++;
                }
            }
        };

        let bestListY = HEADER_HEIGHT;
        let recentListY = HEADER_HEIGHT;
        let bestListX = PADDING;
        let recentListX = PADDING;

        if (mode === 'vertical') {
            await drawSongList(bestList, 'BEST (30)', bestListY, PADDING, WIDTH - PADDING * 2, calcListHeight(bestList, COLS));
            recentListY = bestListY + calcListHeight(bestList, COLS) + CENTER_GAP;
            await drawSongList(recentList, 'RECENT', recentListY, PADDING, WIDTH - PADDING * 2, calcListHeight(recentList, COLS));
        } else {
            const bestWidth = (BLOCK_WIDTH * COLS) + (PADDING * (COLS - 1));
            recentListX = bestListX + bestWidth + CENTER_GAP;
            await drawSongList(bestList, 'BEST (30)', bestListY, bestListX, bestWidth, canvas.height - HEADER_HEIGHT - PADDING);
            await drawSongList(recentList, 'RECENT', recentListY, recentListX, bestWidth, canvas.height - HEADER_HEIGHT - PADDING);
        }

        updateMessage("画像を生成しました。右クリックして保存してください。", 100);
        const finalImage = new Image();
        finalImage.src = canvas.toDataURL('image/png');
        finalImage.style.cssText = 'max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 10px; box-shadow: 0 10px 40px rgba(0,0,0,0.5);';
        
        overlay.innerHTML = '';
        overlay.appendChild(finalImage);
        overlay.appendChild(globalCloseButton);

        const downloadButton = document.createElement('a');
        downloadButton.href = finalImage.src;
        downloadButton.download = `chunithm_rating_${playerData.name}_${now.getTime()}.png`;
        downloadButton.textContent = '画像をダウンロード';
        downloadButton.style.cssText = `
            position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%);
            padding: 15px 30px; background-color: #6272a4; color: white; border-radius: 8px;
            text-decoration: none; font-size: 16px; transition: background-color 0.2s;
        `;
        downloadButton.onmouseover = () => { downloadButton.style.backgroundColor = '#7184b8'; };
        downloadButton.onmouseout = () => { downloadButton.style.backgroundColor = '#6272a4'; };
        overlay.appendChild(downloadButton);
    };

    // --- メイン処理 ---
    (async () => {
        try {
            const settings = await askForSettings();
            if (isAborted) return;

            updateMessage("プレイヤー情報を取得中...", 5);
            const playerDataDoc = await fetchDocument(URL_PLAYER_DATA);
            const name = playerDataDoc.querySelector('.player_name_in').innerText;
            const maxRating = playerDataDoc.querySelector('.rating_max .text_b').innerText;
            const playerData = { name, maxRating };
            if (isAborted) return;
            
            updateMessage("定数データを取得中...", 10);
            const constDataResponse = await fetch(CONST_DATA_URL);
            const constData = await constDataResponse.json();
            if (isAborted) return;

            let bestList, recentList;

            if (settings.scanMode === 'paid') {
                 // --- 課金ユーザー向け処理 ---
                updateMessage("BEST枠のスコアを取得中...", 20);
                bestList = await scrapeRatingList(URL_RATING_BEST);
                if (isAborted) return;

                updateMessage("RECENT枠のスコアを取得中...", 40);
                recentList = await scrapeRatingList(URL_RATING_RECENT);
                if (isAborted) return;

                const allSongs = [...bestList, ...recentList];
                const totalSongs = allSongs.length;
                let processedCount = 0;

                for (const song of allSongs) {
                    if (isAborted) return;
                    processedCount++;
                    const progress = 50 + (processedCount / totalSongs) * 45;
                    updateMessage(`楽曲詳細を取得中: ${song.title} (${processedCount}/${totalSongs})`, progress);

                    if (settings.delay > 0 && processedCount > 1) {
                         await sleep(settings.delay * 1000);
                    }
                    if (isAborted) return;
                    
                    try {
                        const details = await scrapeMusicDetail(song.params);
                        song.artist = details.artist;
                        song.jacketUrl = details.jacketUrl;
                        song.playCount = details.playCount;
                    } catch (e) {
                         console.warn(`詳細取得失敗: ${song.title}`, e.message);
                         song.artist = 'N/A';
                         song.jacketUrl = ''; // fallback
                         song.playCount = 'N/A';
                    }
                    
                    const songConstData = constData.find(c => c.title === song.title && (c.diff === song.difficulty || (c.diff === 'MAS' && song.difficulty === 'MASTER')));
                    song.const = songConstData ? parseFloat(songConstData.const) : 0;
                    song.rating = calculateRating(song.score_int, song.const);
                    song.isNew = songConstData ? songConstData.version === CURRENT_VERSION : false;
                }
            } else {
                 // --- 無料ユーザー向け処理 ---
                 const { detailedNewSongs, detailedOldSongs } = await fetchAllSongsForFreeUser(settings.bestConstThreshold, settings.newConstThreshold, settings.delay, constData);
                 if (isAborted) return;
                 
                 bestList = detailedOldSongs.map(song => ({
                     ...song,
                     rating: calculateRating(song.score_int, song.const),
                     isNew: false
                 })).sort((a,b) => b.rating - a.rating).slice(0,30);

                 recentList = detailedNewSongs.map(song => ({
                     ...song,
                     rating: calculateRating(song.score_int, song.const),
                     isNew: true
                 })).sort((a,b) => b.score_int - a.score_int); // 新曲はスコア順？レート順？とりあえずスコア順
            }


            updateMessage("画像生成の準備中...", 95);

            bestList.sort((a, b) => b.rating - a.rating);
            recentList.sort((a, b) => b.rating - a.rating);

            await generateImage(playerData, bestList, recentList, settings.mode);

        } catch (error) {
            console.error("ブックマークレットの実行中にエラーが発生しました:", error);
            showError(error.message);
        }
    })();
})();
