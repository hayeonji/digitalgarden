import { ScreenManager, state } from '../app.js';

export default {
  async mount(root) {
    // --- 1. 상태 정의 ---
    
    // 1-1. 비디오 1개
    const introVideoPath = './assets/bg/ending/video/intro1.mp4'; 

    // 1-2. 대화와 이미지 2단계
    const finalStep1 = {
      dialogue: `${state.nickname || '방문자'}님 덕분에 디지털 정원이 푸릇푸릇해졌어요. 이제 저희는 여기서 인사를 나눠야 할 것 같네요.`,
      leftText: '너무 좋아!',
      rightText: '다행이야',
      image: './assets/bg/ending/image/final1.png'
    };
    const finalStep2 = {
      dialogue: '고마운 마음을 담아 가는 길에 작은 선물을 하나 준비해뒀어요. 이곳을 나가면 받아보실 수 있을 거예요. ',
      leftText: '헐 아쉬워..',
      rightText: '기대된다! 고마워',
      image: './assets/bg/ending/image/final2.png'
    };
    
    // 1-3. 3번째 단계 (새 영상 + 중앙 문구 + 작은 이미지)
    const finalStep3 = {
        video: './assets/bg/ending/video/final.mp4',
        centerText: '띵동! <br>지킴이가 보낸 선물이 도착했어요.',
        smallImage: './assets/ui/ending/giftbox.png',
        backgroundImage: './assets/ui/ending/background.png'
    };

    // 1-4. 비디오 재생 중복 방지 플래그
    let isVideoPlaying = false; 

    // --- 2. UI 구조 생성 ---
    const el = document.createElement('section');
    el.className = 'ending-wrap';
    
    el.innerHTML = `
      <video id="ending-video-player" class="ending-video-player"></video>

      <div class="opening-card" id="ending-dialogue-card" style="display: none;">
        <div class="opening-text"><p id="dialogue-text"></p></div>
        <div class="opening-options">
          <div class="option-zone" id="opt-left"><span></span></div>
          <div class="option-zone" id="opt-right"><span></span></div>
        </div>
      </div>
      
      <div class="ending-ui-step3" id="ending-ui-step3" style="display: none;">
        
        <div class="partial-background"> 
          <p class="ending-center-text">${finalStep3.centerText}</p>
          <img src="${finalStep3.smallImage}" class="ending-small-image" alt="Small Icon" /> 
          <div class="ending-button" id="btn-go-to-3d"></div> 
        </div> 
        
      </div>
    `;

    root.appendChild(el);

    // --- 3. DOM 요소 참조 ---
    const dialogueCardEl = el.querySelector('#ending-dialogue-card'), dialogueTextEl = el.querySelector('#dialogue-text'), leftBtn = el.querySelector('#opt-left'), rightBtn = el.querySelector('#opt-right');
    const videoPlayerEl = el.querySelector('#ending-video-player');
    const uiStep3 = el.querySelector('#ending-ui-step3'); 
    const btnGoTo3D = el.querySelector('#btn-go-to-3d'); 
    const partialBackgroundEl = el.querySelector('.partial-background');

    // --- 4. 핵심 기능 함수 ---

    /** [신규] Step 3 UI 표시 */
    const showFinalStep3Elements = () => {
        videoPlayerEl.style.zIndex = '10'; // 비디오는 뒤로
        uiStep3.style.display = 'grid'; // [!! 수정 !!] grid로 변경 (중앙 정렬)
        // 부분 배경 이미지 설정
        partialBackgroundEl.style.backgroundImage = `url(${finalStep3.backgroundImage})`;
    };

    /** [신규] Step 3의 새 비디오 재생 */
    const playFinalVideo2 = async () => {
      if (isVideoPlaying) return; 
      let hasEnded = false; 
      
      dialogueCardEl.style.display = 'none'; // 대화창 2 숨김
      videoPlayerEl.style.display = 'block';
      videoPlayerEl.style.zIndex = '100'; // 맨 앞으로
      videoPlayerEl.src = finalStep3.video;
      
      const onEnd = () => {
        if (hasEnded) return;
        hasEnded = true;
        isVideoPlaying = false; 
        videoPlayerEl.onended = null;
        videoPlayerEl.onerror = null;
        videoPlayerEl.style.zIndex = '10'; // 비디오를 맨 뒤로
      };
      
      videoPlayerEl.onended = onEnd;
      videoPlayerEl.onerror = onEnd;
      videoPlayerEl.muted = false;
      videoPlayerEl.autoplay = true;
      videoPlayerEl.playsInline = true;
      
      videoPlayerEl.play().then(() => {
          isVideoPlaying = true;
          // [!! 2. 수정 !!] 비디오 재생 *시작* 2초 후에 UI 표시
          setTimeout(() => {
            showFinalStep3Elements(); 
          }, 2000); // 2초 (2000ms)
      }).catch(err => {
          console.warn(`Ending video 2 play() promise failed:`, err);
          onEnd();
      });
    };

    /** (기존) 두 번째 대화창 표시 */
    const showFinalDialogue2 = () => {
      el.style.backgroundImage = `url(${finalStep2.image})`;
      dialogueTextEl.innerHTML = finalStep2.dialogue;
      leftBtn.querySelector('span').textContent = finalStep2.leftText;
      rightBtn.querySelector('span').textContent = finalStep2.rightText;
      
      leftBtn.onclick = playFinalVideo2;
      rightBtn.onclick = playFinalVideo2;
    };
    
    /** (기존) 첫 번째 대화창 표시 */
    const showFinalDialogue1 = () => {
      videoPlayerEl.style.display = 'none'; // 비디오 숨김
      el.style.backgroundImage = `url(${finalStep1.image})`;
      dialogueTextEl.innerHTML = finalStep1.dialogue;
      leftBtn.querySelector('span').textContent = finalStep1.leftText;
      rightBtn.querySelector('span').textContent = finalStep1.rightText;
      leftBtn.onclick = showFinalDialogue2;
      rightBtn.onclick = showFinalDialogue2;
      dialogueCardEl.style.display = 'block'; // 대화창 보임
    };
    
    /** (기존) 비디오를 1개만 재생하는 함수 */
    const playIntroVideo = async () => {
      if (isVideoPlaying) return; 
      let hasEnded = false; 
      
      videoPlayerEl.style.display = 'block';
      videoPlayerEl.style.zIndex = '100'; // 맨 앞으로
      videoPlayerEl.src = introVideoPath;
      
      const onEnd = () => {
        if (hasEnded) return;
        hasEnded = true;
        isVideoPlaying = false; 
        videoPlayerEl.onended = null;
        videoPlayerEl.onerror = null;
        
        showFinalDialogue1(); 
      };
      
      videoPlayerEl.onended = onEnd;
      videoPlayerEl.onerror = onEnd;
      videoPlayerEl.muted = false;
      videoPlayerEl.autoplay = true;
      videoPlayerEl.playsInline = true;
      
      videoPlayerEl.play().then(() => {
          isVideoPlaying = true;
      }).catch(err => {
          console.warn(`Ending video play() promise failed:`, err);
          onEnd();
      });
    };
    
    // --- 5. 초기화 및 이벤트 바인딩 ---
    
    // (기존) 대화창 1/2 호버
    leftBtn.addEventListener('mouseenter', () => dialogueCardEl.classList.add('hover-left'));
    leftBtn.addEventListener('mouseleave', () => dialogueCardEl.classList.remove('hover-left'));
    rightBtn.addEventListener('mouseenter', () => dialogueCardEl.classList.add('hover-right'));
    rightBtn.addEventListener('mouseleave', () => dialogueCardEl.classList.remove('hover-right'));

    // Step 3의 이미지 버튼 클릭 이벤트
    btnGoTo3D.onclick = () => ScreenManager.go('upload3d');
    
    // [!! 시작 !!] 마운트 즉시 인트로 비디오 재생
    playIntroVideo();
  }
};