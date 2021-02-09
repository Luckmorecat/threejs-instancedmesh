export default /* glsl */`
vec4 mvPosition = vec4( transformed, 1.0 );

#ifdef USE_INSTANCING

	mvPosition = instanceMatrix * mvPosition;

#else

	mvPosition = modelViewMatrix * mvPosition;

#endif

gl_Position = projectionMatrix * mvPosition;
`;
