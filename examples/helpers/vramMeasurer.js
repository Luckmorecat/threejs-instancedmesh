import * as THREE from "../../build/three.module.js";

export const measureVRAMSizeForModel = (model) => {
	let sizeByte = 0;
	model.traverse((obj) => {
		if (obj instanceof THREE.Mesh) {
			if (obj.material instanceof Array) {
				obj.material.forEach((m) => {
					sizeByte += measureMaterialSize(m);
				});
			} else {
				sizeByte += measureMaterialSize(obj.material);
			}
			sizeByte += measureGeometrySize(obj.geometry);
		}
	});

	return sizeByte;
};

const measureMaterialSize = (material) => {
	let size = 0;

	if (
		material instanceof THREE.MeshStandardMaterial ||
		material instanceof THREE.MeshPhysicalMaterial ||
		material instanceof THREE.MeshBasicMaterial
	) {
		if (material.map) {
			size += getTextureSize(material.map);
		}
		if (material.lightMap) {
			size += getTextureSize(material.lightMap);
		}
		if (material.aoMap) {
			size += getTextureSize(material.aoMap);
		}

		size += 21;
	}

	return size;
};

const measureGeometrySize = (geometry) => {
	let byteSize = 0;

	const attrKeys = Object.keys(geometry.attributes);
	attrKeys.forEach((k) => {
		const attr = geometry.getAttribute(k);
		if (attr && attr.array instanceof Float32Array) {
			byteSize += attr.array.byteLength;
		}
	});

	return byteSize;
};

const AlphaFormat = 1021;
const RGBFormat = 1022;
const RGBAFormat = 1023;
const LuminanceFormat = 1024;
const LuminanceAlphaFormat = 1025;
const RGBEFormat = RGBAFormat;

const kFormat = {
	[AlphaFormat]: 1,
	[RGBFormat]: 3,
	[RGBAFormat]: 4,
	[LuminanceFormat]: 1,
	[LuminanceAlphaFormat]: 2,
	[RGBEFormat]: 4,
};

const getTextureSize = (texture) => {
	const k = kFormat[texture.format] || 4;
	const mipmapsK = texture.generateMipmaps ? 1.75 : 1;
	if (texture.image instanceof HTMLImageElement) {
		return (
			texture.image.clientHeight * texture.image.clientWidth * k * mipmapsK
		);
	}
	if (texture.image instanceof ImageBitmap) {
		return texture.image.width * texture.image.height * k * mipmapsK;
	}
	if (texture.image instanceof ImageData) {
		return texture.image.width * texture.image.height * k * mipmapsK;
	}

	return 0;
};
