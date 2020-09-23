# FBEye

## What is FBEye?
 #### Find Bad Eye
 * 시선 추적을 통한 온라인 시험 부정행위 탐지 프로그램 입니다.
 * 추가적으로 서버와의 QR코드 대조를 통해서 실시간 접속 확인을 합니다.
 * 적외선 카메라 등의 특수한 장치 없이 스마트폰으로 시선 추적을 할 수 있습니다.
 * [안드로이드 앱](https://github.com/ddoo-ddah/fbeye-mobile_android), [인증서버](https://github.com/ddoo-ddah/fbeye-processing-server), [관리자용 웹페이지](https://github.com/ddoo-ddah/fbeye-web-server), [수험자용 클라이언트](https://github.com/ddoo-ddah/fbeye-desktop_windows) 와 연동하여 사용할 수 있습니다.

 * 시선추적 정확도의 평가는 아직 완료되지 않았습니다.
 * 현재 fbeye.xyz 웹사이트 페이지는 정적 웹페이지로 전환된 상태입니다.
 
 * * *
 
# [FBEye Android Application](https://github.com/ddoo-ddah/fbeye-mobile_android) 

## How it works?
#### Eye LandMark Detection
 1. 이 기능은 [Learning to Find Eye Region Landmarks for Remote Gaze Estimation in Unconstrained Settings](https://ait.ethz.ch/projects/2018/landmarks-gaze/) 을 인용하여 제작되었습니다. 상세 모델 구현은 논문을 참고하시기 바랍니다.
 2. 눈 영역의 그레이스케일 이미지를 입력하면, 해당하는 눈 이미지에서 Eyelid, Iris edge와 Iris center, Eyeball Center가 출력됩니다.
 3. 입력크기는 108\*180\*1 이며 출력크기는 36\*60\*18 입니다.
 4. HeatMap 형태로 출력되며, 각 영역에 해당하는 값중 최대치를 찾아 좌표로 변환하면 사용 할 수 있습니다.
 
 * 모델은 데스크탑에서 학습되었으며 충분히 학습된 모델을 안드로이드에서 사용 할 수 있도록 변환하였습니다.
 * 변환된 모델은 추가적인 학습이 불가능하며, [Tensorflow-lite](https://www.tensorflow.org/lite/) 라이브러리를 사용하여 동작시킬수 있습니다.
 * 학습에 사용된 데이터셋은 420만개 가량입니다.

#### Face Detection
 1. [CameraX](https://developer.android.com/training/camerax) 라이브러리와 [Google Mlkit](https://developers.google.com/ml-kit/vision/face-detection) 라이브러리를 통해 얼굴 및 얼굴의 특징점을 찾습니다.
 2. Face Detection에 입력되는 이미지의 크기는 640 x 480이어야 하며, 출력되는 이미지 또한 640 x 480 입니다. 이는 원본이미지의 크기 및 비율과는 독립적입니다.
    * CameraX 라이브러리를 사용하면 별다른 설정을 할 필요가 없습니다. 
 3. 얼굴이 20프레임 이상 검출되지 않는 경우 자리이탈로 판단하여 서버에 로그를 전송합니다.
 4. 서버에서 이미지 요청이 오는경우 얼굴이 검출되지 않는 경우에도 전면 카메라 영상을 전송합니다.

#### Eye Gaze Estimation
 1. 위의 Face Detection으로 얻어낸 얼굴 특징점을 사용합니다.
 2. 얼굴 특징점 중 왼쪽 및 오른쪽 눈의 위치를 찾고, 이를 이미지로 추출합니다.
 3. [Tensorflow-lite](https://www.tensorflow.org/lite/) 라이브러리로 Eye LandMark Detection 모델을 작동시켜 2의 이미지에서 Eye Landmark를 얻어냅니다. 
 4. 3에서 얻은 Eye Landmark를 기반으로 시선 방향 값을 구합니다.
 5. 시선 방향 값을 인증서버로 전송합니다.
 6. 서버에서 이미지 전송요청이 오는경우, 눈동자의 테두리와 시선방향이 그려진 이미지를 생성하여 서버로 전송합니다.
 
 * 검출 속도 향상을 위해 GPU 가속을 사용합니다.
 * 기기에 따라 GPU 가속을 사용할 수 없는 경우도 있습니다. 이 경우 관련 옵션을 제거해 주시기 바랍니다.
 
#### QR Code Scan
 1. [Google Mlkit](https://developers.google.com/ml-kit/vision/barcode-scanning) 및 [CameraX](https://developer.android.com/training/camerax) 라이브러리를 사용하여
 PC 클라이언트에서 보여주는 QR Code를 인식합니다.
 2. QR코드를 첫번째로 인식한 경우 5초간 대기 한 뒤에 서버로 전송합니다. 
 3. 2의 대기시간 중 휴대폰의 흔들림이 감지되면 핸드폰을 사용한 것으로 간주하여 다시 5초간 대기합니다.
 4. QR Code가 인증서버에서 확인된 경우에만 안드로이드 어플리케이션 및 PC 클라이언트를 정상적으로 사용 할 수 있습니다.
    * 사실상의 로그인 기능입니다.
 5. 이후 시험을 응시하는 동안에도 주기적으로 변경되는 QR Code를 인식하여 서버로 전송합니다.
 * QR Code에서 일부 데이터를 추출하여 이미지 서버와의 연결을 성립시킬때도 사용합니다.
 
#### Processing Server Connection
 1. 보안을 위해 SSLSocket과 프로토콜 TLSv1.2를 사용해서 연결했습니다.
 2. 원활한 통신을 위해 [JSONOBJECT](https://developer.android.com/reference/org/json/JSONObject)을 사용해서 데이터를 주고 받습니다.

#### Image Server Connection
 1. [Socket.IO](https://socket.io/blog/native-socket-io-and-android/)를 사용해서 연결했습니다.
 2. 이미지의 생성과 전송의 비용이 크기 때문에 서버로부터 요청이 들어오는 경우에만 이미지를 전송합니다.
 3. 이미지 서버에서 사용하기 편하도록 적절하게 리사이징후 base64 이미지로 변환합니다.
 4. stop명령이 오기 전까지 매 프레임마다 변환된 이미지를 계속해서 보냅니다.
 
#### Pages
 1. 각각의 화면들은 [wakelock](https://developer.android.com/training/scheduling/wakelock)을 이용해서 실행 중에 꺼지지 않습니다.
 2. 사용자의 편의성을 위해 처음 카메라 조정을 제외하면 특별한 조작이 필요없습니다.
 3. 시험 도중엔 UI가 사라집니다.

## Requirements
 * Recommended Device : Samsung Galaxy S10 series or later
 * Android : Oreo or later (API 22+)
 * ABI : armeabi-v7a or arm64-v8a

 #### Dependencies
 
   * [kotlinx-coroutines](https://developer.android.com/kotlin/coroutines)
   * [Google MLkit barcode Scanning](https://developers.google.com/ml-kit/vision/barcode-scanning)
   * [Google MLkit Face detection](https://developers.google.com/ml-kit/vision/face-detection)
   * [Android CameraX](https://developer.android.com/training/camerax)
   * [Socket.io](https://github.com/socketio/socket.io-client-java)
   * [OpenCV](https://github.com/quickbirdstudios/opencv-android)
   * [Tensorflow-lite](https://www.tensorflow.org/lite/)
 
 ### Reference
 > @inproceedings{Park2018ETRA,
	author = {Park, Seonwook and Zhang, Xucong and Bulling, Andreas and Hilliges, Otmar},
	title = {Learning to Find Eye Region Landmarks for Remote Gaze Estimation in Unconstrained Settings},
	booktitle = {ACM Symposium on Eye Tracking Research and Applications (ETRA)},
	series = {ETRA '18},
	year = {2018},
	location = {Warsaw, Poland},
	publisher = {ACM},
	address = {New York, NY, USA},
}
 
* * * 

# [FBEye Web Server](https://github.com/ddoo-ddah/fbeye-web-server)

## 실행
- `npm start`

## 기능
[FBEye Web Server](https://github.com/ddoo-ddah/fbeye-web-server)는 시험 감독자를 위한 시험 관리/감독 웹 어플리케이션입니다. 시험 관리자(감독) 계정으로 회원가입 및 로그인하여 사용할 수 있습니다.
- 시험 관리 페이지, 문제 관리 페이지, 응시자 관리 페이지를 이용해 시험을 생성하거나 삭제할 수 있으며, 시험 문제와 응시자에 대한 정보를 수정할 수 있습니다.
- 시험 도중 채팅으로 응시자들과 실시간으로 소통하며 시험에 관한 피드백을 빠르게 주고받을 수 있습니다.
- 응시자가 부정 행위로 의심되는 행위를 할 시 해당 사항에 대한 로그가 감독관에게 전송됩니다. 감독관은 웹 페이지로 전송된 로그를 보고 누가 어떤 행위를 했는지 확인할 수 있습니다.
- 참여자 목록에서 응시자를 선택하여 해당 응시자의 얼굴과 화면 영상을 실시간으로 볼 수 있습니다.

## 특징
- Javascript 런타임 Node.js와 웹 프레임워크 Express.js를 사용하여 구현했습니다.
- socket.io를 통한 실시간 채팅 및 사진 스트리밍
- MongoDB를 사용하여 DB 서버 구현

## 작동 원리
FBEye Web Server의 작동 원리에 대해 설명하는 파트입니다.
### 회원가입
- 회원가입 페이지에서 이메일과 비밀번호, 확인 비밀번호를 입력하여 회원가입을 합니다. 회원가입을 하며 사용자가 입력한 데이터는 서버로 전송됩니다.
- 비밀번호와 확인 비밀번호가 일치하는지 검사합니다. 일치하지 않는다면 패스워드가 일치하지 않는다고 flash를 전송하며 회원가입 페이지로 리다이렉트하고, 일치한다면 다음 단계로 넘어갑니다.
- 전송받은 데이터와 동일한 정보가 DB에 저장되어 있는지 검사합니다. 동일한 정보가 DB에 이미 저장되어 있다면 이미 등록된 이메일이라고 flash를 전송하며 회원가입 페이지로 리다이렉트하고, 새로운 데이터라면 DB에 데이터를 저장한 뒤 회원가입에 성공하였다고 flash를 전송하며 로그인 페이지로 리다이렉트합니다.
### 로그인
- 사용자가 로그인을 시도하면서 입력한 이메일과 비밀번호가 서버로 전송됩니다.
- 서버는 DB 내에 전송받은 데이터와 일치하는 데이터가 있는지 검사합니다. 검사에 실패하면 이메일이나 패스워드가 잘못되었다고 flash를 전송하며 로그인 페이지를 클라이언트에게 전송하고, 성공하면 세션에 로그인 정보를 등록합니다.
### 시험 관리
#### 시험 추가
- 새로운 시험을 추가하는 페이지입니다. 시험 이름, 시험 감독관, 시험 시작/종료 시간, 시험 코드를 결정합니다.
- 사용자는 시험 이름, 시험 시작/종료 시간을 입력합니다. 감독관은 현재 세션의 주인으로, 변경할 수 없습니다. 시험 코드는 무작위로 생성되는 코드로, 변경할 수 없습니다.
- 추가된 시험은 시험 관리 목록에 나타나 개요 열람/수정 및 감독이 가능하게 됩니다.
#### 시험 개요
- 시험에 대한 정보를 표시합니다. 이름, 시작/종료 시간, 시험 코드를 확인할 수 있고, 시험에 총 몇 문제가 있는지, 응시자는 총 몇 명이 있는지 확인할 수 있습니다. 이 페이지에서는 문제 관리, 응시자 관리 페이지로 넘어갈 수 있습니다.
#### 문제 관리
- 시험에 등록되어 있는 문제들의 문제 번호, 문제 내용, 문제 형식, 배점의 정보를 확인할 수 있습니다.
- 문제 추가 버튼을 눌러 새로운 문제를 추가하는 페이지로 넘어갈 수 있고, 각 문제를 눌러 해당 문제를 수정하는 페이지로 넘어갈 수 있습니다.
#### 문제 추가
- 형식, 배점, 문제, 정답을 입력할 수 있습니다. 사용자가 완료 버튼을 누르면 입력한 데이터가 서버로 전송되어 DB에 저장됩니다.
#### 문제 편집
- 추가된 문제를 수정할 수 있는 페이지입니다.
#### 응시자 관리
- 시험에 등록된 응시자들의 목록을 볼 수 있는 페이지입니다. 응시자 추가 버튼을 눌러 새로운 응시자를 추가하는 페이지로 넘어갈 수 있습니다.
#### 응시자 추가
- 응시자 이메일, 이름, 응시자 코드를 등록하는 페이지입니다. 이 중 응시자 코드는 무작위로 생성되는 코드로, 변경할 수 없습니다.
### 시험 감독
시험이 치뤄지는 동안 참여자들을 감독하는 페이지입니다.
- 감독 페이지는 크게 참여자 목록, 참여자 영상, 부정행위 로그, 채팅의 4개의 패널로 나뉘어집니다.
- 참여자 목록 패널에서는 시험에 등록된 참여자를 확인할 수 있습니다. (( 참여자가 시험에 입장했는지 색을 통해 확인할 수 있습니다. ))
- 참여자 영상 패널에서는 참여자들의 얼굴 영상과 시험 화면을 확인할 수 있습니다. 참여자 목록에서 영상을 확인하고 싶은 참여자를 눌러서 선택하면 해당 참여자의 얼굴 영상과 시험 화면이 실시간으로 보이게 됩니다.
- 부정행위 로그 패널에서는 참여자가 부정행위를 했다고 의심될 때마다 전송되는 로그를 볼 수 있습니다. 부정행위를 했다고 의심되는 참여자가 누구고, 언제 어떤 행동을 했는지 확인할 수 있습니다.
- 채팅 패널에서는 시험에 대한 정보, 시험 문제에 대한 피드백 등을 실시간으로 참여자들과 주고받으며 소통할 수 있습니다.

## 외부 라이브러리
- [Bootstrap](https://getbootstrap.com/) (프론트엔드 프레임워크)
- [Node.js](https://nodejs.org/en/) (Javascript 런타임)
- [Express.js](https://expressjs.com/) (Node.js 웹 프레임워크)
- [ejs (Jake)](https://ejs.co/) (템플릿 엔진)
- [socket.io](https://socket.io/) (WebSocket 라이브러리)
- [MongoDB](https://www.mongodb.com/) (문서형 NoSQL 데이터베이스)

* * * 

# [FBEye Desktop Application](https://github.com/ddoo-ddah/fbeye-desktop_windows)
## Features
##### QR코드를 통한 실시간 인증
- [처리 서버](https://github.com/ddoo-ddah/fbeye-processing-server "처리 서버")에서 받아온 QR코드 데이터를 [Zxing](https://github.com/zxing/zxing "Zxing")라이브러리를 이용해서 화면으로 출력합니다. 이는 [모바일 앱](https://github.com/ddoo-ddah/fbeye-mobile_android "모바일 앱")을 통해 인증하는 데 사용됩니다.

##### 부정행위 방지
1. QR코드를 통한 실시간 인증에 실패하면 시험 문제가 보이지 않게 됩니다.
2. 창 크기를 조절하거나, 최소화 시킬 수 없게 됩니다.
3. 2개 이상의 모니터 사용 시 다른 모니터의 화면을 가려서 하나의 모니터만 사용할 수 있게 됩니다.
4. 이 프로그램 외에 다른 프로그램을 앞으로 띄워 볼 수 없게 합니다.
5. 시험 응시 중인 화면은 [관리자용 웹페이지](https://github.com/ddoo-ddah/fbeye-web-server "관리자용 웹페이지")에서 관리자가 볼 수 있게 됩니다.

##### 시험 환경 제공
- 화면 밖을 보지 않더라도 시험을 볼 수 있는 환경을 제공합니다.
 1. 메모할 수 있는 공간이 제공됩니다.
 1. 시험 종료까지 남은 시간을 확인할 수 있습니다.
- 처음 사용하는 사람을 위해 시험 전 샘플 환경을 제공합니다.
- 시험 전, 진행 중에 시험 관리자와 채팅을 통해 소통할 수 있습니다.

##### EyeTracking 및 부정행위 감지
* [처리 서버](https://github.com/ddoo-ddah/fbeye-processing-server "처리 서버")에서 전송한 모든 시선 방향 벡터는 최신 5개의 값을 평균내어 사용합니다.
1. Calibration 단계에서 화면상의 특징점을 쳐다보며 키 입력을 하면 해당 좌표에 대한 시선 방향 벡터가 입력됩니다.
2. 서버에서 시선 데이터가 넘어오는 경우, 다음과 같은 순서로 화면상 좌표를 계산합니다.
   1. 점 한개를 고르고 그와 이웃한 3개의 점을 골라 직사각형을 만듭니다. 직사각형이 아닌경우는 계산하지 않습니다.
   2. i에서 만든 직사각형의 각 꼭짓점에 등록되어 있는 시선 방향 벡터들을 교차하여 만들수 있는 모든 사각형에 대하여 다음을 시도합니다.
        1. 검사할 값이 사각형 내부에 있는지 판별합니다.
        2. 사각형 내부에 있는경우 투영 변환을 통해 해당 사각형 내부의 상대좌표를 구합니다.
        3. i에서 만든 직사각형의 시작점과 길이, b에서 얻은 내부좌표를 활용해 화면상의 실 좌표를 계산합니다.
3. 2에서 얻은 모든 값들중 양 끝 25%를 제외한 25%~75%의 값들을 평균을 내어 현재 시선에 대한 화면상 좌표를 얻어냅니다.
4. Calibration 단계에서 Eye-Tracking이 잘 되는지 확인 할 수 있습니다.
5. 모든 특징점에 대해 5회 이상의 값이 입력된경우 Calibration이 종료됩니다.
6. 시험 응시단계에서 2에서 얻은 값이 전혀 없는 경우, 시선이 화면 밖으로 나간것으로 간주, 서버로 부정행위 로그를 전송합니다.

## Library
##### - [Zxing](https://github.com/zxing/zxing "Zxing")
##### - [Socket.io](https://github.com/socketio/socket.io-client-java "Socket.io")
##### - [JSON](https://github.com/douglascrockford/JSON-java "JSON")
##### - okhttp
##### - okio
##### - [FlatSwing](https://github.com/Mommoo/FlatSwing "FlatSwing")

* * *

# [FBEye Processing Server](https://github.com/ddoo-ddah/fbeye-processing-server)

## 설치
1. Node.js 12 or later 설치
2. `npm install` 명령을 사용하여 의존성 패키지 설치

## 실행
- `npm start`

## 설정
- settings.json 파일을 수정하여 설정
### `net`: 네트워크 설정
- `key`: TLS에 사용할 개인키
- `cert`: TLS에 사용할 인증서
- `desktop.port`: 데스크탑 앱 연결을 위한 포트
- `mobile.port`: 모바일 앱 연결을 위한 포트
### `db`: 데이터베이스 설정
- `uri`: MongoDB 서버 주소
### `auth`: 사용자 인증 설정
- `size`: 인증 코드의 길이
- `interval`: 인증 코드 갱신 주기
### `crypto`: 암호화 설정
- `algorithm`: 암호화 알고리즘
- `length`: 암호화에 사용할 키의 길이


