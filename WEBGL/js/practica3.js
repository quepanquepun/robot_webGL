// Variables globales
var renderer, scene, camera;
var cameraControls;
var material; 

// Cámara cenital (vista de planta)
var cameraTop;

init();
loadScene();
render();

function init() {
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0xFFFFFF);
    document.getElementById('container').appendChild(renderer.domElement);

    scene = new THREE.Scene();

    var aspectRatio = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(50, aspectRatio, 0.1, 1000);
    camera.position.set(200, 250, 250);

    // Cámara cenital: ampliamos a [-100, 100] para que el robot de radio 50 respire
    cameraTop = new THREE.OrthographicCamera(-100, 100, 100, -100, 1, 1000);
    cameraTop.position.set(0, 500, 0);
    cameraTop.lookAt(0, 0, 0);
    cameraTop.up.set(0, 0, -1); // Orientación natural del plano XZ
    cameraTop.updateProjectionMatrix(); 

    // Interacción por ratón con OrbitControls:
    // Click izq: rotar | Click dcho: desplazar | Rueda: zoom
    cameraControls = new THREE.OrbitControls(camera, renderer.domElement);
    cameraControls.target.set(0, 100, 0);

    window.addEventListener('resize', updateAspectRatio);
}

function loadScene() {
    material = new THREE.MeshNormalMaterial({ flatShading: true });

    //suelo de color diferente
    let materialSuelo = new THREE.MeshBasicMaterial({ 
        color: 0x888888, // Tono gris (puedes ajustar el valor: 0x555555 más oscuro, 0xaaaaaa más claro)
        side: THREE.DoubleSide // Opcional: para que sea visible desde arriba y abajo
    });

    // Suelo
    let geometriaPiso = new THREE.PlaneGeometry(1000, 1000, 10, 10);
    let piso = new THREE.Mesh(geometriaPiso, materialSuelo);
    piso.rotation.x = -Math.PI / 2;
    piso.position.y = 0;
    scene.add(piso);

    // Grafo de escena del Robot
    let robot = new THREE.Object3D();
    robot.position.y = 0; 
    scene.add(robot);

    // 1. Base
    let base = new THREE.Mesh(new THREE.CylinderGeometry(50, 50, 15, 32), material);
    base.position.y = 7.5; 
    robot.add(base);

    // 2. Brazo
    let brazo = new THREE.Object3D();
    brazo.position.y = 15;
    robot.add(brazo);

    let eje = new THREE.Mesh(new THREE.CylinderGeometry(20, 20, 18, 32), material);
    eje.rotation.x = Math.PI / 2; 
    brazo.add(eje);

    let esparrago = new THREE.Mesh(new THREE.BoxGeometry(18, 120, 12), material);
    esparrago.position.y = 60;
    brazo.add(esparrago);

    let rotula = new THREE.Mesh(new THREE.SphereGeometry(20, 32, 200), material);
    rotula.position.y = 120;
    brazo.add(rotula);

    // 3. Antebrazo
    let antebrazo = new THREE.Object3D();
    antebrazo.position.y = 120;
    antebrazo.rotation.y = Math.PI / 2;  
    brazo.add(antebrazo);

    let disco = new THREE.Mesh(new THREE.CylinderGeometry(22, 22, 6, 200), material);
    antebrazo.add(disco);

    let nervioGeo = new THREE.BoxGeometry(4, 80, 4);
    [
        [-10, 10], [10, 10], [-10, -10], [10, -10]
    ].forEach(pos => {
        let n = new THREE.Mesh(nervioGeo, material);
        n.position.set(pos[0], 40, pos[1]);
        antebrazo.add(n);
    });

    // 4. Mano y Pinzas
    let conjuntoMano = new THREE.Object3D();
    conjuntoMano.position.y = 80;
    antebrazo.add(conjuntoMano);

    let cilindroMano = new THREE.Mesh(new THREE.CylinderGeometry(15, 15, 40, 200), material);
    cilindroMano.rotation.z = Math.PI / 2;
    conjuntoMano.add(cilindroMano);

    let pinzaIzq = crearPinzaVértices();
    pinzaIzq.position.x = -10; 
    pinzaIzq.rotation.z = Math.PI; 
    conjuntoMano.add(pinzaIzq);

    let pinzaDer = crearPinzaVértices();
    pinzaDer.position.x = 10; 
    conjuntoMano.add(pinzaDer);
}

function crearPinzaVértices() {
    let geo = new THREE.BufferGeometry();

    const vertices = new Float32Array([
        0, -10,  0,
        4, -10,  0,
        4,  10,  0,
        0,  10,  0,

        0, -10, 19,
        4, -10, 19,
        4,  10, 19,
        0,  10, 19,

        0,  -8, 38,
        2,  -8, 38,
        2,   8, 38,
        0,   8, 38
    ]);

    const indices = [
        0, 3, 2,    0, 2, 1,
        0, 4, 7,    0, 7, 3,
        4, 8, 11,   4, 11, 7,
        1, 2, 6,    1, 6, 5,
        5, 6, 10,   5, 10, 9,
        0, 1, 5,    0, 5, 4,
        4, 5, 9,    4, 9, 8,
        3, 7, 6,    3, 6, 2,
        7, 11, 10,  7, 10, 6,
        8, 9, 10,   8, 10, 11
    ];

    geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    return new THREE.Mesh(geo, material);
}

function updateAspectRatio() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    // La cámara cenital no requiere cambiar su matriz ya que siempre se dibuja 
    // en un viewport cuadrado de 1:1 (ds x ds) y mantiene simetría.
}

function update() {
    cameraControls.update();
}

function render() {
    requestAnimationFrame(render);
    update();

    renderer.autoClear = false;

    // 1. Vista principal en perspectiva (pantalla completa)
    renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.setScissorTest(false);
    renderer.setClearColor(0xa2a2f2);
    renderer.clear();
    renderer.render(scene, camera);

    // 2. Vista miniatura cenital (cuadrada, 1/4 dimensión menor, esquina superior izquierda)
    var ds = Math.min(window.innerHeight, window.innerWidth) / 4;
    var topY = window.innerHeight - ds; // Origen Y superior en WebGL

    renderer.setViewport(0, topY, ds, ds);
    renderer.setScissor(0, topY, ds, ds);
    renderer.setScissorTest(true);
    renderer.setClearColor(0xaaffff);
    renderer.clear();   
    renderer.render(scene, cameraTop);
    renderer.setScissorTest(false);
}