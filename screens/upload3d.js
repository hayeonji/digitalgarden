// screens/upload3d.js
// [!! 수정 !!] 404 오류 해결.
// 'utils/threeSetup.js' 임포트를 제거하고,
// ensureThree/initThree 함수를 파일 상단에 다시 포함시켰습니다.

import { ScreenManager, state } from '../app.js';
// [!! 수정 !!]
// import { ensureThree, initThree } from '../utils/threeSetup.js'; (삭제)

// [!! 1. 수정 !!]
// ensureThree, initThree 함수를 파일 상단에 다시 정의
// (이전 84, 86번 user turn의 코드를 기반으로 함)

let threeCtx = null;
let dracoLoader = null;

async function ensureThree(){
  const THREE = await import('three');
  const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');
  return { THREE, OrbitControls };
}

function initThree(container, lib){
  const { THREE, OrbitControls } = lib;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    60,
    container.clientWidth / container.clientHeight,
    0.01,
    1000
  );
  camera.position.set(0, 1.2, 4);
  
  // [!! 조명 적당하게 조정 !!]
  scene.add(new THREE.AmbientLight(0xffffff, 1.5));
  scene.add(new THREE.HemisphereLight(0xffffff, 0x999999, 1.8));
  
  const dir1 = new THREE.DirectionalLight(0xffffff, 2.2);
  dir1.position.set(5, 5, 5);
  scene.add(dir1);
  
  const dir2 = new THREE.DirectionalLight(0xffffff, 1.8);
  dir2.position.set(-5, 3, -5);
  scene.add(dir2);
  
  const dir3 = new THREE.DirectionalLight(0xffffff, 1.5);
  dir3.position.set(0, 5, 10);
  scene.add(dir3);
  
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.enablePan = false;
  
  const onResize = () => {
    const w = container.clientWidth, h = container.clientHeight || 1;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  window.addEventListener('resize', onResize);
  
  let raf = 0;
  const tick = () => {
    controls.update();
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  };
  tick();
  
  let current = null;
  
  function fitCameraToObject(obj){
    const { THREE } = lib;
    obj.updateMatrixWorld(true);
    let box = new THREE.Box3().setFromObject(obj);
    
    if (box.isEmpty()) {
      const center = new THREE.Vector3();
      let radius = 1;
      obj.traverse((child)=>{
        if (child.isMesh && child.geometry) {
          child.geometry.computeBoundingSphere();
          if (child.geometry.boundingSphere) {
            center.copy(child.geometry.boundingSphere.center);
            radius = Math.max(radius, child.geometry.boundingSphere.radius);
          }
        }
      });
      box = new THREE.Box3().setFromCenterAndSize(center, new THREE.Vector3(radius*2, radius*2, radius*2));
    }
    
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    controls.target.copy(center);
    
    const maxDim = Math.max(size.x, size.y, size.z);
    const dist = Math.max(2, maxDim * 1.6);
    camera.position.copy(center).add(new THREE.Vector3(dist, dist * 0.6, dist));
    camera.near = Math.max(0.01, dist / 100);
    camera.far  = Math.max(1000, dist * 100);
    camera.updateProjectionMatrix();
    camera.lookAt(center);
  }

  return {
    THREE: lib.THREE,
    renderer, scene, camera, controls,
    clear(){ if (current) { scene.remove(current); current = null; } },
    setObject(obj){ this.clear(); current = obj; scene.add(current); fitCameraToObject(current); },
    dispose(){
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      container.innerHTML = '';
    }
  };
}


// [!! 2. 수정 !!]
// 나머지 로직은 이전(89) 답변과 동일합니다.

// 모델별 데이터 구조화
const GLB_MODELS_DATA = [
  {
    model: './assets/models/flower1.glb',
    text: '반짝 반짝', // 상단 문구
    images: [ // 슬라이더용 이미지 2장
      './assets/images/flower1_img1.jpg', // !! 경로 수정 !!
      './assets/images/flower1_img2.jpg'  // !! 경로 수정 !!
    ]
  },
  {
    model: './assets/models/flower2.glb',
    text: '탄소 안녕 식물',
    images: [
      './assets/images/flower2_img1.jpg', // !! 경로 수정 !!
      './assets/images/flower2_img2.jpg'  // !! 경로 수정 !!
    ]
  },
  {
    model: './assets/models/flower3.glb',
    text: '이름 미정 식물',
    images: [
      './assets/images/flower3_img1.jpg', // !! 경로 수정 !!
      './assets/images/flower3_img2.jpg'  // !! 경로 수정 !!
    ]
  },
  {
    model: './assets/models/flower4.glb',
    text: '네 번째 식물',
    images: [
      './assets/images/flower4_img1.jpg', // !! 경로 수정 !!
      './assets/images/flower4_img2.jpg'  // !! 경로 수정 !!
    ]
  }
];

let currentSliderImages = []; // 현재 모델의 이미지 슬라이더
let currentSliderIndex = 0;

