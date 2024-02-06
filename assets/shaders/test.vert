attribute vec3 aPosition;
attribute vec2 aTexCoord;

varying vec2 vTexCoord;

void main ()
{
    // copy texture coords
    vTexCoord = aTexCoord;

    vec4 posVec4 = vec4(aPosition, 1.0);
    posVec4.xy = posVec4.xy * 2.0 - 1.0;

    gl_Position = posVec4;
}