// const THREE = require('three');

export default class Header {

	constructor() {
		this.domEls = {
			header		 : document.querySelector('#header'),
			headerBg	 : document.querySelector('.header__bg'),
			headerFrame  : document.querySelector('.header__bg__frame'),
			canvasHolder : document.querySelector('#canvasHolder'),
		}

		this.values = {
			width: window.innerWidth,
			height: window.innerHeight,
		}

		this.DEFAULT_LAYER = 0;
		this.OCCLUSION_LAYER = 1;
		this.RENDERSCALE = 0.5;
		this.angle = 0;

		this.initShaders();
		this.initRenderer();
		this.initScene();
		this.initCamera();
		this.initLight();
		this.initCube();
		this.initPostProcess();
		this.loop();

		// Events
		window.addEventListener('resize', () => {
			this.onResize();
		})
		window.addEventListener('mousemove', (e) => {
			this.onMouseMove(e);
		})
		window.addEventListener('keydown', (e) => {
			console.log(event.key);

			switch (event.key) {
				case 's': this.camera.position.y -= .5;
				break;
				case 'z': this.camera.position.y += .5;
				break;
			}
		})

	}


	// INITIALIZE
	// ----------------------------------------------------
	initRenderer() {
		this.renderer = new THREE.WebGLRenderer({
			antialias: true,
			alpha: true,
		});
		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.setSize(this.values.width, this.values.height);
		this.domEls.canvasHolder.appendChild(this.renderer.domElement);
	}

	initScene() {
		this.scene = new THREE.Scene();
	}

	initCamera() {
		const FOV = 60;
		const RATIO = this.values.width / this.values.height;
		const NEAR = 0.1;
		const FAR = 10000;
		this.camera = new THREE.PerspectiveCamera(FOV, RATIO, NEAR, FAR);

		this.camera.position.z = 15;
		this.camera.position.y = 8;
		this.camera.lookAt(new THREE.Vector3(0, 0, 0));
	}

	initLight() {
		this.ambientLight = new THREE.AmbientLight(0x2c3e50);
		this.scene.add(this.ambientLight);

		this.pointLight = new THREE.PointLight(0xffffff);
		this.scene.add(this.pointLight);


		const oclGeo = new THREE.SphereBufferGeometry(1, 16, 16);
		const oclMat = new THREE.MeshBasicMaterial({color: 0xffffff});
		this.occlusionSphere = new THREE.Mesh(oclGeo, oclMat);
		this.occlusionSphere.layers.set(this.OCCLUSION_LAYER);
		this.scene.add(this.occlusionSphere);
	}

	initCube() {
		const geometry = new THREE.DodecahedronBufferGeometry(1, 1);
		let material = new THREE.MeshPhongMaterial({
			color: 0xe74c3c
		});
		material.flatShading = true;
		this.cube = new THREE.Mesh(geometry, material);
		this.scene.add(this.cube);

		material = new THREE.MeshBasicMaterial({color: 0x000000})
		this.oclBox = new THREE.Mesh(geometry, material);
		this.oclBox.position.copy(this.cube.position);
		this.oclBox.layers.set(this.OCCLUSION_LAYER);
		this.scene.add(this.oclBox);



		const planeGeo = new THREE.PlaneGeometry(10, 10, 1, 1);
		this.plane = new THREE.Mesh(planeGeo, material);
		this.plane.rotation.x = -Math.PI/2;
		this.scene.add(this.plane);
	}