export default {
  async mount(root){
    const el = document.createElement('section');
    el.className = 'upload3d-wrap'; 
    
    // UI 레이아웃 (image_f42ae0.png 기반)
    el.innerHTML = `
      <div class="upload-top-text" id="model-text"></div>
      <div id="stage"></div>
      <div class="upload-bottom-left-ui">
        <img src="./assets/ui/upload3d/tip_box.png" alt="Tip Box" />
        <p>식물을 이리 저리 돌려보세요</p>
      </div>
      <div class="upload-bottom-right-ui">
        <div class="upload-button" id="btn-show-images"></div>
        <div class="upload-button" id="btn-go-landing"></div>
      </div>
      <div class="upload-image-slider" id="image-slider" style="display: none;">
        <div class="slider-close-btn" id="slider-close">X</div>
        <div class="slider-nav" id="slider-prev">&lt;</div>
        <img id="slider-image" src="" alt="Model Image" />
        <div class="slider-nav" id="slider-next">&gt;</div>
      </div>
    `;
    root.appendChild(el);

    const stage = el.querySelector('#stage');
    const modelTextEl = el.querySelector('#model-text');
    const imageSlider = el.querySelector('#image-slider');
    const sliderImageEl = el.querySelector('#slider-image');

    // 3D 환경 준비
    stage.innerHTML = '';
    const lib = await ensureThree();
    const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
    const { DRACOLoader } = await import('three/examples/jsm/loaders/DRACOLoader.js');

    if (!threeCtx) {
      threeCtx = initThree(stage, lib);
    } else {
      stage.appendChild(threeCtx.renderer.domElement);
      const w = stage.clientWidth, h = stage.clientHeight || 1;
      threeCtx.camera.aspect = w / h;
      threeCtx.camera.updateProjectionMatrix();
      threeCtx.renderer.setSize(w, h);
    }
    threeCtx.clear();

    // 랜덤 모델 선택
    const randomModelData = GLB_MODELS_DATA[Math.floor(Math.random() * GLB_MODELS_DATA.length)];
    const url = randomModelData.model;
    currentSliderImages = randomModelData.images;
    currentSliderIndex = 0;

    // DRACO 설정
    if (!dracoLoader) {
      dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
    }
    
    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    // 모델 로드
    loader.load(
      url,
      (gltf) => {
        const model = gltf.scene;
        model.scale.setScalar(10); 
        
        // [!! 재질 처리 (밝기 조정 제거) !!]
        model.traverse((child) => {
          if (child.isMesh) {
            if (child.geometry && !child.geometry.attributes.normal) {
              child.geometry.computeVertexNormals();
            }
            if (child.material) {
              const mat = child.material;
              mat.side = threeCtx.THREE.DoubleSide;
              
              if (mat.map) { 
                mat.map.colorSpace = threeCtx.THREE.SRGBColorSpace; 
              }
              if (mat.emissiveMap) { 
                mat.emissiveMap.colorSpace = threeCtx.THREE.SRGBColorSpace; 
              }
            }
          }
        });
        
        threeCtx.setObject(model);
        modelTextEl.textContent = randomModelData.text;
      },
      (xhr) => { /* 로딩 중... */ },
      (err) => {
        console.error('GLB load error:', err);
        stage.textContent = 'GLB 로드 오류';
      }
    );
    
    // 버튼 이벤트 리스너
    
    // 우측하단 버튼 1: 이미지 슬라이더 켜기
    el.querySelector('#btn-show-images').addEventListener('click', ()=>{
      if (currentSliderImages.length === 0) return;
      if (threeCtx?.renderer?.domElement?.parentElement === stage) {
        stage.removeChild(threeCtx.renderer.domElement);
      }
      currentSliderIndex = 0;
      sliderImageEl.src = currentSliderImages[currentSliderIndex];
      imageSlider.style.display = 'grid';
    });

    // 우측하단 버튼 2: 처음으로 (Landing)
    el.querySelector('#btn-go-landing').addEventListener('click', () => ScreenManager.go('landing'));

    // 이미지 슬라이더 내부 버튼
    
    // 슬라이더 닫기
    el.querySelector('#slider-close').addEventListener('click', () => {
      imageSlider.style.display = 'none';
      if (!stage.querySelector('canvas')) {
        stage.appendChild(threeCtx.renderer.domElement);
      }
    });

    // 슬라이더 이전
    el.querySelector('#slider-prev').addEventListener('click', () => {
      currentSliderIndex--;
      if (currentSliderIndex < 0) {
        currentSliderIndex = currentSliderImages.length - 1;
      }
      sliderImageEl.src = currentSliderImages[currentSliderIndex];
    });
    
    // 슬라이더 다음
    el.querySelector('#slider-next').addEventListener('click', () => {
      currentSliderIndex++;
      if (currentSliderIndex >= currentSliderImages.length) {
        currentSliderIndex = 0;
      }
      sliderImageEl.src = currentSliderImages[currentSliderIndex];
    });
  },

  async unmount(){
    if (threeCtx?.dispose) threeCtx.dispose();
    threeCtx = null;
    
    if (dracoLoader) {
      dracoLoader.dispose();
      dracoLoader = null;
    }
  }
};