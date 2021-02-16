export default /* glsl */ `
vec4 mvPosition = vec4( transformed, 1.0 );


#ifdef USE_INSTANCING
	vec2 instanceArr[16];
	vec2 modelViewArr[16];

	for(int i=0;i<16;i++)
	{
		instanceArr[i] = vec2(instanceMatrix[i % 4][int(i / 4)], instanceMatrixL[i % 4][int(i / 4)]);
		modelViewArr[i] = vec2(modelViewMatrixH[i % 4][int(i / 4)], modelViewMatrixL[i % 4][int(i / 4)]);
	}
	vec2 result[4];
	mat4_vec4_mul_fp64(instanceArr,
		vec2[4](
			split(mvPosition.x),
			split(mvPosition.y),
			split(mvPosition.z),
			split(mvPosition.w)
		),
		result);

	//mvPosition = instanceMatrix * mvPosition;
	vec2 result2[4];
	mat4_vec4_mul_fp64(modelViewArr, result, result2);
	mvPosition.xyzw = vec4(
		result2[0].x + result2[0].y,
		result2[1].x + result2[1].y,
		result2[2].x + result2[2].y,
		result2[3].x + result2[3].y
	);
#else
	vec2 mvm[16];
	vec2 result[4];
	for(int i=0;i<16;i++)
	{
		mvm[i] = vec2(modelViewMatrix[i % 4][int(i / 4)], 0);
	}

	mat4_vec4_mul_fp64(
		mvm,
		vec2[4](
			vec2(mvPosition.x, 0),
			vec2(mvPosition.y, 0),
			vec2(mvPosition.z, 0),
			vec2(mvPosition.w, 0)
		),
		result
		);
	mvPosition.xyzw = vec4(result[0].x + result[0].y, result[1].x + result[1].y, result[2].x + result[2].y, result[3].x + result[3].y);
#endif
//mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;
`;
