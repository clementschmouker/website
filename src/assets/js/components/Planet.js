


export default class Planet extends THREE.Object3D {
	constructor(param) {
		super();
		this.radius = param.radius || .5;
		this.color = param.color || 0x345678;
		this.angle = 0;
		this.rotationSpeed = param.rotationSpeed || 0.02;
		this.distanceFromSun = param.distanceFromSun || 0;

		this.initialize();
	}



	initialize() {
		// Visible mesh
		this.geometry = new THREE.DodecahedronBufferGeometry(this.radius, 1);
		this.material = new THREE.MeshPhongMaterial({
			color: this.color
		})
		this.material.flatShading = true;
		this.mesh = new THREE.Mesh(this.geometry, this.material);
		this.add(this.mesh);

		//Occlusion mesh
		this.oclMaterial = new THREE.MeshBasicMaterial({
			color: 0x000000
		})
		this.oclMesh = new THREE.Mesh(this.geometry, this.oclMaterial);
		this.oclMesh.position.copy(this.mesh.position);
		this.oclMesh.layers.set(1);
		this.add(this.oclMesh);
	}

	update() {
		let xpos = Math.sin(this.angle) * this.distanceFromSun;
		let zpos = Math.cos(this.angle) * this.distanceFromSun;

		this.mesh.position.set(xpos, 0, zpos);
		this.mesh.rotation.x += 0.01;
		this.mesh.rotation.y += 0.01;

		this.oclMesh.position.copy(this.mesh.position);
		this.oclMesh.rotation.copy(this.mesh.rotation);

		this.angle += this.rotationSpeed;
	}

}
