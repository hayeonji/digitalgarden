import { ScreenManager, state } from '../app.js';

// (fakeProgress 함수는 삭제됨)

export default {
  async mount(root){
    const el = document.createElement('section');
    el.className = 'loading-wrap'; 
    
    const nickname = state.nickname || '방문자';

    el.innerHTML = `
      <video 
        class="loading-bg-video" 
        autoplay 
        muted 
        /* [!! loop가 없는지 확인 !!] */
        playsinline
        src="./assets/ui/loading/background.mp4" 
      ></video> 
      <div class="loading-content-wrap">
        <div class="loading-text" id="loading-text-main"> ${nickname}, 디지털 정원 접속 중...
        </div>
        <img 
          class="loading-gif" 
          src="./assets/ui/loading/loading.gif" 
          alt="Loading..." 
        /> 
      </div>
      <div class="loading-ui-corner-wrap">
        <img 
          class="loading-ui-image" 
          src="./assets/ui/loading/ui.png" 
          alt="UI Element"
        /> 
        <p class="loading-ui-text">
          여기는 ${nickname}의 세계와 디지털 정원을 잇는 길입니다.<br>
          모든 데이터가 이곳을 거쳐 정원으로 이동합니다. 곧 문이 열립니다.
        </p>
      </div>
      
      
    `;
    
    root.appendChild(el);

    // [!! 2. 수정 !!] 비디오 이벤트 리스너 (더욱 강력하게)
    const videoEl = el.querySelector('.loading-bg-video');
    let hasGoneToGame1 = false; // [!! 신규 !!] 중복 실행 방지

    const goToGame1 = () => {
      // 이미 한 번이라도 이동했다면, 다시 실행하지 않음
      if (hasGoneToGame1) return;
      hasGoneToGame1 = true; // 이동 플래그 설정
      
      console.log("Video finished or failed. Going to game1...");
      ScreenManager.go('game1');
    };

    // 1. 비디오가 성공적으로 재생되고 "끝났을 때"
    videoEl.addEventListener('ended', goToGame1);
    
    // 2. 비디오 파일을 "찾지 못했을 때" (예: 404 오류)
    videoEl.addEventListener('error', (e) => {
      console.error("Video loading error (e.g., 404):", e);
      goToGame1();
    });
    
    // 3. "자동 재생"을 시도
    videoEl.play().catch(err => {
      // 4. 자동 재생이 "차단되었을 때" (예: 사용자가 클릭 안 함)
      console.warn("Loading video autoplay was blocked:", err);
      
      // 자동 재생이 실패했으므로, 사용자에게 클릭을 유도
      el.querySelector('#loading-text-main').textContent = "클릭하여 정원으로 입장";
      
      // 화면 아무 곳이나 클릭하면 바로 이동
      el.addEventListener('click', goToGame1);
    });
  }
};