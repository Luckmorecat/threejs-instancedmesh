import { BufferAttribute } from "../core/BufferAttribute.js";
import { Mesh } from "./Mesh.js";
import { Matrix4 } from "../math/Matrix4.js";

const _instanceLocalMatrix = new Matrix4();
const _instanceWorldMatrix = new Matrix4();

const _instanceIntersects = [];

const _mesh = new Mesh();

const SPLITTER = Math.pow(2, 18) + 1;

function InstancedMesh(geometry, material, count) {
	Mesh.call(this, geometry, material);

	this.instanceMatrix = new BufferAttribute(new Float32Array(count * 16), 16);
	this.instanceMatrixL = new BufferAttribute(new Float32Array(count * 16), 16);
	this.instanceMatrixCp = new Float64Array(count * 16);
	this.modelViewMatrixL = new Matrix4();
	this.modelViewMatrixH = new Matrix4();
	this.instanceColor = null;

	this.count = count;

	this.frustumCulled = false;
}

InstancedMesh.prototype = Object.assign(Object.create(Mesh.prototype), {
	constructor: InstancedMesh,

	isInstancedMesh: true,

	copy: function (source) {
		Mesh.prototype.copy.call(this, source);

		this.instanceMatrix.copy(source.instanceMatrix);
		this.count = source.count;

		return this;
	},

	setColorAt: function (index, color) {
		if (this.instanceColor === null) {
			this.instanceColor = new BufferAttribute(
				new Float32Array(this.count * 3),
				3
			);
		}

		color.toArray(this.instanceColor.array, index * 3);
	},
	updateMatrixes: function (matrix) {
		// console.log("deb: matrix", matrix);
		const mat4 = new Matrix4();
		for (let index = 0; index < this.count; index++) {
			mat4.identity();
			this.getMatrixCpAt(index, mat4);
			// console.log("deb: index", index, "matrix", mat4);

			mat4.premultiply(matrix);
			mat4.toArray(this.instanceMatrix.array, index * 16);
		}

		this.instanceMatrix.needsUpdate = true;
	},
	setMatrixAt: function (index, matrix) {
		console.log('set mat', matrix);
		const { hipart, lopart } = this.doublePrecision(matrix.elements);

		console.log('this', this);

		this.instanceMatrix.copyAt(index, new BufferAttribute(hipart, 16), 0);

		this.instanceMatrixL.copyAt(index, new BufferAttribute(lopart, 16), 0);

		matrix.toArray(this.instanceMatrixCp, index * 16);

		// matrix.toArray(this.instanceMatrix.array, index * 16);
	},



	doublePrecision: function (mat) {

		// function split(a) {
		// 	let t = splitter * a;
		// 	let d = a - t;
		// 	let xh = t + d;
		// 	let xl = a - xh;
		// 	return [xh, xl];
		// }

		const bufferF32H = new ArrayBuffer(4 * mat.length);
		const bufferF32L = new ArrayBuffer(4 * mat.length);

		const fViewH = new Float32Array(bufferF32H);
		const fViewL = new Float32Array(bufferF32L);

		for (let index = 0; index < mat.length; index++) {
			const t = Math.fround(SPLITTER * mat[index]);
			const d = t - mat[index];
			fViewH[index] = t - d;
			fViewL[index] = mat[index] - fViewH[index];

			// fViewH[index] = mat[index];
			// fViewL[index] = 0;

			// fViewH[index] = Math.round(Math.fround(mat[index]) * 100000) / 100000;
			// fViewL[index] = mat[index] - fViewH[index];
		}
		console.log('doublePrecision',{start: mat, hipart: fViewH,
			lopart: fViewL,})
		return {
			hipart: fViewH,
			lopart: fViewL,
		};
	},

	getMatrixCpAt: function (index, matrix) {
		matrix.fromArray(this.instanceMatrixCp, index * 16);
	},

	getMatrixAt: function (index, matrix) {
		matrix.fromArray(this.instanceMatrixCp, index * 16);
	},

	raycast: function (raycaster, intersects) {
		const matrixWorld = this.matrixWorld;
		const raycastTimes = this.count;

		_mesh.geometry = this.geometry;
		_mesh.material = this.material;

		if (_mesh.material === undefined) return;

		for (let instanceId = 0; instanceId < raycastTimes; instanceId++) {
			// calculate the world matrix for each instance

			this.getMatrixAt(instanceId, _instanceLocalMatrix);

			_instanceWorldMatrix.multiplyMatrices(matrixWorld, _instanceLocalMatrix);

			// the mesh represents this single instance

			_mesh.matrixWorld = _instanceWorldMatrix;

			_mesh.raycast(raycaster, _instanceIntersects);

			// process the result of raycast

			for (let i = 0, l = _instanceIntersects.length; i < l; i++) {
				const intersect = _instanceIntersects[i];
				intersect.instanceId = instanceId;
				intersect.object = this;
				intersects.push(intersect);
			}

			_instanceIntersects.length = 0;
		}
	},

	updateMorphTargets: function () {},
});

export { InstancedMesh };
