// app.js
import landing from './screens/landing.js';
import loading from './screens/loading.js';
import opening from './screens/opening.js';
import game1 from './screens/game1.js';
import game2 from './screens/game2.js';
import game3 from './screens/game3.js';
import ending from './screens/ending.js';
import upload3d from './screens/upload3d.js';

const appRoot = document.getElementById('app');
const crumb = document.getElementById('crumb');

export const state = {
  nickname: '',
  progress: { g1:false, g2:false, g3:false },
  // 필요시 더 추가
};

const registry = new Map();  // id -> screen module
let current = null;          // { id, api }

export const ScreenManager = {
  register(id, api){ registry.set(id, api); },
  async go(id, payload){
    if (!registry.has(id)) throw new Error(`Screen "${id}" not found`);
    
    // [!! 수정 !!] 이미 현재 화면이면 아무것도 안 함 (뒤로가기 무한 루프 방지)
    if (current?.id === id) return; 

    // 현재 화면이 떠나도 되는지 체크
    if (current?.api?.canLeave && !current.api.canLeave()) return;

    // unmount 이전 화면
    if (current?.api?.unmount) await current.api.unmount();

    // mount 새 화면
    const api = registry.get(id);
    appRoot.innerHTML = ''; // 비우고
    
    // crumb.textContent = id; (주석 처리됨)
    
    await api.mount(appRoot, { state, go: this.go.bind(this), payload });

    current = { id, api };
    
    // [!! 수정 !!] URL이 이미 바뀐 상태라면(뒤로가기) 굳이 또 바꾸지 않음
    if (location.hash !== '#' + id) {
      location.hash = '#' + id;
    }
  }
};

// --- 화면 등록
ScreenManager.register('landing', landing);
ScreenManager.register('opening', opening);
ScreenManager.register('loading', loading);
ScreenManager.register('game1', game1);
ScreenManager.register('game2', game2);
ScreenManager.register('game3', game3);
ScreenManager.register('ending', ending);
ScreenManager.register('upload3d', upload3d);

// [!! 1. 신규 !!] --- 해시 변경 감지 ---
// (뒤로가기/앞으로가기 버튼 감지)
window.addEventListener('hashchange', () => {
  const id = location.hash?.slice(1) || 'landing';
  ScreenManager.go(id);
});

// --- 해시로 진입(새로고침 안전)
const first = location.hash?.slice(1) || 'landing';
ScreenManager.go(first);