	initShaders() {

		THREE.VolumetericLightShader = {
		  uniforms: {
		    tDiffuse: {value:null},
		    lightPosition: {value: new THREE.Vector2(0.5, 0.5)},
		    exposure: {value: 0.18},
		    decay: {value: 0.95},
		    density: {value: 0.8},
		    weight: {value: 0.4},
		    samples: {value: 50}
		  },

		  vertexShader: [
		    "varying vec2 vUv;",
		    "void main() {",
		      "vUv = uv;",
		      "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
		    "}"
		  ].join("\n"),

		  fragmentShader: [
		    "varying vec2 vUv;",
		    "uniform sampler2D tDiffuse;",
		    "uniform vec2 lightPosition;",
		    "uniform float exposure;",
		    "uniform float decay;",
		    "uniform float density;",
		    "uniform float weight;",
		    "uniform int samples;",
		    "const int MAX_SAMPLES = 100;",
		    "void main()",
		    "{",
		      "vec2 texCoord = vUv;",
		      "vec2 deltaTextCoord = texCoord - lightPosition;",
		      "deltaTextCoord *= 1.0 / float(samples) * density;",
		      "vec4 color = texture2D(tDiffuse, texCoord);",
		      "float illuminationDecay = 1.0;",
		      "for(int i=0; i < MAX_SAMPLES; i++)",
		      "{",
		        "if(i == samples){",
		          "break;",
		        "}",
		        "texCoord -= deltaTextCoord;",
		        "vec4 sample = texture2D(tDiffuse, texCoord);",
		        "sample *= illuminationDecay * weight;",
		        "color += sample;",
		        "illuminationDecay *= decay;",
		      "}",
		      "gl_FragColor = color * exposure;",
		    "}"
		  ].join("\n")
		};

		THREE.AdditiveBlendingShader = {
		  uniforms: {
		    tDiffuse: { value:null },
		    tAdd: { value:null }
		  },

		  vertexShader: [
		    "varying vec2 vUv;",
		    "void main() {",
		      "vUv = uv;",
		      "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
		    "}"
		  ].join("\n"),

		  fragmentShader: [
		    "uniform sampler2D tDiffuse;",
		    "uniform sampler2D tAdd;",
		    "varying vec2 vUv;",
		    "void main() {",
		      "vec4 color = texture2D( tDiffuse, vUv );",
		      "vec4 add = texture2D( tAdd, vUv );",
		      "gl_FragColor = color + add;",
		    "}"
		  ].join("\n")
		};

	}

	initPostProcess() {
		let pass;

		this.occlusionRenderTarget = new THREE.WebGLRenderTarget(this.values.width * this.RENDERSCALE, this.values.height * this.RENDERSCALE);
		this.occlusionComposer = new THREE.EffectComposer(this.renderer, this.occlusionRenderTarget);
		this.occlusionComposer.addPass(new THREE.RenderPass(this.scene, this.camera));
		pass = new THREE.ShaderPass(THREE.VolumetericLightShader);
		pass.needsSwap = false;
		this.occlusionComposer.addPass(pass);

		this.composer = new THREE.EffectComposer(this.renderer);
		this.composer.addPass(new THREE.RenderPass(this.scene, this.camera));
		pass = new THREE.ShaderPass(THREE.AdditiveBlendingShader);
		pass.uniforms.tAdd.value = this.occlusionRenderTarget.texture;
		this.composer.addPass(pass);
		pass.renderToScreen = true;
	}

	// Loop
	// ------------------------------------------------------

	update() {
		const radius = 2.5;
		let xpos = Math.sin(this.angle) * radius;
		let zpos = Math.cos(this.angle) * radius;

		this.cube.position.set(xpos, 0, zpos);
		this.cube.rotation.x += 0.01;
		this.cube.rotation.y += 0.01;

		this.oclBox.position.copy(this.cube.position);
		this.oclBox.rotation.copy(this.cube.rotation);

		this.angle += 0.02;
	}

	render() {
		this.camera.layers.set(this.OCCLUSION_LAYER);
		this.renderer.setClearColor(0x000000, 1);
		this.occlusionComposer.render();

		this.camera.layers.set(this.DEFAULT_LAYER);
		this.renderer.setClearColor(0x222222, 1);
		this.composer.render();
	}

	//Handlers
	// -----------------------------------------------

	onResize() {

		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();

		this.renderer.setSize(window.innerWidth, window.innerHeight);

		const pixelRatio = this.renderer.getPixelRatio();
		const newWidth = Math.floor(window.innerWidth / pixelRatio) || 1;
		const newHeight = Math.floor(window.innerHeight / pixelRatio) || 1;
		this.composer.setSize(newWidth, newHeight);
		this.occlusionComposer.setSize(newWidth * this.RENDERSCALE, newHeight * this.RENDERSCALE);
	}

	onMouseMove(event) {
		const mouseX = (this.values.width / 2) + event.clientX - (this.values.width);
		const mouseY = (this.values.height / 2) + event.clientY - (this.values.height);

		this.camera.rotation.y = -mouseX / 3000;
		this.camera.rotation.x = -Math.PI/6 -mouseY / 3000;
	}

	loop() {
		window.requestAnimationFrame( () => {
			this.loop()
		})
		this.update()
		this.render()
	}
}
