// Inicializa a rolagem suave com Lenis
const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update); // Atualiza o ScrollTrigger ao rolar
gsap.ticker.add((time) => {
    lenis.raf(time * 1000); // Atualiza a rolagem suave a cada frame
});
gsap.ticker.lagSmoothing(0); // Desativa a suavização de lag do GSAP

// Cria a cena do Three.js
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xfefdfd); // Define a cor de fundo da cena

// Configura a câmera perspectiva
const camera = new THREE.PerspectiveCamera(
    75, // Campo de visão
    window.innerWidth / window.innerHeight, // Proporção da tela
    0.1, // Plano de corte próximo
    1000 // Plano de corte distante
);

// Configura o renderizador WebGL
const renderer = new THREE.WebGLRenderer({
    antialias: true, // Ativa o antialiasing
    alpha: true, // Permite transparência
});

// Configurações adicionais do renderizador
renderer.setClearColor(0xffffff, 1); // Define a cor de fundo do renderizador
renderer.setSize(window.innerWidth, window.innerHeight); // Define o tamanho do renderizador
renderer.setPixelRatio(window.devicePixelRatio); // Ajusta o pixel ratio para dispositivos de alta densidade
renderer.shadowMap.enabled = true; // Ativa o mapa de sombras
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Define o tipo de sombra
renderer.physicallyCorrectLights = true; // Ativa a iluminação fisicamente correta
renderer.toneMapping = THREE.ACESFilmicToneMapping; // Define o mapeamento de tons
renderer.toneMappingExposure = 2.5; // Define a exposição do mapeamento de tons
document.querySelector(".model").appendChild(renderer.domElement); // Adiciona o renderizador ao DOM

// Carrega a textura de fundo
const textureLoader = new THREE.TextureLoader();
const backgroundTexture = textureLoader.load("./assets/background.png");

// Cria o plano de fundo
const planeGeometry = new THREE.PlaneGeometry(80, 50); // Define a geometria do plano
const planeMaterial = new THREE.MeshBasicMaterial({
    map: backgroundTexture, // Aplica a textura ao plano
    side: THREE.DoubleSide, // Define que a textura será aplicada em ambos os lados
});

const plane = new THREE.Mesh(planeGeometry, planeMaterial); // Cria o mesh do plano
plane.position.set(0, 0, -100); // Posiciona o plano na cena
scene.add(plane); // Adiciona o plano à cena

// Configura as luzes da cena
const ambientLight = new THREE.AmbientLight(0xffffff, 3); // Luz ambiente
scene.add(ambientLight);

const mainLight = new THREE.DirectionalLight(0xffffff, 1); // Luz direcional principal
mainLight.position.set(5, 10, 7.5); // Posiciona a luz
scene.add(mainLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 3); // Luz direcional de preenchimento
fillLight.position.set(-5, 0, -5); // Posiciona a luz
scene.add(fillLight);

const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 2); // Luz hemisférica
hemiLight.position.set(0, 25, 0); // Posiciona a luz
scene.add(hemiLight);

// Função de animação básica
function basicAnimate() {
    renderer.render(scene, camera); // Renderiza a cena
    requestAnimationFrame(basicAnimate); // Chama a próxima frame
}
basicAnimate(); // Inicia a animação

// Carrega o modelo 3D
let model;
const loader = new THREE.GLTFLoader();
loader.load("./assets/modelos/chair.glb", function (gltf) {
    model = gltf.scene; // Define o modelo carregado
    model.traverse((node) => {
        if (node.isMesh) {
            if (node.material) {
                node.material.metalness = 0.8; // Define o metalness do material
                node.material.roughness = 0.8; // Define o roughness do material
                node.material.envMapIntensity = 1; // Define a intensidade do mapa de ambiente
            }
            node.castShadow = true; // Ativa a projeção de sombras
            node.receiveShadow = true; // Ativa a recepção de sombras
        }
    });

    const box = new THREE.Box3().setFromObject(model); // Cria uma caixa de colisão para o modelo
    const center = box.getCenter(new THREE.Vector3()); // Obtém o centro da caixa de colisão
    model.position.sub(center); // Centraliza o modelo na cena
    scene.add(model); // Adiciona o modelo à cena

    const size = box.getSize(new THREE.Vector3()); // Obtém o tamanho da caixa de colisão
    const maxDim = Math.max(size.x, size.y, size.z); // Obtém a maior dimensão
    camera.position.z = maxDim * 1.5; // Ajusta a posição da câmera
    camera.position.y = maxDim * 0.3; // Ajusta a posição da câmera

    model.scale.set(0, 0, 0); // Define a escala inicial do modelo como 0
    playInitialAnimation(); // Inicia a animação inicial

    cancelAnimationFrame(basicAnimate); // Cancela a animação básica
    animate(); // Inicia a animação personalizada
});

