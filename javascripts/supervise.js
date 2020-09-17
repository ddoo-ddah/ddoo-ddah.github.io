const base64toBlob = (base64Data, contentType) => {
    contentType = contentType || '';
    let sliceSize = 512;
    let byteCharacters = atob(base64Data);
    let bytesLength = byteCharacters.length;
    let slicesCount = Math.ceil(bytesLength / sliceSize);
    let byteArrays = new Array(slicesCount);

    for (let sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
        const begin = sliceIndex * sliceSize;
        const end = Math.min(begin + sliceSize, bytesLength);

        const bytes = new Array(end - begin);
        for (let offset = begin, i = 0; offset < end; ++i, ++offset) {
            bytes[i] = byteCharacters[offset].charCodeAt(0);
        }
        byteArrays[sliceIndex] = new Uint8Array(bytes);
    }
    return new Blob(byteArrays, { type: contentType });
}

// socket.io 관련 event
window.onload = async event => {

    const socket = io();

    // 참여자 목록 이벤트
    const userlist = document.querySelector('#user-list').children;
    console.log(userlist);
    socket.on('welcome', (data) => {
        const mailAddress = data.email;
        console.log(mailAddress);
        for (const a of userlist) {
            if (mailAddress === a.innerText.match(/\((.*?)\)/)[1]) {
                a.firstChild.className = 'list-group-item';
            }
        }
    });

    /* 채팅 - welcome, chat, disconnect */
    const chatform = document.querySelector('#chat');
    const message = document.querySelector('input[name="message"]');
    chatform.addEventListener('submit', (event) => { // 메시지 전송
        event.preventDefault();
        if (message.value === '') {
            return;
        }
        socket.emit('chat', {
            message: message.value
        });
        message.value = '';
    });
    const chatlog = document.querySelector('#card-chatlog');
    socket.emit('welcome', { // 웰컴 메시지로 이름 뿌리기
        name: '감독'
    });
    socket.on('chat', (data) => { // 채팅 왔을때 채팅로그에 온 채팅 추가하기
        chatlog.appendChild(createSpeechBubble(data.sender, data.message, data.timestamp, false));
        chatlog.scrollTop = chatlog.scrollHeight;
    }).on('disconnect', (data) => { // 연결 끊겼을때

    });

    /* mobile - 서버 측: mobile-welcome, mobile-disconnect
                클라 측: requset-data, eye, stop-data */
    for (const a of userlist) {
        a.addEventListener('click', event => {
            // const mailAddress = a.innerText.match(/\((.*?)\)/)[1]; // TODO?: userCode 말고 email을 전송하는 거로 바꾸기
            const userCode = a.id;
            socket.emit('stop-data'); // 전송하고 있던 디바이스한테 전송 멈추게 하고 (TODO: 딜레이 때문에 살짝 다르게 동작하는 것 고치기)
            socket.emit('request-data', { // userCode에 맞는 디바이스만 전송 시작하도록 서버에 유저코드 보냄
                type: 'RES',
                userCode: userCode
            });
        });
    }

    const eyeImage = document.querySelector('#image-eye');
    const screenImage = document.querySelector('#image-screen');
    socket.on('eye', (data) => {
        const blobData = base64toBlob(data, 'image/jpg');
        const urlCreator = window.URL || window.webkitURL;
        const imageUrl = urlCreator.createObjectURL(blobData);
        eyeImage.src = imageUrl;
    }).on('screen', (data) => {
        const blobData = base64toBlob(data, 'image/png');
        const urlCreator = window.URL || window.webkitURL;
        const imageUrl = urlCreator.createObjectURL(blobData);
        screenImage.src = imageUrl;
    }).on('stop-data', () => {
        eyeImage.src = '/images/eye-default.png';
        screenImage.src = '/images/screen-default.png';
    });

    /* 부정 행위 로그 */
    const cheatingLog = document.querySelector('#card-cheatinglog');
    socket.on('cheat', (data) => {
        const log = document.createElement('p');
        log.innerText = `(${data.timestamp}) ${data.userName} : ${data.content}`;
        cheatingLog.appendChild(log);
    });
}

function createSpeechBubble(sender, message, timestamp, flag) {
    const div = document.createElement('div');
    div.className = 'px-1';
    if (!flag) {
        div.innerText = `👩🏻 ${sender}`;
        div.appendChild(document.createElement('br'));
    }

    const m = document.createElement('div');
    m.className = 'card d-inline-block ml-4 p-1';
    if (flag) {
        m.className += ' bg-warning float-right';
    }
    m.innerText = message;
    div.appendChild(m);
    div.appendChild(document.createElement('br'));

    const t = document.createElement('span');
    t.className = 'text-muted';
    t.className += flag ? ' float-left' : ' float-right';
    t.innerText = timestamp;
    div.appendChild(t);

    return div;
}
