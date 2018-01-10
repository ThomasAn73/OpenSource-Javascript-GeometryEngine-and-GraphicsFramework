
//Thomas Androxman
//---------------------------------------------------------------------------------

//Note: fragment shaders don't have a default precision so we need to pick one.
//   -> highp   float range -> -2^62 to 2^62, int range -> -2^16 to 2^16
//   -> mediump float range -> -2^14 to 2^14, int range -> -2^10 to 2^10
//   -> lowp    float range -> -2^1  to 2^1,  int range -> -2^8  to 2^8
precision mediump float;
precision highp int;
precision lowp sampler2D;

//uniform variables (max is 16)----------------------------------------------------
uniform vec4      ambientColor;     // Scene level. Background illumination
uniform float     ambientIntensity; // Scene level.
uniform int       appearanceFlags;  //Object level. On/Off flags are held as the integer bits
uniform vec4      wireframeColor;   //Object level. Only when wireframe falg is on in the appearanceFlags
uniform sampler2D textureUnit[6];   //Object level. Up to 6 texture units per draw call (max is 8)
uniform bool      useTextures;      //Object level. If no textures, don't bother reading the TextureUnit array
//Note: textureUnit is essentialy an int array. Integers are being passed to it via gl.uniform1iv(shaderVar.textureUnit, [0,1,2,3,4,5]); 
//Note: So for textureUnit[0]==0 then -->gl.TEXTURE0<-- will be used

//non-uniform variables (should not exceed 8)-------------------------------------- 
varying vec4  frVertexColor;        //Vertex color
varying vec2  frVertexUV;           
varying float frTexUnitIdx;         //Active texture unit for the current vertex
varying float frVertLightIntensity; //negative value means no response to light
varying vec3  frBaryCoord;          //barycentric coordinate from the vertex shader

//Function declarations------------------------------------------------------------
vec4 GetValueFromTexture2d   (float idx);
bool GetAppearanceStateOnBit (lowp int bitIdx);
vec4 ComputeFaceColor        (bool isFullColor);
//---------------------------------------------------------------------------------

//Note: Any operations done inside the fragment shader are expensive
void main ()
{
    //Get appearance bits -------------------------
    bool isFullColor     = GetAppearanceStateOnBit(0);
    bool showWireframe   = GetAppearanceStateOnBit(1);
    bool isWireSeeThru   = GetAppearanceStateOnBit(2);
    //---------------------------------------------

    //Draw fragment
    if ( !showWireframe || (showWireframe && !isWireSeeThru) ) {gl_FragColor = ComputeFaceColor(isFullColor);} //Face color is showing.
    else if (showWireframe && isWireSeeThru) {gl_FragColor = vec4(1.0,1.0,1.0,0.8);}

    if (showWireframe && any( lessThan( frBaryCoord, vec3(0.015) ) ) ) {gl_FragColor=wireframeColor;} //The wireframe itself	(using standard barycentric)
    //if (showWireframe && mod(frBaryCoord.x-floor(frBaryCoord.x),0.2)<0.07) {gl_FragColor=wireframeColor;}
    //if (showWireframe && ((frBaryCoord.x*frBaryCoord.y-1.0)*1000.0)<10.0) {gl_FragColor=wireframeColor;}
}

vec4 ComputeFaceColor (bool isFullColor)
{
    vec4 tempColor;

    if (isFullColor && useTextures && frTexUnitIdx>=0.0 && frTexUnitIdx<=5.0)
    {
        tempColor = GetValueFromTexture2d (frTexUnitIdx);
        //tempColor = tempColor*tempColor.w + (1.0-tempColor.w)*frVertexColor; //if both textures and vertex color is used (normal blending)
    } 
    else { tempColor = frVertexColor; }

    if (frVertLightIntensity>=0.0) 
    {
        tempColor = tempColor * vec4((ambientColor.xyz*ambientIntensity + ambientColor.w*frVertLightIntensity)/2.0, 1.0);
    }

    return tempColor;
}

bool GetAppearanceStateOnBit (lowp int bitIdx)
{
    float temp = (float(appearanceFlags / int(pow(2.0,float(bitIdx))) )) / 2.0;
    return (temp > float(int(temp)) )? true : false;
}

//Note: This version of glsl does not support dynamic indexing
//Note: The texture units must be indexed manually
vec4 GetValueFromTexture2d (float idx)
{
    //Between two vertices the float idx of a texture unit varies from some value to the same value,
    //e.g. for the first texture it varies from 0.0 to 0.0 so the only concern is floating point errors and only need a test for idx<0.5
    if (idx<0.5) {return texture2D(textureUnit[0], frVertexUV);}
    if (idx<1.5) {return texture2D(textureUnit[1], frVertexUV);}
    if (idx<2.5) {return texture2D(textureUnit[2], frVertexUV);}
    if (idx<3.5) {return texture2D(textureUnit[3], frVertexUV);}
    if (idx<4.5) {return texture2D(textureUnit[4], frVertexUV);}
    if (idx<5.5) {return texture2D(textureUnit[5], frVertexUV);}
}
