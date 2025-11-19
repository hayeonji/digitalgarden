import { ScreenManager, state } from '../app.js';

export default {
  async mount(root){
    const el = document.createElement('section');
    el.className = 'landing-wrap';
    el.innerHTML = `
      <div class="landing-card" id="landingCard">
        <!-- 로고 -->
        <img class="land-logo" src="./assets/ui/landing/logo.png" alt="logo" />

        <!-- 이름 박스 (hover/focus 시에도 이미지 유지) -->
        <div class="namebox" id="namebox">
          <input id="nick" type="text" placeholder="닉네임을 적어주세요!" autocomplete="off" />
          <button class="box-btn" id="go" aria-label="접속하기"></button>
        </div>

        <!-- hover/focus 되면 나타나는 영역 -->

      </div>
    `;
    root.appendChild(el);

    const card   = el.querySelector('#landingCard');
    const box    = el.querySelector('#namebox');
    const input  = el.querySelector('#nick');
    const extra  = el.querySelector('#landExtra'); // (CSS 토글은 card에 class로)

    // --- 표시/숨김 로직 ---
    const showExtra = () => card.classList.add('active');
    const hideExtra = () => card.classList.remove('active');

    // 마우스 진입/이탈 시
    box.addEventListener('mouseenter', showExtra);
    box.addEventListener('mouseleave', () => {
      if (document.activeElement !== input) hideExtra();
    });

    // 포커스 획득/해제 시 (키보드 접근성)
    input.addEventListener('focus', showExtra);
    input.addEventListener('blur', hideExtra);

    // 엔터로도 시작
    input.addEventListener('keydown', (e)=>{
      if(e.key === 'Enter'){ el.querySelector('#go').click(); }
    });

    // 버튼 클릭 → 다음 화면
    el.querySelector('#go').onclick = () => {
      const v = input.value.trim();
      state.nickname = v || '게스트';
      ScreenManager.go('opening');
    };
  }
};
