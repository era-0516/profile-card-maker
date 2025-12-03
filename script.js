// ★ここにスプレッドシートのCSV公開URLを貼ってください
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSDdpOAGS73ThqKdip47p5nzw7_rVRYQqdX8EIcB1p3NnuLh-mQPOvDHSZ7cxerUw9CXb9nb_BZjS1u/pub?gid=0&single=true&output=csv';

window.onload = async function() {
    const formContainer = document.getElementById('dynamicForm');
    const cardEntries = document.getElementById('card-entries');

    try {
        // 1. CSVデータを取得
        const response = await fetch(SHEET_CSV_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const text = await response.text();
        
        // 2. CSVを配列に変換
        const rows = text.trim().split('\n').map(row => row.split(','));
        
        // AA1セルの値をフッターに反映 ---
        // A列=0, B列=1 ... Z列=25, AA列=26番目になります
        // もしAA1が空なら、デフォルトの英語表記のままにします
        const headerRow = rows[0];
        const footerText = (headerRow.length > 26 && headerRow[26].trim() !== "") 
                           ? headerRow[26].trim() 
                           : 'X Profile Card Generator';
        
        // フッターの文字を書き換える
        const footerEl = document.querySelector('.footer');
        if (footerEl) {
            footerEl.textContent = footerText;
        }

        const data = rows.slice(1); // 1行目（ヘッダー）を除外

        // 読み込み成功したら「読み込み中...」を消す
        formContainer.innerHTML = ''; 

        // 3. データごとにループして要素を生成
        data.forEach((row, index) => {
            // データが空の行はスキップ
            if (row.length < 2) return;

            const labelText = row[0]; // 質問タイトル
            const type = row[1];      // 入力タイプ
            // 選択肢がある場合、改行コードを除去して | で分割
            const options = row[2] ? row[2].replace(/[\r\n]+/g, '').split('|') : [];

            // --- A. フォーム側の作成 ---
            const formGroup = document.createElement('div');
            formGroup.className = 'form-group';
            
            const labelEl = document.createElement('label');
            labelEl.textContent = labelText;
            formGroup.appendChild(labelEl);

            // --- B. プレビュー側の作成 ---
            const cardRow = document.createElement('div');
            cardRow.className = 'card-row';
            cardRow.innerHTML = `<strong>${labelText}:</strong> <span id="preview-${index}">-</span>`;
            cardEntries.appendChild(cardRow);

            // --- C. 入力タイプ別の要素生成 ---
            if (type === 'text') {
                const input = document.createElement('input');
                input.type = 'text';
                input.placeholder = '入力してください';
                input.addEventListener('input', (e) => {
                    document.getElementById(`preview-${index}`).textContent = e.target.value || '-';
                });
                formGroup.appendChild(input);

            } else if (type === 'select') {
                const select = document.createElement('select');
                const defaultOpt = document.createElement('option');
                defaultOpt.text = '選択してください';
                select.appendChild(defaultOpt);

                options.forEach(opt => {
                    const option = document.createElement('option');
                    option.value = opt;
                    option.textContent = opt;
                    select.appendChild(option);
                });

                select.addEventListener('change', (e) => {
                    document.getElementById(`preview-${index}`).textContent = e.target.value;
                });
                formGroup.appendChild(select);

            } else if (type === 'radio') {
                const radioContainer = document.createElement('div');
                radioContainer.className = 'radio-group';
                
                options.forEach(opt => {
                    const rLabel = document.createElement('label');
                    const radio = document.createElement('input');
                    radio.type = 'radio';
                    radio.name = `radio-${index}`;
                    radio.value = opt;
                    
                    radio.addEventListener('change', (e) => {
                         document.getElementById(`preview-${index}`).textContent = e.target.value;
                    });

                    rLabel.appendChild(radio);
                    rLabel.append(` ${opt}`); 
                    radioContainer.appendChild(rLabel);
                });
                formGroup.appendChild(radioContainer);

            } else if (type === 'checkbox') {
                // ★ここが改行機能付きのチェックボックス処理です
                const checkContainer = document.createElement('div');
                checkContainer.className = 'radio-group';
                
                // Flexboxで折り返しを有効にする
                checkContainer.style.display = 'flex';
                checkContainer.style.flexWrap = 'wrap'; 
                checkContainer.style.alignItems = 'center';

                const checkedValues = new Set(); 

                options.forEach(opt => {
                    // --- 改行判定 ---
                    // 文字列の前後の空白を消して、'---' かどうかチェック
                    if (opt.trim() === '---') { 
                        const breakLine = document.createElement('div');
                        breakLine.className = 'break-line'; // CSSのクラスを適用
                        checkContainer.appendChild(breakLine);
                        return; // ここで中断して次のループへ
                    }

                    // --- 通常のチェックボックス ---
                    const cLabel = document.createElement('label');
                    cLabel.style.marginRight = '15px'; 
                    cLabel.style.marginBottom = '5px';

                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.value = opt;

                    checkbox.addEventListener('change', (e) => {
                        if (e.target.checked) {
                            checkedValues.add(e.target.value);
                        } else {
                            checkedValues.delete(e.target.value);
                        }
                        // Setを配列にして結合
                        const resultText = Array.from(checkedValues).join(' / ');
                        document.getElementById(`preview-${index}`).textContent = resultText || '-';
                    });

                    cLabel.appendChild(checkbox);
                    cLabel.append(` ${opt}`);
                    checkContainer.appendChild(cLabel);
                });
                formGroup.appendChild(checkContainer);
            }

            formContainer.appendChild(formGroup);
        });

    } catch (error) {
        console.error('エラー詳細:', error); // コンソールにエラーを出す
        formContainer.innerHTML = '<p style="color:red">エラーが発生しました。F12キーを押してコンソールを確認してください。</p>';
    }

    // 画像保存ボタン
    document.getElementById('downloadBtn').addEventListener('click', function() {
        const cardArea = document.getElementById('card-canvas');
        html2canvas(cardArea, { scale: 2, useCORS: true }).then(canvas => {
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = 'my-profile-card.png';
            link.click();
        });
    });
};