// Efeitos de rotação e flutuação
const floatAmplitude = 0.1; // Amplitude da flutuação
const floatSpeed = 1.5; // Velocidade da flutuação
const rotationSpeed = 1; // Velocidade da rotação
let isFloating = true; // Define se o modelo está flutuando
let currentScroll = 0; // Armazena a posição atual da rolagem

const stickyHeight = window.innerHeight; // Altura da viewport
const scannerSection = document.querySelector(".scanner"); // Seção do scanner
const scannerPosition = scannerSection.offsetTop; // Posição do scanner na página
const scanContainer = document.querySelector(".scan-container"); // Contêiner do scanner
const scanSound = new Audio("./assets/bell.mp3"); // Som do scanner
gsap.set(scanContainer, { scale: 0 }); // Define a escala inicial do contêiner do scanner como 0

// Função de animação inicial
function playInitialAnimation() {
    if (model) {
        gsap.to(model.scale, {
            x: 0.8,
            y: 0.8,
            z: 0.8,
            duration: 1,
            ease: "power2.out", // Efeito de easing
        });
    }
    gsap.to(scanContainer, {
        scale: 1,
        duration: 1,
        ease: "power2.out", // Efeito de easing
    });
}

// Configura o ScrollTrigger para o topo da página
ScrollTrigger.create({
    trigger: "body",
    start: "top top",
    end: "top -10",
    onEnterBack: () => {
        if (model) {
            gsap.to(model.scale, {
                x: 0.8,
                y: 0.8,
                z: 0.8,
                duration: 1,
                ease: "power2.out", // Efeito de easing
            });

            // Esconde o perfil
            gsap.to(".perfil", {
                opacity: 0, // Torna invisível
                scale: 0, // Reduz a escala para 0
                duration: 0.5, // Duração da animação
                ease: "power2.in", // Efeito de easing
            });
            isFloating = true; // Ativa a flutuação
        }
        gsap.to(scanContainer, {
            scale: 1,
            duration: 1,
            ease: "power2.out", // Efeito de easing
        });
    },
});

// Configura o ScrollTrigger para a seção do scanner
ScrollTrigger.create({
    trigger: ".scanner",
    start: "top top",
    end: `${stickyHeight}px`,
    pin: true, // Fixa a seção durante a rolagem
    onEnter: () => {
        if (model) {
            isFloating = false; // Desativa a flutuação
            model.position.y = 0; // Reposiciona o modelo

            setTimeout(() => {
                scanSound.currentTime = 0; // Reinicia o som
                scanSound.play(); // Toca o som
            }, 500);

            gsap.to(model.rotation, {
                y: model.rotation.y + Math.PI * 2,
                duration: 1,
                ease: "power2.inOut", // Efeito de easing
                onComplete: () => {
                    gsap.to(model.scale, {
                        x: 0,
                        y: 0,
                        z: 0,
                        duration: 0.5,
                        ease: "power2.in", // Efeito de easing
                        onComplete: () => {
                            gsap.to(scanContainer, {
                                scale: 0,
                                duration: 0.5,
                                ease: "power2.in", // Efeito de easing
                            });
                            setTimeout(() => {
                                gsap.to(".perfil", {
                                    opacity: 1, // Torna visível
                                    scale: 1, // Aumenta a escala
                                    duration: 0.5, // Duração da animação
                                    ease: "power2.out", // Efeito de easing
                                });
                            }, 600); // Delay de 1 segundo
                        },
                    });
                },
            });
        }
    },
    onLeaveBack: () => {
        gsap.set(scanContainer, { scale: 0 }); // Define a escala do contêiner do scanner como 0
        gsap.to(scanContainer, {
            scale: 1,
            duration: 1,
            ease: "power2.out", // Efeito de easing
        });
    },
});

// Atualiza a posição da rolagem
lenis.on("scroll", (e) => {
    currentScroll = e.scroll;
});

// Função de animação personalizada
function animate() {
    if (model) {
        if (isFloating) {
            const floatOffset =
                Math.sin(Date.now() * 0.001 * floatSpeed) * floatAmplitude; // Calcula o deslocamento da flutuação
            model.position.y = floatOffset; // Aplica a flutuação ao modelo
        }

        const scrollProgress = Math.min(currentScroll / scannerPosition, 1); // Calcula o progresso da rolagem

        if (scrollProgress < 1) {
            model.rotation.y = scrollProgress * Math.PI * 2; // Aplica a rotação ao modelo
        }

        if (scrollProgress < 1) {
            model.rotation.y += 0.01 * rotationSpeed; // Aplica a rotação contínua ao modelo
        }
    }

    renderer.render(scene, camera); // Renderiza a cena
    requestAnimationFrame(animate); // Chama a próxima frame
}