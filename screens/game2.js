import { ScreenManager, state } from '../app.js';

export default {
  async mount(root) {
    // --- 1. 상태 정의 ---
    
    // 1-1. 대화 2단계
    const dialogueSteps = [
      { dialogue: '이런, 제가 잠시 자리를 비운 사이에 집 안이 온갖 메일과 쿠키로 가득 차버렸어요.', leftText: '헉 어떡해?', rightText: '정말 더럽다' },
      { dialogue: '제 정리 수칙에 따라, 메일과 쿠키를 적절한 위치로 옮겨 정리해 주실 수 있을까요?', leftText: '알겠어!', rightText: '어떻게?' }
    ];
    let currentDialogueStep = 0;

    // 1-2. [!! 1. 수정 !!] 드래그 게임 6단계 (ID 기반, 타겟 공유)
    const dragSequence = [
      // (이해를 돕기 위해 ID를 직관적으로 바꿨습니다)
      // 1. 빨강 -> 빨강 서랍
      { id: 'red', video: './assets/bg/game2/video/click1.mp4', dragImage: './assets/bg/game2/image/mail.png',
        sourceId: 'source-red', targetId: 'target-red_drawer' },
      // 2. 분홍 -> 분홍 서랍
      { id: 'pink', video: './assets/bg/game2/video/click2.mp4', dragImage: './assets/bg/game2/image/mail.png',
        sourceId: 'source-pink', targetId: 'target-pink_drawer' },
      // 3. 파랑(바닥) -> 쓰레기통
      { id: 'mail1', video: './assets/bg/game2/video/click3.mp4', dragImage: './assets/bg/game2/image/trash_mail.png',
        sourceId: 'source-blue_floor', targetId: 'target-trashcan' },
      // 4. 파랑(상단) -> 쓰레기통 (!! 타겟 공유 !!)
      { id: 'mail2', video: './assets/bg/game2/video/click4.mp4', dragImage: './assets/bg/game2/image/trash_mail.png',
        sourceId: 'source-blue_top', targetId: 'target-trashcan' },
      // 5. 초록 -> 쿠키통
      { id: 'cookie1', video: './assets/bg/game2/video/click5.mp4', dragImage: './assets/bg/game2/image/cookie.png',
        sourceId: 'source-green', targetId: 'target-cookiejar' },
      // 6. 노랑 -> 쿠키통 (!! 타겟 공유 !!)
      { id: 'cookie2', video: './assets/bg/game2/video/click6.mp4', dragImage: './assets/bg/game2/image/cookie.png',
        sourceId: 'source-yellow', targetId: 'target-cookiejar' }
    ];
    let currentDragStep = 0;
    let isDragging = false;
    
    // 1-3. 최종 단계들 (좌/우 텍스트 분리)
    const finalStep1 = {
      dialogue: '집이 정말 깨끗해져서 기분이 아주 좋아요. 정원도 무럭무럭 자라고 있어요.',
      leftText: '계속하기',
      rightText: '잘했다!',
      video: './assets/bg/game2/video/game2flower.mp4',
      image: './assets/bg/game2/image/end.png'
    };
    const finalStep2 = {
      dialogue: '정원의 다음 장소로 이동합니다. (대화창 2)',
      leftText: '이동하기',
      rightText: '이동하기'
    };

    // 1-4. 비디오 재생 중복 방지 플래그
    let isVideoPlaying = false; 

    // --- 2. UI 구조 생성 ---
    const el = document.createElement('section');
    el.className = 'game2-wrap';
    
    el.innerHTML = `
      <video id="game2-video-player" class="game2-video-player" style="display: none;"></video>
      <div class="note-container" id="note-container">
        <img src="./assets/ui/game2/letter.png" id="folded-note" alt="닫힌 쪽지" />
        <div id="unfolded-note-area" style="display: none;">
          <img src="./assets/ui/game2/letter_but.png" id="note-close-btn" alt="닫기" />
        </div>
      </div>
      <div class="opening-card" id="game2-dialogue-card">
        <div class="opening-text"><p id="dialogue-text"></p></div>
        <div class="opening-options">
          <div class="option-zone" id="opt-left"><span></span></div>
          <div class="option-zone" id="opt-right"><span></span></div>
        </div>
      </div>
      
      <div id="drag-game-container" style="display: none;">
        <div class="drag-source" id="source-red"></div>
        <div class="drag-source" id="source-pink"></div>
        <div class="drag-source" id="source-blue_floor"></div>
        <div class="drag-source" id="source-blue_top"></div>
        <div class="drag-source" id="source-green"></div>
        <div class="drag-source" id="source-yellow"></div>

        <div class="drag-target" id="target-red_drawer"></div>
        <div class="drag-target" id="target-pink_drawer"></div>
        <div class="drag-target" id="target-trashcan"></div> <div class="drag-target" id="target-cookiejar"></div> </div>
      
      <img id="dragging-item" src="" alt="" style="display:none; pointer-events: none;" />
    `;

    root.appendChild(el);

    // --- 3. DOM 요소 참조 ---
    const dialogueCardEl = el.querySelector('#game2-dialogue-card'), dialogueTextEl = el.querySelector('#dialogue-text'), leftBtn = el.querySelector('#opt-left'), rightBtn = el.querySelector('#opt-right');
    const noteContainerEl = el.querySelector('#note-container'), foldedNoteEl = el.querySelector('#folded-note'), unfoldedNoteAreaEl = el.querySelector('#unfolded-note-area'), noteCloseBtnEl = el.querySelector('#note-close-btn');
    const dragGameContainerEl = el.querySelector('#drag-game-container'), draggingItemEl = el.querySelector('#dragging-item'), videoPlayerEl = el.querySelector('#game2-video-player');

    // --- 4. 핵심 기능 함수 ---
    const openNote = () => { foldedNoteEl.style.display = 'none'; unfoldedNoteAreaEl.style.display = 'block'; };
    const closeNote = () => { foldedNoteEl.style.display = 'block'; unfoldedNoteAreaEl.style.display = 'none'; };
    
    // [!! 3. 수정 !!] ID 기반으로 활성화
    const activateDragStep = (sourceId, targetId) => {
      el.querySelectorAll('.active').forEach(e => e.classList.remove('active'));
      el.querySelector(`#${sourceId}`).classList.add('active');
      el.querySelector(`#${targetId}`).classList.add('active');
    };
    
    // (대화창 로직은 이전과 동일)
    const showFinalDialogue2 = () => {
      dialogueCardEl.style.display = 'block';
      videoPlayerEl.style.zIndex = '10';
      dialogueTextEl.innerHTML = finalStep2.dialogue;
      leftBtn.querySelector('span').textContent = finalStep2.leftText;
      rightBtn.querySelector('span').textContent = finalStep2.rightText;
      leftBtn.onclick = () => ScreenManager.go('game3');
      rightBtn.onclick = () => ScreenManager.go('game3');
    };
    const playFinalVideo1 = async () => {
      if (isVideoPlaying) return; 
      let hasEnded = false; 
      dialogueCardEl.style.display = 'none';
      noteContainerEl.style.display = 'none'; // 쪽지 숨김
      videoPlayerEl.style.display = 'block';
      videoPlayerEl.style.zIndex = '100';
      videoPlayerEl.src = finalStep1.video;
      const onEnd = () => {
        if (hasEnded) return;
        hasEnded = true;
        isVideoPlaying = false; 
        videoPlayerEl.onended = null;
        videoPlayerEl.onerror = null;
        videoPlayerEl.style.zIndex = '10'; 
        showFinalDialogue2(); 
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
    const showFinalDialogue1 = () => {
      dragGameContainerEl.style.display = 'none';
      noteContainerEl.style.display = 'none'; // 쪽지 숨김
      videoPlayerEl.style.zIndex = '10';
      el.style.backgroundImage = `url(${finalStep1.image})`;
      dialogueCardEl.style.display = 'block'; 
      dialogueTextEl.innerHTML = finalStep1.dialogue;
      leftBtn.querySelector('span').textContent = finalStep1.leftText;
      rightBtn.querySelector('span').textContent = finalStep1.rightText;
      leftBtn.onclick = playFinalVideo1;
      rightBtn.onclick = playFinalVideo1;
    };

    // [!! 4. 수정 !!] ID 기반으로 다음 단계 활성화
    const playDragVideo = async () => {
      if (isVideoPlaying) return;
      let hasThisVideoEnded = false; 
      dragGameContainerEl.style.display = 'none';
      videoPlayerEl.style.display = 'block';
      videoPlayerEl.style.zIndex = '100';
      videoPlayerEl.src = dragSequence[currentDragStep].video;
      videoPlayerEl.onended = null; 
      videoPlayerEl.onerror = null;

      const onVideoEnd = () => {
        if (hasThisVideoEnded) return; 
        hasThisVideoEnded = true;
        videoPlayerEl.onended = null; 
        videoPlayerEl.onerror = null;
        isVideoPlaying = false; 
        videoPlayerEl.style.zIndex = '10'; 
        
        currentDragStep++; 

        if (currentDragStep >= dragSequence.length) {
          showFinalDialogue1(); 
        } else {
          dragGameContainerEl.style.display = 'block';
          // [!! 수정 !!] 다음 단계의 ID로 활성화
          const nextStep = dragSequence[currentDragStep];
          activateDragStep(nextStep.sourceId, nextStep.targetId);
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
        onEnd(); 
      });
    };

    // [!! 5. 수정 !!] ID 기반으로 첫 단계 활성화
    const initDragGame = () => {
      dialogueCardEl.style.display = 'none';
      // (쪽지는 숨기지 않음)
      dragGameContainerEl.style.display = 'block';
      const firstStep = dragSequence[0];
      activateDragStep(firstStep.sourceId, firstStep.targetId);
    };
    
    const showDialogueStep = (stepIndex) => {
      if (stepIndex >= dialogueSteps.length) { initDragGame(); return; }
      const current = dialogueSteps[stepIndex];
      dialogueTextEl.innerHTML = current.dialogue;
      leftBtn.querySelector('span').textContent = current.leftText;
      rightBtn.querySelector('span').textContent = current.rightText;
      if (stepIndex === 1) { 
        openNote();
      }
    };
    const handleDialogueOptionClick = () => { currentDialogueStep++; showDialogueStep(currentDialogueStep); };

    // --- 5. 드래그 앤 드롭 이벤트 리스너 (ID 기반으로 수정) ---
    const onMouseDown = (e) => {
      if (isVideoPlaying) return; 
      const sourceEl = e.target.closest('.drag-source');
      if (!sourceEl) return;
      
      // [!! 6. 수정 !!] 현재 단계의 sourceId와 일치하는지 확인
      const currentStepData = dragSequence[currentDragStep];
      if (sourceEl.id !== currentStepData.sourceId) return;

      e.preventDefault();
      isDragging = true;
      draggingItemEl.src = currentStepData.dragImage;
      draggingItemEl.style.display = 'block';
      draggingItemEl.style.left = `${e.clientX}px`;
      draggingItemEl.style.top = `${e.clientY}px`;
    };
    const onMouseMove = (e) => {
      if (!isDragging) return;
      draggingItemEl.style.left = `${e.clientX}px`;
      draggingItemEl.style.top = `${e.clientY}px`;
    };
    const onMouseUp = (e) => {
      if (!isDragging || isVideoPlaying) return;
      isDragging = false;
      draggingItemEl.style.display = 'none';
      
      // [!! 7. 수정 !!] 현재 단계의 targetId와 일치하는지 확인
      const currentStepData = dragSequence[currentDragStep];
      const dropTargetId = currentStepData.targetId;
      
      const elementUnderMouse = document.elementFromPoint(e.clientX, e.clientY);
      if (elementUnderMouse && elementUnderMouse.id === dropTargetId) {
        playDragVideo();
      }
    };
    
    // --- 6. 초기화 (이벤트 바인딩) ---
    leftBtn.onclick = handleDialogueOptionClick;
    rightBtn.onclick = handleDialogueOptionClick;
    noteCloseBtnEl.onclick = closeNote;
    foldedNoteEl.onclick = openNote;
    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('mouseup', onMouseUp);

    showDialogueStep(currentDialogueStep);
  }
};