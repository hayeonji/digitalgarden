// screens/upload3d.js
import { ScreenManager, state } from '../app.js';

let threeCtx = null; // 메인 GLB 씬
let boardCtx = null; // A6 보드 씬 (이미지 슬라이더 내)
let dracoLoader = null;

async function ensureThree(){
  const THREE = await import('three');
  const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');
  return { THREE, OrbitControls };
}

// initThree 함수: 메인 씬 초기화
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
  
  // 조명 설정
  const ambient = new THREE.AmbientLight(0xffffff, 1.5); 
  scene.add(ambient);
  const hemi = new THREE.HemisphereLight(0xffffff, 0x999999, 1.5);
  scene.add(hemi);
  const dir1 = new THREE.DirectionalLight(0xffffff, 1.5);
  dir1.position.set(5, 5, 5);
  scene.add(dir1);
  const dir2 = new THREE.DirectionalLight(0xffffff, 1.5);
  dir2.position.set(-5, 3, -5);
  scene.add(dir2);
  const dir3 = new THREE.DirectionalLight(0xffffff, 1.5);
  dir3.position.set(0, 5, 10);
  scene.add(dir3);
  
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.enablePan = true;

  
  const onResize = () => {
    const w = container.clientWidth, h = container.clientHeight || 1;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  window.addEventListener('resize', onResize);
  
  let raf = 0;
  let isRunning = true; 
  const tick = () => {
    if (!isRunning) return;
    controls.update();
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  };
  tick();
  
  // fitCameraToObject 함수
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
    camera.far  = Math.max(1000, dist * 100);
    camera.updateProjectionMatrix();
  }

  return {
    THREE: lib.THREE,
    renderer, scene, camera, controls,
    lights: { ambient, hemi, dir1, dir2, dir3 }, 
    
    clear(){ if (current) { scene.remove(current); current = null; } },
    setObject(obj){ this.clear(); current = obj; scene.add(current); fitCameraToObject(current); },
    stop: () => { isRunning = false; cancelAnimationFrame(raf); },
    start: () => { isRunning = true; tick(); },
    resize: onResize, // 외부에서 강제 리사이즈를 위해 함수 노출
    dispose(){
      isRunning = false; 
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      container.innerHTML = '';
    }
  };
}

// initBoardThree 함수: 3D 판 전용으로 초기화
function initBoardThree(container, lib){
    const { THREE, OrbitControls } = lib;

    // 렌더러 설정: 투명 배경을 위해 alpha: true 유지, 초기 크기는 컨테이너 크기 사용
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0); // 투명 배경

    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(
        60,
        container.clientWidth / container.clientHeight,
        0.01,
        1000
    );
    camera.position.set(0, 0, 4); 

    // 조명
    const ambient = new THREE.AmbientLight(0xffffff, 2.5);
    scene.add(ambient);
    const dir1 = new THREE.DirectionalLight(0xffffff, 2.5);
    dir1.position.set(5, 5, 5);
    scene.add(dir1);
    const dir2 = new THREE.DirectionalLight(0xffffff, 2.5);
    dir2.position.set(-5, 3, -5);
    scene.add(dir2);
    
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.enablePan = true;
    controls.minDistance = 1;
    controls.maxDistance = 10;
    controls.autoRotate = true; 
    controls.autoRotateSpeed = 1.0;
    
    const onResize = () => {
        const w = container.clientWidth, h = container.clientHeight || 1;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    let raf = 0;
    let isRunning = true;
    const tick = () => {
        if (!isRunning) return;
        controls.update();
        renderer.render(scene, camera);
        raf = requestAnimationFrame(tick);
    };
    tick();

    let current = null;

    return {
        THREE: lib.THREE,
        renderer, scene, camera, controls,
        clear(){ if (current) { scene.remove(current); current = null; } },
        setObject(obj){ 
            this.clear(); 
            current = obj; 
            scene.add(current); 
        },
        resize: onResize, // 외부에서 강제 리사이즈를 위해 함수 노출
        dispose(){
            isRunning = false;
            cancelAnimationFrame(raf);
            window.removeEventListener('resize', onResize);
            renderer.dispose();
            container.innerHTML = '';
        }
    };
}


