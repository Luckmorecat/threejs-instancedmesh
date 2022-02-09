import { InstancedBufferAttribute } from '../core/InstancedBufferAttribute.js';
import { Mesh } from './Mesh.js';
import { Matrix4 } from '../math/Matrix4.js';
import { DynamicDrawUsage } from "../constants";

const _instanceLocalMatrix = /*@__PURE__*/ new Matrix4();
const _instanceWorldMatrix = /*@__PURE__*/ new Matrix4();

const _instanceIntersects = [];

const _mesh = /*@__PURE__*/ new Mesh();

class InstancedMesh extends Mesh {

	constructor( geometry, material, count ) {

		super( geometry, material );

		this.instanceMatrix = new InstancedBufferAttribute( new Float32Array( count * 16 ), 16 );
		this.instanceMatrixExpand = new Float64Array(count * 16);
		this.instanceMatrixModelView = new InstancedBufferAttribute( new Float32Array( count * 16 ), 16 );
		this.instanceMatrixModelView.setUsage( DynamicDrawUsage );
		this.instanceColor = null;

		this.count = count;

		this.frustumCulled = false;

	}

	updateMatrixes ( matrix ) {
		const mat4 = new Matrix4();
		for (let index = 0; index < this.count; index++) {
			mat4.identity();
			this.getMatrixAt(index, mat4);

			mat4.premultiply(matrix);
			mat4.toArray(this.instanceMatrixModelView.array, index * 16);
		}

		this.instanceMatrixModelView.needsUpdate = true;
	}

	getMatrixPureAt( index, matrix ) {
		matrix.fromArray( this.instanceMatrixModelView.array, index * 16 );
	}

	copy( source ) {

		super.copy( source );

		this.instanceMatrix.copy( source.instanceMatrix );

		if ( source.instanceColor !== null ) this.instanceColor = source.instanceColor.clone();

		this.count = source.count;

		return this;

	}

	getColorAt( index, color ) {

		color.fromArray( this.instanceColor.array, index * 3 );

	}

	getMatrixAt( index, matrix ) {

		matrix.fromArray( this.instanceMatrixExpand, index * 16 );

	}

	raycast( raycaster, intersects ) {

		const matrixWorld = this.matrixWorld;
		const raycastTimes = this.count;

		_mesh.geometry = this.geometry;
		_mesh.material = this.material;

		if ( _mesh.material === undefined ) return;

		for ( let instanceId = 0; instanceId < raycastTimes; instanceId ++ ) {

			// calculate the world matrix for each instance

			this.getMatrixAt( instanceId, _instanceLocalMatrix );

			_instanceWorldMatrix.multiplyMatrices( matrixWorld, _instanceLocalMatrix );

			// the mesh represents this single instance

			_mesh.matrixWorld = _instanceWorldMatrix;

			_mesh.raycast( raycaster, _instanceIntersects );

			// process the result of raycast

			for ( let i = 0, l = _instanceIntersects.length; i < l; i ++ ) {

				const intersect = _instanceIntersects[ i ];
				intersect.instanceId = instanceId;
				intersect.object = this;
				intersects.push( intersect );

			}

			_instanceIntersects.length = 0;

		}

	}

	setColorAt( index, color ) {

		if ( this.instanceColor === null ) {

			this.instanceColor = new InstancedBufferAttribute( new Float32Array( this.instanceMatrix.count * 3 ), 3 );

		}

		color.toArray( this.instanceColor.array, index * 3 );

	}

	setMatrixAt( index, matrix ) {

		matrix.toArray( this.instanceMatrix.array, index * 16 );
		matrix.toArray( this.instanceMatrixExpand, index * 16 );

	}

	updateMorphTargets() {

	}

	dispose() {

		this.dispatchEvent( { type: 'dispose' } );

	}

}

InstancedMesh.prototype.isInstancedMesh = true;

export { InstancedMesh };
