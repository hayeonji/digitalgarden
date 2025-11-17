import { ScreenManager, state } from '../app.js';

export default {
  async mount(root) {
    // --- 1. 상태 정의 ---
    
    // 1-1. Game 3 초기 대화 (4단계)
    const initialDialogueSteps = [
      { dialogue: '혹시 OTT에서 영화나 드라마 자주 보시나요?', leftText: '당연하지~', rightText: '아니...' },
      { dialogue: 'OTT는 스트리밍할수록 서버가 계속 돌아가 디지털 탄소가 쌓이지만, 한 번 다운로드하면 이후에는 서버를 거치지 않아 탄소가 줄어들어요.', leftText: '그렇구나', rightText: '신기하다' },
      { dialogue: '저기 있는 조용한 친구가 바로 그 일을 해요. 쳇바퀴를 굴리면 파일이 다운로드되고, 그만큼 디지털 탄소가 줄어 정원이 깨끗해집니다.', leftText: '귀여워!', rightText: '멋있다...' },
      { dialogue: '하지만 지금은 파일이 너무 많아 친구가 움직이지 못하고 있어요. 친구가 쳇바퀴를 돌릴 수 있도록, 파일을 쳇바퀴 끝에 걸어 주세요!', leftText: '알겠어!', rightText: '어떻게?' }
    ];
    let currentDialogueStep = 0;

    // 1-2. 드래그 게임 단계 데이터 (총 3번 반복)
    const dragGameSteps = [
      {
        bgImage: './assets/bg/game3/image/opening.png',
        dragItem: './assets/bg/game3/image/down1.png',
        video: './assets/bg/game3/video/zosu1.mp4',
        targetTop: '29%', targetLeft: '45%', targetWidth: '20%', targetHeight: '7%'
      },
      {
        bgImage: './assets/bg/game3/image/finish2.png',
        dragItem: './assets/bg/game3/image/down2.png',
        video: './assets/bg/game3/video/zosu2.mp4',
        targetTop: '49%', targetLeft: '30%', targetWidth: '30%', targetHeight: '7%'
      },
      {
        bgImage: './assets/bg/game3/image/finish3.png',
        dragItem: './assets/bg/game3/image/down3.png',
        video: './assets/bg/game3/video/zosu3.mp4',
        targetTop: '69%', targetLeft: '15%', targetWidth: '40%', targetHeight: '7%'
      }
    ];
    let currentDragGameStep = 0;
    let isDragging = false;
    let isVideoPlaying = false; // [!! 신규 !!] 비디오 중복 재생 방지

    // 1-3. 최종 비디오 (모든 드래그 완료 후)
    const finalVideoPath = './assets/ui/game3/final_video.mp4';

    // 1-4. Game 3 시작 시 인트로 비디오
    const introVideoPath = './assets/bg/game3/video/game2to3.mp4';

    // --- 2. UI 구조 생성 ---
    const el = document.createElement('section');
    el.className = 'game3-wrap';
    
    el.innerHTML = `
      <video id="game3-video-player" class="game3-video-player"></video>
      <div class="opening-card" id="game3-dialogue-card" style="display: none;">
        <div class="opening-text"><p id="dialogue-text"></p></div>
        <div class="opening-options">
          <div class="option-zone" id="opt-left"><span></span></div>
          <div class="option-zone" id="opt-right"><span></span></div>
        </div>
      </div>
      <div id="drag-game-container" style="display: none;">
        <img id="draggable-item" src="" alt="Draggable Item" />
        <div id="drag-target-area" class="drag-target-area"></div>
      </div>
    `;

    root.appendChild(el);

    // --- 3. DOM 요소 참조 ---
    const dialogueCardEl = el.querySelector('#game3-dialogue-card'), dialogueTextEl = el.querySelector('#dialogue-text'), leftBtn = el.querySelector('#opt-left'), rightBtn = el.querySelector('#opt-right');
    const videoPlayerEl = el.querySelector('#game3-video-player');
    const dragGameContainerEl = el.querySelector('#drag-game-container'), draggableItemEl = el.querySelector('#draggable-item'), dragTargetAreaEl = el.querySelector('#drag-target-area');

    // --- 4. 핵심 기능 함수 ---

    const setBackground = (imagePath) => {
      el.style.backgroundImage = `url(${imagePath})`;
      el.style.transition = 'background-image 0.5s ease-in-out';
    };

    const setupDragGame = () => {
      dialogueCardEl.style.display = 'none';
      dragGameContainerEl.style.display = 'block';
      const currentStepData = dragGameSteps[currentDragGameStep];
      if (currentDragGameStep > 0) {
        setBackground(currentStepData.bgImage);
      }
      draggableItemEl.src = currentStepData.dragItem;
      draggableItemEl.style.display = 'block';
      draggableItemEl.classList.remove('active');
      dragTargetAreaEl.style.top = currentStepData.targetTop;
      dragTargetAreaEl.style.left = currentStepData.targetLeft;
      dragTargetAreaEl.style.width = currentStepData.targetWidth;
      dragTargetAreaEl.style.height = currentStepData.targetHeight;
      dragTargetAreaEl.classList.add('active');
    };

    // (playDragGameVideo, playFinalVideo - 이중 방지 로직 적용)
    const playDragGameVideo = async () => {
      if (isVideoPlaying) return;
      let hasThisVideoEnded = false; 
      dragGameContainerEl.style.display = 'none';
      videoPlayerEl.style.display = 'block';
      videoPlayerEl.style.zIndex = '100';
      videoPlayerEl.src = dragGameSteps[currentDragGameStep].video;
      videoPlayerEl.onended = null; 
      videoPlayerEl.onerror = null;
      const onVideoEnd = () => {
        if (hasThisVideoEnded) return; 
        hasThisVideoEnded = true;
        videoPlayerEl.onended = null; 
        videoPlayerEl.onerror = null;
        isVideoPlaying = false; 
        videoPlayerEl.style.zIndex = '10';
        currentDragGameStep++; 
        if (currentDragGameStep >= dragGameSteps.length) {
          playFinalVideo();
        } else {
          setupDragGame();
        }
      };
      videoPlayerEl.onended = onVideoEnd;
      videoPlayerEl.onerror = onVideoEnd;
      videoPlayerEl.muted = false;
      videoPlayerEl.autoplay = true;
      videoPlayerEl.playsInline = true;
      videoPlayerEl.play().then(() => {
        isVideoPlaying = true;
      }).catch(err => {
        console.warn("Drag video play failed:", err);
        onVideoEnd(); 
      });
    };

    const playFinalVideo = async () => {
      if (isVideoPlaying) return; 
      let hasEnded = false;
      dialogueCardEl.style.display = 'none';
      videoPlayerEl.style.display = 'block';
      videoPlayerEl.style.zIndex = '100';
      videoPlayerEl.src = finalVideoPath;
      const onEnd = () => {
        if (hasEnded) return;
        hasEnded = true;
        isVideoPlaying = false; 
        videoPlayerEl.onended = null;
        videoPlayerEl.onerror = null;
        state.progress.g3 = true;
        ScreenManager.go('ending');
      };
      videoPlayerEl.onended = onEnd;
      videoPlayerEl.onerror = onEnd;
      videoPlayerEl.muted = false;
      videoPlayerEl.autoplay = true;
      videoPlayerEl.playsInline = true;
      videoPlayerEl.play().then(() => {
        isVideoPlaying = true;
      }).catch(err => {
        console.warn("Final video play() promise failed:", err);
        onEnd();
      });
    };

    // [!! 수정 !!] playIntroVideo (muted = true로 변경)
    const playIntroVideo = async () => {
      if (isVideoPlaying) return; 
      let hasEnded = false; 
      
      videoPlayerEl.style.display = 'block';
      videoPlayerEl.style.zIndex = '100';
      videoPlayerEl.src = introVideoPath;
      
      const onEnd = () => {
        if (hasEnded) return;
        hasEnded = true;
        isVideoPlaying = false; 
        videoPlayerEl.onended = null;
        videoPlayerEl.onerror = null;
        
        videoPlayerEl.style.zIndex = '10'; // 비디오를 맨 뒤로
        
        setBackground(dragGameSteps[0].bgImage); 
        dialogueCardEl.style.display = 'block';
        showDialogueStep(0);
      };

      videoPlayerEl.onended = onEnd;
      videoPlayerEl.onerror = onEnd;
      
      // [!! 수정 !!] 소리 끄고 재생
      videoPlayerEl.muted = true; 
      videoPlayerEl.autoplay = true;
      videoPlayerEl.playsInline = true;

      videoPlayerEl.play().then(() => {
        isVideoPlaying = true;
      }).catch(err => {
        console.warn("Intro video play() promise failed:", err);
        onEnd();
      });
    };

    // (showDialogueStep, handleDialogueOptionClick 함수는 동일)
    const showDialogueStep = (stepIndex) => {
      if (stepIndex >= initialDialogueSteps.length) {
        setupDragGame();
        return;
      }
      const current = initialDialogueSteps[stepIndex];
      dialogueTextEl.innerHTML = current.dialogue;
      leftBtn.querySelector('span').textContent = current.leftText;
      rightBtn.querySelector('span').textContent = current.rightText;
    };
    const handleDialogueOptionClick = () => {
      currentDialogueStep++;
      showDialogueStep(currentDialogueStep);
    };

    // --- 5. 드래그 앤 드롭 이벤트 리스너 ---
    
    // (onMouseDown, onMouseMove, onMouseUp 함수는 동일)
    const onMouseDown = (e) => {
      if (e.target !== draggableItemEl || isVideoPlaying) return;
      e.preventDefault();
      isDragging = true;
      draggableItemEl.classList.add('dragging');
      draggableItemEl.style.position = 'fixed';
      draggableItemEl.style.left = `${e.clientX}px`;
      draggableItemEl.style.top = `${e.clientY}px`;
      draggableItemEl.style.transform = 'translate(-50%, -50%)'; 
      draggableItemEl.style.bottom = 'unset';
    };
    const onMouseMove = (e) => {
      if (!isDragging) return;
      draggableItemEl.style.left = `${e.clientX}px`;
      draggableItemEl.style.top = `${e.clientY}px`;
    };
    const onMouseUp = (e) => {
      if (!isDragging || isVideoPlaying) return;
      isDragging = false;
      draggableItemEl.classList.remove('dragging');
      draggableItemEl.style.display = 'none';
      const targetRect = dragTargetAreaEl.getBoundingClientRect();
      if (
        e.clientX >= targetRect.left &&
        e.clientX <= targetRect.right &&
        e.clientY >= targetRect.top &&
        e.clientY <= targetRect.bottom
      ) {
        dragTargetAreaEl.classList.remove('active');
        playDragGameVideo();
      } else {
        draggableItemEl.style.display = 'block';
        draggableItemEl.style.position = 'absolute';
        draggableItemEl.style.left = '50%';
        draggableItemEl.style.bottom = '10%';
        draggableItemEl.style.top = 'unset';
        draggableItemEl.style.transform = 'translateX(-50%)';
      }
    };
    
    // --- 6. 초기화 및 이벤트 바인딩 ---
    
    leftBtn.addEventListener('mouseenter', () => dialogueCardEl.classList.add('hover-left'));
    leftBtn.addEventListener('mouseleave', () => dialogueCardEl.classList.remove('hover-left'));
    rightBtn.addEventListener('mouseenter', () => dialogueCardEl.classList.add('hover-right'));
    rightBtn.addEventListener('mouseleave', () => dialogueCardEl.classList.remove('hover-right'));
    leftBtn.onclick = handleDialogueOptionClick;
    rightBtn.onclick = handleDialogueOptionClick;

    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('mouseup', onMouseUp);

    playIntroVideo();
  }
};