// 3D 판 생성 함수
function createA6Board(THREE, frontImageURL, backImageURL) {
    const textureLoader = new THREE.TextureLoader();
    
    // A6 비율 근사치 (너비:1, 높이:1.414)
    const width = 1.0;
    const height = 1.414;
    const thickness = 0.018; 

    // 앞면 텍스처 로드 및 Material
    const frontTexture = textureLoader.load(frontImageURL);
    frontTexture.colorSpace = THREE.SRGBColorSpace;
    const frontMaterial = new THREE.MeshBasicMaterial({ 
        map: frontTexture,
        side: THREE.FrontSide, 
    });

    // 뒷면 텍스처 로드 및 Material
    const backTexture = textureLoader.load(backImageURL);
    backTexture.colorSpace = THREE.SRGBColorSpace;
    const backMaterial = new THREE.MeshBasicMaterial({ 
        map: backTexture,
        side: THREE.FrontSide, 
    });

    // 측면 Material
    const sideMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xcccccc, 
        metalness: 0.8, 
        roughness: 0.5 
    });
    
    // 박스 Geometry
    const boxGeometry = new THREE.BoxGeometry(width, height, thickness);
    
    // Material 배열: [오른, 왼, 위, 아래, 앞, 뒤]
    const materials = [
        sideMaterial, sideMaterial, 
        sideMaterial, sideMaterial, 
        frontMaterial, // Z축 앞 (5번 인덱스)
        backMaterial   // Z축 뒤 (6번 인덱스)
    ];

    const boardMesh = new THREE.Mesh(boxGeometry, materials);
    
    // Group으로 묶어 크기 조정
    const boardGroup = new THREE.Group();
    boardGroup.add(boardMesh);
    
    // 초기 회전 및 크기 설정
    boardGroup.rotation.x = -Math.PI / 10; 
    boardGroup.rotation.y = Math.PI / 8;
    boardGroup.scale.setScalar(2); 

    return boardGroup;
}


const GLB_MODELS_DATA = [
  {
    model: './assets/models/flower1.glb',
    text: '스팸방울독',
    images: [
      './assets/bg/upload3d/4x/flower1 (2).png',
      './assets/bg/upload3d/4x/flower1 (1).png'
    ]
  },
  {
    model: './assets/models/flower2.glb',
    text: '화소야밤귀',
    images: [
     './assets/bg/upload3d/4x/flower2 (2).png',
      './assets/bg/upload3d/4x/flower2 (1).png'
    ]
  },
  {
    model: './assets/models/flower3.glb',
    text: '저물빛덩굴',
    images: [
  './assets/bg/upload3d/4x/flower3 (2).png',
      './assets/bg/upload3d/4x/flower3 (1).png'
    ]
  },
  {
    model: './assets/models/flower4.glb',
    text: '전파솜털이',
    images: [
 './assets/bg/upload3d/4x/flower4 (2).png',
      './assets/bg/upload3d/4x/flower4 (1).png'
    ]
  }
];

let currentModelData = null; 
let currentSliderImages = [];
let currentSliderIndex = 0;


