
//Thomas Androxman
//---------------------------------------------------------------------------------
precision mediump float;
precision highp int;
precision lowp sampler2D;

//uniform variables (max of 128) stay constant for the whole glDraw call
uniform mat4   projViewModelMatrix; //Object level. Already transposed (column major order)
uniform mat4   normalsMatrix;       //Object level. The model-matrix inversed and transposed
uniform vec4   defaultColor;        //Object level. Default object color (when R = -1 is the signal to use per-vertex color)
uniform vec4   lightColor;          // Scene level. Single light source (could be an array in the future)
uniform vec3   lightPosition;       // Scene level. Single light position
uniform float  lightIntensity;      // Scene level. Controls how far the light reaches (throw)
uniform int    appearanceFlags;     //Object level. On/Off flags are held as the integer bits
//---------------------------------------------------------------------------------
//attribute variables get fed per vertex from the buffers (should not exceed 8)
attribute vec4  vertexCoord;   //the w value contains the triangle index 0,1, or 2 used for barycentric calculation
attribute vec3  vertexNormal;  //per vertex normals
attribute vec4  vertexColor;   //per vertex color, feeding from attribute=1 of the main code
attribute vec2  vertexUVcoord; //texture coordinates
attribute float vertexTexUnit; //per vertex texture unit index
//---------------------------------------------------------------------------------
//Output variables to fragment shader
varying vec4  frVertexColor;        //Vertex color (will be ignored if there is an opaque texture)
varying vec2  frVertexUV;
varying float frTexUnitIdx;         //GL ES1.0 does not support integers as 'varying'
varying float frVertLightIntensity; //Light intensity at the particular vertex
varying vec3  frBaryCoord;          //computed barycentric coordinate
//---------------------------------------------------------------------------------

//Function declarations------------------------------------------------------------
vec3 ComputeBarycentric (void);
vec3 ComputeBarycentric2 ();
bool GetAppearanceStateOnBit (lowp int bitIdx);
//---------------------------------------------------------------------------------

//Note: appearanceFlags is an integer that stores on/off states in its bits
//bit-0: mask(1)  Full color / monochrome 
//bit-1: mask(2)  Surface wireframe on/off
//bit-2: mask(4)  Surface seethru wireframe on/off
//bit-3: mask(8)  Surface edges on/off
//bit-4: mask(16) Responds to light
//Note: To set a bit perform a bitwise OR with the mask
//Note: To unset a bit perform a bitwise AND with the NOT mask
//Note: To test for a bit perform a bitwise AND with the mask

void main ()
{ 
	//Get the appearance flags -------------------
    bool respondsToLight = GetAppearanceStateOnBit(4);
	bool showWireframe   = GetAppearanceStateOnBit(1);
	bool isFullColor     = GetAppearanceStateOnBit(0);
	//--------------------------------------------
	
	vec4 monochromeColor = vec4(1.0,1.0,1.0,1.0);
	
    frVertexUV   = vertexUVcoord; //Directly pass to fragment shader
    frTexUnitIdx = vertexTexUnit; //Directly pass to fragment shader

    //Output vertex color to fragment shader
	if (!isFullColor) {frVertexColor = monochromeColor;}
    else if (defaultColor.x<0.0) {frVertexColor = vertexColor;} //If no default color is set, use per vertex colors
    else {frVertexColor = defaultColor;}
    
    //Output vertex light-intensity to fragment shader
    if (respondsToLight)
    {
        vec3  adjustedVertNormal = mat3(normalsMatrix) * vertexNormal;
        vec3  adjustedVertCoord  = mat3(normalsMatrix) * vec3(vertexCoord); //casting down vertexCoord from vec4 to vec3
        vec3  vertToLight        = lightPosition - adjustedVertCoord;

        float cosTheta           = dot ( normalize(vertToLight), normalize(adjustedVertNormal));
        float LightDistance      = length(vertToLight);

        frVertLightIntensity = lightIntensity * (1.0/pow(LightDistance,2.0)) * (1.0+cosTheta);
    }
    else
    {
        frVertLightIntensity = -1.0; //Signal the fragment shader not to use light intensity on this vertex
    }

	if (showWireframe) {frBaryCoord=ComputeBarycentric();} else {frBaryCoord=vec3(-10.0,-10.0,-10.0);}

    //Output vertex position to the graphics card
    gl_Position = projViewModelMatrix * vec4(vertexCoord.x, vertexCoord.y, vertexCoord.z ,1.0);

}

bool GetAppearanceStateOnBit (lowp int bitIdx)
{
	//There are no bitwise operators in this version of GLSL (need to compute manually)
	//Divide by a power of 2 (for the correspnding bit) and test for oddness. Odd = the bit is set
	
	float temp = (float(appearanceFlags / int(pow(2.0,float(bitIdx))) )) / 2.0;
	return (temp > float(int(temp)) )? true : false;
}

vec3 ComputeBarycentric2 ()
{
    return vec3(vertexCoord.w+1.0, 1.0/(vertexCoord.w+1.0), 1.0);
}

vec3 ComputeBarycentric ()
{   //Assign triangle vertices with predetermined weights (vec3)
	//This way during fragment shader interpolation it is possible to tell how close is the fragment to the edge
	
    //Note: This method fails if vertices are shared, since it is likely that two vertices will have the same barycentric 
	vec3 result;
	float  triangleVertIdx = mod( vertexCoord.w , 3.0); //This will result in 0,1, or 2

	if (triangleVertIdx<0.1) {result=vec3(0.0,1.0,0.0);} else if (triangleVertIdx<1.1){result=vec3(1.0,0.0,0.0);} else {result=vec3(0.0,0.0,1.0);}
	return result;
}
