import { ScreenManager, state } from '../app.js';

export default {
  async mount(root) {
    // --- 1. 상태 정의 ---
    
    // 1-1. (수정) 단계별 데이터를 하나의 배열로 통합
    const steps = [
      {
        dialogue: `${state.nickname || '방문자'}님, 반가워요. 여기는 ${state.nickname || '방문자'}님 사이트 어딘가에 숨겨진 디지털 정원로 이동하는 통로에요. 그리고 저는 그 곳을 지킴이랍니다.`,
        background: './assets/ui/opening/bg1.png',
        leftText: '안녕하세요!',
        rightText: '반가워요!'
      },
      {
        dialogue: '요즘 전자기기를 많이 쓰다 보니, 디지털 탄소가 쌓여서 정원이 서서히 메말라 가고 있어요.',
        background: './assets/ui/opening/bg2.png',
        leftText: '이런!', // <- 1번 단계 버튼 텍스트
        rightText: '그렇군요.' // <- 1번 단계 버튼 텍스트
      },
      {
        dialogue: `정원이 다시 살아나려면, ${state.nickname || '방문자'}의 도움이 꼭 필요해요. 혹시, 도와주실 수 있을까요?`,
        background: './assets/ui/opening/bg3.png',
        leftText: '네!', // <- 2번 단계 버튼 텍스트
        rightText: '좋아요!' // <- 2번 단계 버튼 텍스트
      },
      {
        dialogue: `감사합니다, ${state.nickname || '방문자'}님. 그럼 정원에 있는 저희 집 쪽으로 이동해볼게요.`,
        background: './assets/ui/opening/bg4.png',
        leftText: '고고링', // <- 3번 단계 버튼 텍스트
        rightText: '넵넵' // <- 3번 단계 버튼 텍스트
      }
    ];
    
    // 1-2. [!! 삭제 !!] videoPath 상수 삭제됨
    
    // 1-3. 현재 단계
    let currentStep = 0;

    // --- 2. UI 구조 생성 ---
    const el = document.createElement('section');
    el.className = 'opening-wrap';
    
    el.innerHTML = `
      <div class="opening-card" id="opening-card">
        <div class="opening-text">
          <p id="dialogue-text"></p>
        </div>
        <div class="opening-options">
          <div class="option-zone" id="opt-left"><span></span></div>
          <div class="option-zone" id="opt-right"><span></span></div>
        </div>
      </div>
      `;

    root.appendChild(el);

    // --- 3. DOM 요소 참조 ---
    const wrapEl = el; // .opening-wrap
    const cardEl = el.querySelector('#opening-card');
    const dialogueTextEl = el.querySelector('#dialogue-text');
    const leftBtn = el.querySelector('#opt-left');
    const rightBtn = el.querySelector('#opt-right');

    // --- 4. 핵심 기능 함수 ---

    // [!! 삭제 !!] playIntroVideo 함수 전체 삭제됨

    /** (수정) 지정된 단계의 대화, 배경, 버튼 텍스트를 표시하는 함수 */
    const showStep = (stepIndex) => {
      // [!! 수정 !!] 4단계 이상이면 비디오 대신 game1로 바로 이동
      if (stepIndex >= steps.length) {
        ScreenManager.go('loading');
        return;
      }

      // 1. 현재 단계에 맞는 데이터 가져오기
      const current = steps[stepIndex];

      // 2. 전체 배경 이미지 변경
      wrapEl.style.backgroundImage = `url(${current.background})`;

      // 3. 대화 텍스트 변경
      dialogueTextEl.innerHTML = current.dialogue;
      
      // 4. (추가) 버튼 텍스트 변경
      leftBtn.querySelector('span').textContent = current.leftText;
      rightBtn.querySelector('span').textContent = current.rightText;
    };

    /** 버튼 클릭을 처리하는 공통 함수 */
    const handleOptionClick = (event) => {
      currentStep++;
      showStep(currentStep);
    };

    // --- 5. 초기화 ---
    leftBtn.onclick = handleOptionClick;
    rightBtn.onclick = handleOptionClick;

    // 0번 단계(첫 번째) 대화와 배경, 버튼 텍스트를 즉시 표시
    showStep(currentStep);
  }
};