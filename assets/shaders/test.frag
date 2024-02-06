#ifdef GL_ES
precision mediump float;
#endif

#define PI 3.141592653589793238462643
#define GAUSSIAN_DIRECTIONS 16.0
#define GAUSSIAN_QUALITY 4.0


varying vec2 vTexCoord;

uniform sampler2D buffer_bloom;
uniform vec2 texel;
uniform float gaussian_radius;


vec3 gaussian (sampler2D tex, float radius, vec2 uv)
{
	float A;
	vec2 r = texel * radius;
    float dPI = 2.0 * PI / GAUSSIAN_DIRECTIONS;
    
	vec3 sample = texture2D(tex, uv).xyz;

    for (float a = 0.0; a < GAUSSIAN_DIRECTIONS; a++)
    {
		A = a * dPI;

		for (float i = 1.0/GAUSSIAN_QUALITY; i <= 1.0; i += 1.0/GAUSSIAN_QUALITY)
        {
			sample += texture2D(tex, uv + vec2(cos(A),sin(A))*r*i).xyz;
        }
    }
    sample /= GAUSSIAN_QUALITY * GAUSSIAN_DIRECTIONS - 1.0;

	return sample;
}


void main ()
{
	vec2 uv = vTexCoord;
	uv.y = 1.0 - uv.y;

	vec3 col = gaussian(buffer_bloom, gaussian_radius, uv);
    col += gaussian(buffer_bloom, gaussian_radius * 4.0 + 10.0, uv);
	
	gl_FragColor = vec4(col, 1.0);
}