export default {
  async mount(root){
    const el = document.createElement('section');
    el.className = 'upload3d-wrap'; 
    
    // HTML 구성
    el.innerHTML = `
      <div class="upload-top-text" id="model-text"></div>
      <div id="stage"></div>
      <div class="upload-bottom-left-ui">
        <img src="./assets/ui/loading/ui.png" alt="Tip Box" />
        <p>식물을 마우스로 이리 저리 돌려보고 가까이 확대해서 관찰해보세요. 옆에 있는 버튼을 눌러 편지도 함께 읽어주세요!</p>
      </div>
      <div class="upload-bottom-right-ui">
        <div class="upload-button" id="btn-show-images"></div>
        <div class="upload-button" id="btn-go-landing"></div>
      </div>
      <div class="upload-image-slider" id="image-slider" style="display: none;">
        <div class="slider-close-btn" id="slider-close">X</div>
        <div id="board-stage"></div> 
      </div>
    `;
    root.appendChild(el);

    const stage = el.querySelector('#stage');
    const modelTextEl = el.querySelector('#model-text');
    const imageSlider = el.querySelector('#image-slider');
    const boardStage = el.querySelector('#board-stage'); 

    // 3D 환경 준비 (메인 씬)
    stage.innerHTML = '';
    const lib = await ensureThree();
    const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
    const { DRACOLoader } = await import('three/examples/jsm/loaders/DRACOLoader.js');

    if (!threeCtx) {
      threeCtx = initThree(stage, lib);
    } else {
      threeCtx.start(); 
      stage.appendChild(threeCtx.renderer.domElement);
      // 화면 재구성 시 리사이즈 보정
      threeCtx.resize(); 
    }
    threeCtx.clear();

    // 랜덤 모델 선택 및 데이터 저장
    const randomModelData = GLB_MODELS_DATA[Math.floor(Math.random() * GLB_MODELS_DATA.length)];
    currentModelData = randomModelData;
    const url = randomModelData.model;
    currentSliderImages = randomModelData.images;
    currentSliderIndex = 0; 

    // 조명 색상 변경
    const isFlower1 = url.includes('flower1');
    
    if (threeCtx.lights) {
      const ambientColor = isFlower1 ? 0xaaaaff : 0xffffff; 
      const hemiSkyColor = isFlower1 ? 0xaaaaff : 0xffffff;
      const dirColor = isFlower1 ? 0xccccff : 0xffffff;

      threeCtx.lights.ambient.color.setHex(ambientColor);
      threeCtx.lights.hemi.color.setHex(hemiSkyColor);
      threeCtx.lights.dir1.color.setHex(dirColor);
      threeCtx.lights.dir2.color.setHex(dirColor);
      threeCtx.lights.dir3.color.setHex(dirColor);
    }

    // DRACO 설정
    if (!dracoLoader) {
      dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
    }
    
    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    // GLB 로딩
    loader.load(
      url,
      (gltf) => {
        const model = gltf.scene;
        model.scale.setScalar(20); 
        
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
            }
          }
        });
        
        threeCtx.setObject(model);
        modelTextEl.textContent = randomModelData.text;
      },
      (xhr) => { },
      (err) => {
        console.error('GLB load error:', err);
        stage.textContent = 'GLB 로드 오류';
      }
    );
    
    // ✨ [이미지 보기' 버튼 이벤트 수정 - 문제 해결 로직 적용]
    el.querySelector('#btn-show-images').addEventListener('click', async ()=>{
      if (currentModelData.images.length === 0) return;

      // 1. 메인 씬 렌더링 중지
      if (threeCtx) threeCtx.stop();

      // 2. 슬라이더 (오버레이)를 **먼저** 표시하여 boardStage에 크기를 할당
      imageSlider.style.display = 'grid'; 
      
      // 3. 3D 판 씬 초기화 및 로드
      boardStage.innerHTML = '';
      if (boardCtx) {
          boardCtx.dispose();
          boardCtx = null;
      }
      
      const lib = await ensureThree();
      boardCtx = initBoardThree(boardStage, lib);

      // 4. ✨ **렌더러 크기 수동 업데이트 (핵심)**
      // display: none에서 display: grid로 바뀌면서 크기가 확정된 후, 
      // 렌더러와 카메라를 실제 크기에 맞춥니다.
      boardCtx.resize(); 

      // 5. 모델 생성 및 설정
      const frontImage = currentModelData.images[0];
      const backImage = currentModelData.images.length > 1 ? currentModelData.images[1] : currentModelData.images[0];
      
      const boardModel = createA6Board(boardCtx.THREE, frontImage, backImage);
      boardCtx.setObject(boardModel);
    });

    el.querySelector('#btn-go-landing').addEventListener('click', () => ScreenManager.go('landing'));

    // [슬라이더 닫기 버튼 이벤트]
    el.querySelector('#slider-close').addEventListener('click', () => {
      imageSlider.style.display = 'none';

      // 1. 3D 판 씬 정리
      if (boardCtx) {
        boardCtx.dispose();
        boardCtx = null;
        boardStage.innerHTML = '';
      }
      
      // 2. 메인 씬 렌더링 재개
      if (threeCtx) threeCtx.start();
    });
    
  },

  async unmount(){
    if (threeCtx?.dispose) threeCtx.dispose();
    threeCtx = null;
    
    if (boardCtx?.dispose) boardCtx.dispose();
    boardCtx = null;

    if (dracoLoader) {
      dracoLoader.dispose();
      dracoLoader = null;
    }
  }
};