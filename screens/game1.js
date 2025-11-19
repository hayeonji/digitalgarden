import { ScreenManager, state } from '../app.js';

export default {
  async mount(root) {
    // --- 1. 상태 정의 ---
    
    // 2단계 초기 대화
    const dialogueSteps = [
      { dialogue: `지금 큰일 났어요!! 웹사이트들의 화면 밝기가 너무 높아서
디지털 탄소가 쌓이고, 그 영향으로 정원이 점점 뜨겁게 달아오르고 있어요. `, leftText: '어떡해?', rightText: '해결방법 알려줘' },
      { dialogue: '스위치를 눌러 밝은 창을 모두 닫아주면 정원이 다시 숨을 쉴 수 있을 거예요.', leftText: '알겠어!', rightText: '좋았어!' }
    ];

    const videoPaths = [
      './assets/bg/game1/video/click1.mp4',
      './assets/bg/game1/video/click2.mp4',
      './assets/bg/game1/video/click3.mp4',
      './assets/bg/game1/video/click4.mp4',
      './assets/bg/game1/video/click5.mp4'
    ];

    // [!! 1. 수정 !!] finalStep을 요청하신 내용으로 변경
    const finalStep = {
      dialogue: '화면 밝기가 줄어든 덕분에 정원이 조금씩 회복되고 있어요. 이제 저희 집 안을 소개해드릴게요.',
      leftText: '좋아!', 
      rightText: '그래!',
      video: './assets/bg/game1/video/game1to2.mp4'
    };
    
    let currentDialogueStep = 0;
    let currentVideoCount = 0; 
    let isVideoPlaying = false;

    // --- 2. UI 구조 생성 ---
    const el = document.createElement('section');
    el.className = 'game1-wrap';
    
    el.innerHTML = `
      <video id="game1-video-player" class="game1-video-player" style="display: none;"></video>

      <div class="opening-card" id="game1-dialogue-card">
        <div class="opening-text">
          <p id="dialogue-text"></p>
        </div>
        <div class="opening-options">
          <div class="option-zone" id="opt-left"><span></span></div>
          <div class="option-zone" id="opt-right"><span></span></div>
        </div>
      </div>

      <div class="video-play-button" id="video-button" style="display: none;">
        </div>
    `;

    root.appendChild(el);

    // --- 3. DOM 요소 참조 ---
    const dialogueCardEl = el.querySelector('#game1-dialogue-card');
    const dialogueTextEl = el.querySelector('#dialogue-text');
    const leftBtn = el.querySelector('#opt-left');
    const rightBtn = el.querySelector('#opt-right');
    const videoButtonEl = el.querySelector('#video-button');
    const videoPlayerEl = el.querySelector('#game1-video-player');

    // --- 4. 핵심 기능 함수 ---

    /** 마지막 비디오를 재생하고 game2로 이동 */
    const playFinalVideo = async () => {
      if (isVideoPlaying) return;
      
      let hasEnded = false; 
      
      dialogueCardEl.style.display = 'none';
      videoPlayerEl.style.display = 'block';
      videoPlayerEl.style.zIndex = '100';
      videoPlayerEl.src = finalStep.video;

      const onEnd = () => {
        if (hasEnded) return;
        hasEnded = true;
        isVideoPlaying = false;
        videoPlayerEl.onended = null;
        videoPlayerEl.onerror = null;
        ScreenManager.go('game2');
      };
      
      videoPlayerEl.onended = onEnd;
      videoPlayerEl.onerror = onEnd;
      videoPlayerEl.muted = false;
      videoPlayerEl.autoplay = true;
      videoPlayerEl.playsInline = true;

      videoPlayerEl.play().then(() => {
        videoPlayerEl.playbackRate = 1.0; // [!!] 1배속 설정
        isVideoPlaying = true;
      }).catch(err => {
        console.warn("Final video play() promise failed:", err);
        onEnd();
      });
    };

    /** 5번 클릭 후 마지막 대화 표시 */
    // [!! 2. 수정 !!] buttonText -> leftText/rightText로 변경
    const showFinalDialogue = () => {
      videoButtonEl.style.display = 'none';
      dialogueCardEl.style.display = 'block';
      dialogueTextEl.innerHTML = finalStep.dialogue;
      leftBtn.querySelector('span').textContent = finalStep.leftText;
      rightBtn.querySelector('span').textContent = finalStep.rightText;
      leftBtn.onclick = playFinalVideo;
      rightBtn.onclick = playFinalVideo;
    };

    /** 비디오 버튼 클릭 핸들러 (5회 반복) */
    const handleVideoButtonClick = async () => {
      if (isVideoPlaying || currentVideoCount >= videoPaths.length) {
        return;
      }
      
      let hasThisVideoEnded = false; 

      videoButtonEl.style.display = 'none';
      videoPlayerEl.style.display = 'block';
      videoPlayerEl.style.zIndex = '100';
      videoPlayerEl.src = videoPaths[currentVideoCount];

      const onVideoEnd = () => {
        if (hasThisVideoEnded) return;
        hasThisVideoEnded = true;
        
        isVideoPlaying = false;
        videoPlayerEl.onended = null;
        videoPlayerEl.onerror = null;
        videoPlayerEl.style.zIndex = '10';

        currentVideoCount++;

        if (currentVideoCount < videoPaths.length) {
          videoButtonEl.style.display = 'flex';
        } else {
          showFinalDialogue();
        }
      };

      videoPlayerEl.onended = onVideoEnd;
      videoPlayerEl.onerror = onVideoEnd;
      videoPlayerEl.muted = false;
      videoPlayerEl.autoplay = true;
      videoPlayerEl.playsInline = true;

      videoPlayerEl.play().then(() => {
        videoPlayerEl.playbackRate = 2.0; // [!!] 2배속 설정
        isVideoPlaying = true;
      }).catch(err => {
        console.warn("Click video play() promise failed:", err);
        onVideoEnd();
      });
    };

    /** 초기 대화 단계 표시 */
    const showDialogueStep = (stepIndex) => {
      if (stepIndex >= dialogueSteps.length) { 
        dialogueCardEl.style.display = 'none';
        videoButtonEl.style.display = 'flex';
        return;
      }
      const current = dialogueSteps[stepIndex];
      dialogueTextEl.innerHTML = current.dialogue;
      leftBtn.querySelector('span').textContent = current.leftText;
      rightBtn.querySelector('span').textContent = current.rightText;
    };

    /** 초기 대화 옵션(버튼) 클릭 핸들러 */
    const handleDialogueOptionClick = () => {
      currentDialogueStep++;
      showDialogueStep(currentDialogueStep);
    };

    // --- 5. 초기화 ---
    
    leftBtn.addEventListener('mouseenter', () => dialogueCardEl.classList.add('hover-left'));
    leftBtn.addEventListener('mouseleave', () => dialogueCardEl.classList.remove('hover-left'));
    rightBtn.addEventListener('mouseenter', () => dialogueCardEl.classList.add('hover-right'));
    rightBtn.addEventListener('mouseleave', () => dialogueCardEl.classList.remove('hover-right'));
    
    leftBtn.onclick = handleDialogueOptionClick;
    rightBtn.onclick = handleDialogueOptionClick;

    videoButtonEl.onclick = handleVideoButtonClick;
    videoButtonEl.addEventListener('mouseenter', () => videoButtonEl.classList.add('hover'));
    videoButtonEl.addEventListener('mouseleave', () => videoButtonEl.classList.remove('hover'));

    showDialogueStep(currentDialogueStep); // 0번 대화 표시
  }
};