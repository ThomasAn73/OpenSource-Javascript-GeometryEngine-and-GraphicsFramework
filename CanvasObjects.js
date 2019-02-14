//+++++++++++++++++++++++++++
//Author: Thomas Androxman
//Date  : Feb/2018
//+++++++++++++++++++++++++++
//Contains: TypeProgressBar, TypeCanvasText, TypeTextLabel, TypeCanvasWebGLpainter, TypeCanvas2Dpainter
//Depends on: BasicLib.js

//Global Functions-----------------------------------------------------------------------------------------------------------------------------------

function InitCanvas(CanvasHandleStr)
{   //Find the canvas element by its HTML ID and adjust the initial size of the canvas pixels to match the size of its box
    //Returns a canvas object not a context.

    //NOTE:
    //With canvas, there are two sets of dimensions a) the box dimensions, b) the pixel dimensions.
    //Usually, one or both of height/width are set in CSS and often set as 'inherit', but CSS only affects the box size causing the pixels of the canvas to stretch
    //Using the canvasOBJ.width and canvasOBJ.height it is possible to set the pixel dimentions to match the canvax box dimensions

    //Note: document.querySelector is considered more powerfull (?) and returns a static collection (at the moment the method was called)
    var canvasOBJ = document.getElementById(CanvasHandleStr); if (!canvasOBJ) {return;}
    var objStyle  = getComputedStyle(canvasOBJ); 
    var parStyle  = getComputedStyle(canvasOBJ.parentElement);
    
    canvasOBJ.width  = (objStyle.width  == "inherit") ? parseInt(parStyle.clientWidth) : parseInt(objStyle.width);
    canvasOBJ.height = (objStyle.height == "inherit") ? parseInt(parStyle.clientHeight): parseInt(objStyle.height);

    return canvasOBJ;
}

//===================================================================================================================================================
//Classes / Constructor-functions
//---------------------------------------------------------------------------------------------------------------------------------------------------

//NON KINEMATIC OBJECTS
//NOTE: The following objects interact directly with a 2D canvas context in a static way (they are not expected to have kinematic behaviors relative to a camera)
function TypeProgressBar (fromPoint, toPoint, width, barColor, backColor, outThickness, outColor)
{
    var barCoordinates;
    var barWidth;
    var outlineThickness;
    
    var activeColor;
    var backgroundColor;
    var outlineColor;
    
    var barVector;
    var progress;
    var timeStamp;
    
    //PRIVATE methods
    var Initialize = function (point0, point1, width, barColor, backColor, outThickness, outColor)
    {
        barCoordinates   = {fromPoint:(point0 instanceof TypeXYZw)? point0 : new TypeXYZw(point0), toPoint:(point1 instanceof TypeXYZw)? point1 : new TypeXYZw(point1)};
        barWidth         = Number(width);
        outlineThickness = (outThickness===void(0))? void(0) : Number(outThickness);
        
        activeColor      = (barColor instanceof TypeColor)? barColor : new TypeColor(barColor);
        backgroundColor  = (backColor instanceof TypeColor)? backColor : new TypeColor(backColor);
        outlineColor     = (outColor===void(0))? void(0) : (outColor instanceof TypeColor)? outColor : new TypeColor(outColor);
        
        barVector        = barCoordinates.toPoint.Minus(barCoordinates.fromPoint);
        progress         = 0;
        timeStamp        = 0;
    }
    
    //PUBLIC methods
    this.GetTimestamp = function ()           {return timeStamp;}
    this.SetProgress  = function (newRatio)   {progress  = ClipValue(newRatio,1,0);}
    this.SetTimestamp = function ()           {timeStamp = Date.now();}
    this.Draw         = function (ctx)
    {
        ctx.save();
        ctx.lineCap = 'round';
        
        //The background container
        if (outlineThickness!==void(0))
        {   //The outline
            ctx.beginPath(); 
            ctx.moveTo(barCoordinates.fromPoint.x, barCoordinates.fromPoint.y);
            ctx.lineWidth = barWidth+outlineThickness*2;
            ctx.lineTo(barCoordinates.toPoint.x, barCoordinates.toPoint.y);
            ctx.strokeStyle = outlineColor.GetCSScolor();
            ctx.stroke();
        }
        ctx.beginPath(); 
        ctx.moveTo(barCoordinates.fromPoint.x, barCoordinates.fromPoint.y);
        ctx.lineWidth = barWidth;
        ctx.lineTo(barCoordinates.toPoint.x, barCoordinates.toPoint.y);
        ctx.strokeStyle = backgroundColor.GetCSScolor();
        ctx.stroke();
        
        //The active bar
        var newToPoint = barCoordinates.fromPoint.Plus(barVector.ScaleBy(progress));
        ctx.beginPath();
        ctx.moveTo(barCoordinates.fromPoint.x, barCoordinates.fromPoint.y);
        ctx.lineWidth = barWidth;
        ctx.lineTo(newToPoint.x, newToPoint.y);
        ctx.strokeStyle = activeColor.GetCSScolor();
        ctx.stroke();
        
        ctx.restore();
    }
    
    //Initialization
    Initialize(fromPoint, toPoint, width, barColor, backColor, outThickness, outColor);
}
//---------------------------------------------------------------------------------------------------------------------------------------------------
function TypeCanvasText (thisText,txtSize,txtFont,atX,atY,txtColor,txtAlign,txtBase,useBack,backColor,padding)
{  
   this.textStr        = thisText;
   this.textSize       = txtSize;
   this.textFont       = txtFont;
   this.textColor      = new TypeColor(txtColor);
   this.textOscillator = new TypeOscillator();
   this.textAlign      = txtAlign;
   this.textBaseline   = txtBase;
   this.useBackground  = useBack;
   this.backColor      = new TypeColor(backColor);
   this.backPadding    = padding;
   this.position       = new TypeXYZw(atX,atY);
   this.kinematics     = new TypeKinematics(atX,atY); //Depracated

   //Methods
   this.SetDatumPos   = function (x,y,z) {this.kinematics.SetDatumPos(x,y,z);}
   this.Draw          = function (ctx)
   {
      //Setup the text font
      ctx.font        = this.textSize+"px "+this.textFont;
      ctx.textAlign   = this.textAlign;
      ctx.textBaseline= this.textBaseline;
     
      //Text rectangle coordinates
      var txtLen  = ctx.measureText(this.textStr).width;
      var textRectangle = [[this.kinematics.GetDatumPos().x,this.kinematics.GetDatumPos().y-1],[]];
      if (this.textAlign   =="center") textRectangle[0][0] -= txtLen/2;        else if (this.textAlign=="right") textRectangle[0][0] -= txtLen;
      if (this.textBaseline=="middle") textRectangle[0][1] += this.textSize/2; else if (this.textBaseline=="top") textRectangle[0][1] += this.textSize; 
      textRectangle[1] = [textRectangle[0][0]+txtLen,textRectangle[0][1]-this.textSize];
      
      //Display the background rounded rectangle
      if (this.useBackground = true)
      {
         ctx.beginPath();
         ctx.moveTo (textRectangle[0][0],textRectangle[0][1]+this.backPadding);
         ctx.lineTo (textRectangle[1][0],textRectangle[0][1]+this.backPadding);
         ctx.arcTo  (textRectangle[1][0]+this.backPadding,textRectangle[0][1]+this.backPadding,textRectangle[1][0]+this.backPadding,textRectangle[0][1],this.backPadding);
         ctx.lineTo (textRectangle[1][0]+this.backPadding,textRectangle[1][1]);
         ctx.arcTo  (textRectangle[1][0]+this.backPadding,textRectangle[1][1]-this.backPadding,textRectangle[1][0],textRectangle[1][1]-this.backPadding,this.backPadding);
         ctx.lineTo (textRectangle[0][0],textRectangle[1][1]-this.backPadding);
         ctx.arcTo  (textRectangle[0][0]-this.backPadding,textRectangle[1][1]-this.backPadding,textRectangle[0][0]-this.backPadding,textRectangle[1][1],this.backPadding);
         ctx.lineTo (textRectangle[0][0]-this.backPadding,textRectangle[0][1]);
         ctx.arcTo  (textRectangle[0][0]-this.backPadding,textRectangle[0][1]+this.backPadding,textRectangle[0][0],textRectangle[0][1]+this.backPadding,this.backPadding);
         ctx.closePath();
         ctx.fillStyle = this.backColor.GetCSScolor();
         ctx.fill();
      }

      //Display the text
      ctx.fillStyle   = GetCSScolor([this.textColor.GetR(),this.textColor.GetG(),this.textColor.GetB(),this.textColor.GetAlpha()*this.textOscillator.GetState()]);
      ctx.fillText(this.textStr, this.kinematics.GetDatumPos().x, this.kinematics.GetDatumPos().y);

   }
}

//---------------------------------------------------------------------------------------------------------------------------------------------------
//KINEMATIC OBJECTS
//NOTE: These objects are expected to be part of a scene in a kinematic environment and are drawn via the TypeCanvas2dPainter or TypeWebGlPainter objects
function TypeTextLabel (thisText,txtSize,txtFont,pos,txtColor,txtHorAlign,txtVerAlign,backColor,padding,isRounded)
{   //This is a text object with background fill (a label) that is used within a scene responding to a camera and kinematics
    var textObj;
    var textObjProp;
    var textOscillator; 

    var backFillObj;
    var backFillObjProp;

    var backPadding;
   
    var Initialize = function (thisText,txtSize,txtFont,plane,txtColor,txtHorAlign,txtVerAlign,backColor,padding,isRounded)
    {
        //Note: plane could be a TypeXYZw (a point) or a TypePlane
        //Note: the text size is in world coordinates
        //Note: padding is in world units
        
        //Argument gate
        if (isRounded===void(0)) {isRounded=true;}
        if (!IsString(thisText)) {thisText='';}
        if (!(plane instanceof TypePlane) && !(plane instanceof TypeXYZw))  {plane = new TypeXYZw(plane);} //Try to interpret it as a point first
        if (plane instanceof TypeXYZw) {plane = new TypePlane(plane,new TypeXYZw(plane.x+1,plane.y,plane.z),new TypeXYZw(plane.x,plane.y+1,plane.z));}
        if (isNaN(txtSize)) {txtSize = 0.2;}
        if (!IsString(txtHorAlign) || (txtHorAlign!='left' && txtHorAlign!='right' && txtHorAlign!='center')) {txtHorAlign = 'left';}
        if (!IsString(txtVerAlign) || (txtVerAlign!='bottom' && txtVerAlign!='middle' && txtVerAlign!='top')) {txtVerAlign = 'bottom';}
        if (backColor && !(backColor instanceof TypeColor))   {backColor = new TypeColor(backColor);}
        
        textObj         = new TypeText(thisText); textObj.SetPlane(plane);
        textObjProp     = new TypeTextProperties(textObj,txtFont,txtSize,txtHorAlign,txtVerAlign,txtColor); //targetTxt,fnt,sze,alU,alV,clr,outline,outlnProp
        textOscillator  = new TypeOscillator();

        if (!backColor) {return;} //If the text has no background fill then nothing else to do
        else {backPadding = (isNaN(padding))? 0 : padding;} 

        //The background fill for the text (the rectangle dimensions and orientation doesn't matter at the moment)
        var textFillBox = new TypeCurve(); //The text box rectangle outline 
        textFillBox.AddRectangle([0,0],[1,0],[0,1],backPadding); //The corner radius is as much as the padding
        
        backFillObj      = new TypeSurface();
        backFillObj.name = 'TextLabel fill';
        backFillObj.AddFillFromPlanarBoundary(textFillBox);
        
        backFillObjProp = new TypeSurfaceProperties(backFillObj);
        backFillObjProp.SetMaterial(new TypeLegacyMaterial()).SetColor(backColor);
        backFillObjProp.SetEdgeProperties(new TypeCurveProperties(textFillBox,void(0),0)); //Note: typeCurveProperties args (targetCrv,crvColor, crvThickness, crvDashPattern)
 
        UpdateFillBox(); //Fits the dimensions of the fill box to the length of the text string
    }
    var ChangeText      = function (newText)  {textObj.SetText(newText); UpdateFillBox();}
    var ChangeTextColor = function (newColor) {textObjProp.SetColor(newColor);}
    var UpdateFillBox = function ()
    {   //This method will resize the fill box to the dimensions of the text string assuming the font is monospace
        if (!backFillObj) {return;} //If the text has no background fill, there is nothing to do
        
        var textDim    = new TypeXYZw(textObj.GetText().length*txtSize*0.6,txtSize); //assume text is monospace
        var offsetVec  = new TypeXYZw(); 
        var alignment  = textObjProp.GetAlignment();
        var boundCurve = backFillObj.GetBoundaryCurves()[0];

        if (alignment.horizontal=='center') {offsetVec = offsetVec.Minus(textObj.GetPlane().GetUnitU().ScaleBy(textDim.x/2 + backPadding));} 
        if (alignment.horizontal=='right')  {offsetVec = offsetVec.Minus(textObj.GetPlane().GetUnitU().ScaleBy(textDim.x + backPadding));} 
        if (alignment.horizontal=='left')   {offsetVec = offsetVec.Minus(textObj.GetPlane().GetUnitU().ScaleBy(backPadding));} 
        if (alignment.vertical  =='middle') {offsetVec = offsetVec.Minus(textObj.GetPlane().GetUnitV().ScaleBy(textDim.y/2 + backPadding*0.5));} 
        if (alignment.vertical  =='top')    {offsetVec = offsetVec.Minus(textObj.GetPlane().GetUnitV().ScaleBy(textDim.y + backPadding));}
        if (alignment.vertical  =='bottom') {offsetVec = offsetVec.Minus(textObj.GetPlane().GetUnitV().ScaleBy(backPadding*0.5));} 
        
        var pointLL    = textObj.GetPlane().GetA().Plus(offsetVec);
        var pointLR    = pointLL.Plus(textObj.GetPlane().GetUnitU().ScaleBy(textDim.x+backPadding*2));
        var pointTL    = pointLL.Plus(textObj.GetPlane().GetUnitV().ScaleBy(textDim.y+backPadding*2));
        //Explicitly set each coordinate in order to preserve the 'w' value
        boundCurve.GetVertex(0).SetX(pointLL.x).SetY(pointLL.y).SetZ(pointLL.z);
        boundCurve.GetVertex(1).SetX(pointLR.x).SetY(pointLR.y).SetZ(pointLR.z);
        boundCurve.GetVertex(2).SetX(pointTL.x).SetY(pointTL.y).SetZ(pointTL.z);
    }
    
    //Public methods
    this.GetOscillator     = function () {return textOscillator;}
    this.GetTextObject     = function () {return textObj;}
    this.GetTextString     = function () {return textObj.GetText();}
    this.GetTextProperties = function () {return textObjProp;}
    this.GetTextColor      = function () {return textObjProp.GetColor();}
    this.GetFillColor      = function () {return backFillObjProp.GetColor();}
    this.GetTextFill       = function () {return backFillObj;}
    this.GetFillProperties = function () {return backFillObjProp;}
    
    this.SetText           = function (newText)  {ChangeText(newText);}
    this.SetTextColor      = function (newColor) {ChangeTextColor(newColor);}
    this.UpdateFill        = function ()         {UpdateFillBox();}
   
   //Initialization
   Initialize(thisText,txtSize,txtFont,pos,txtColor,txtHorAlign,txtVerAlign,backColor,padding,isRounded);
}

//---------------------------------------------------------------------------------------------------------------------------------------------------
//CANVAS PAINTER OBJECTS (these are the main interfaces for rendering a scene to canvas2D or WebGL)
//---------------------------------------------------------------------------------------------------------------------------------------------------
function TypeCanvasWebGLpainter (scene,canvasIdString,vertexShaderPath,fragmentShaderPath)
{   //This object takes a scene and draws it on the given canvas via WebGL
    //This object is permanently linked to a scene because it keeps track of OpenGL buffers for the scene objects and textures
    //Note: A canvas element can only have one context (either 2d, or webgl). You cannot switch contexts midway.
    //Note: With webGL (for any change) everything on screen is cleared and then redrawn from scratch for each frame

    //PRIVATE properties ------------------
    var sourceScene;      //The TypeScene object to read geometry from
    var targetCanvas;     //The target HTML canvas object to output the geometry
    
    var currentCamera;
    
    var glSceneObjects  = []; //Holds information (buffer handles etc) for each scene object
    var glSceneTextures = []; //Holds information (buffer handles etc) for each texture
    var glTrivialTextureBfr;  //A gl buffer object. Something to point the texture-unit to when no textures are needed
    var lastModified;         //An object that holds GLobject and GLtexture array universal modifaction dates
    
    var webGL;            //The canvas context object
    var glShaderProgram;  //The compiled shader program
    var glShaderVar;      //Holds the IDs of all shader variables. Used to communicate with the shaders
    
    //Note: It is possible for both isReady and isFailed to be false -> when something is still loading
    var isReady  = false; //initialization flag
    var isFailed = false; //initialization flag
    
    const appearanceMask = 
    {
        showFullColor:1,
        showWireframe:2,
        seeThruWireframe:4,
        showEdges:8,
        respondsToLight:16
    };
    
    //-------------------------------------
    //PRIVATE methods ---------------------
    //-------------------------------------
    var SetFailed  = function () {isReady=false; isFailed=true;}
    var SetReady   = function () {isReady=true; isFailed=false;}
    
    var Initialize = function (sScene, canvasStr, vShaderPath, fShaderPath)
    {
        //Argument checks
        var foundCanvas = InitCanvas(canvasStr); 
        if (!foundCanvas) {Say('WARNING (TypeCanvasWebGLpainter) Did not find canvas element:<'+canvasStr+'> in the document',-1); SetFailed(); return;}
        if (!(sScene instanceof TypeScene)) {Say('WARNING (TypeCanvasWebGLpainter) Did not receive a valid scene object',-1); SetFailed(); return;}
        
        //Initialize properties
        sourceScene   = sScene;
        targetCanvas  = foundCanvas;
        currentCamera = sourceScene.GetCamera(); //A camera is guaranteed to exist
        lastModified  = {glObjects:0,glTextures:0,draw:0};
       
        //Note: allowable contexts ['webgl','experimental-webgl','webgl2']
        //Note: alloweable attributes ['alpha','depth','stencil','antialias','premultipliedAlpha','preserveDrawingBuffer','failIfMajorPerformanceCaveat']
        
        //Create a canvas context (basically select which engine will be driving the canvas)
        var contextType = 'webgl'; //This painter object only deals with webGL (a 2D canvas would be a separate painter object)
        webGL = targetCanvas.getContext(contextType); if (!webGL) {webGL = targetCanvas.getContext('experimental-webgl');}
        if (!webGL) {Say('WARNING (TypeCanvasWebGLpainter) Could not initialize <'+contextType+'> context',-1); SetFailed(); return;}
    
        //Note: A frame buffer is that which contains the display pixel colors
        //Note: depth buffer - without a depth buffer things are displayed by order of drawing them (A further away object drawn later will display over a closer object)
        //Note: Images typically have 0,0 at TopLeft. WebGL assumes 0,0 at bottom left unless pixelStorei is used to flip the Y axis
        
        //Setup some initial webGL states (webGL is a state machine)
        webGL.enable(webGL.DEPTH_TEST); //things are now drawn based on depth regardless of the order they were drawn
        webGL.enable(webGL.BLEND);      //this option enables transparency/blending effects
        webGL.blendFunc(webGL.SRC_ALPHA, webGL.ONE_MINUS_SRC_ALPHA); //blend function when source is not premultiplied alpha
        webGL.clearColor(1.0, 1.0, 1.0, 1.0); //Clear screen
        webGL.pixelStorei(webGL.UNPACK_FLIP_Y_WEBGL, true); //Set once globally to always flip the Y axis of images (see note above). 
        //Note: Line width is depracated. The WebGL specification now defines that gl.lineWidth() does not change the line width anymore.
        
        //Note: webGL will initialize webGL.viewport to the dimensions of the 'foundCanvas'
        //It is important that the camera aspect ratio matches the viewport's
        currentCamera.SetViewport(foundCanvas.width,foundCanvas.height);

        //Setup a trivial texture using a single pixel
        glTrivialTextureBfr = webGL.createTexture(); 
        webGL.bindTexture(webGL.TEXTURE_2D, glTrivialTextureBfr);
        webGL.texImage2D(webGL.TEXTURE_2D, 0, webGL.RGBA, 1, 1, 0, webGL.RGBA, webGL.UNSIGNED_BYTE, new Uint8Array([0, 255, 0, 255]) );
        //Note: Arguments for--> void gl.texImage2D(target, level, internalformat, width, height, border, format, type, ArrayBufferView? pixels);
        //Note: Alternate    --> void gl.texImage2D(target, level, internalformat, format, type, HTMLImageElement? pixels);
        
        //Import the shader files
        var vertexShaderFile   = new TypeFile ( (!IsString(vShaderPath))? 'WebglVertexShader.glsl' : vShaderPath); 
        var fragmentShaderFile = new TypeFile ( (!IsString(fShaderPath))? 'WebglFragmentShader.glsl' : fShaderPath);
        InstallShaders (vertexShaderFile,fragmentShaderFile); //Compile the shader program using the two shader files

        //Note: webGL.getAttribLocation will be used to access the attribute variables of the shader
        //Note: webGL.getUniformLocation will be used to access the uniform variables of the shader
    }
    var InstallShaders = function (vertFile, fragFile)
    {   //Helper function for Initialize()
        //This method acts directly on the glShaderProgram parameter
        //Reads the shader source code into gl shader objects and then compiles them and links them into shader program

        //Note: setTimeout accepts arguments in the form of (function, intervalTime, param1, param2, param3, ....). The params are passed to the function as arguments
        if (vertFile.IsStillLoading() || fragFile.IsStillLoading()) {setTimeout(InstallShaders,100,vertFile, fragFile); return;} 
        
        if (vertFile.IsFailed()) {Say('WARNING (InstallShaders) Failed to load the vertex shader file <'+vertFile.GetFilePath()+'>',-1);return;}
        if (fragFile.IsFailed()) {Say('WARNING (InstallShaders) Failed to load the fragment shader file <'+fragFile.GetFilePath()+'>',-1);return;}
        
        var glVertexShader   = ReadShader (webGL.VERTEX_SHADER,vertFile.GetDataAsText()); if (isFailed) {return;}
        var glFragmentShader = ReadShader (webGL.FRAGMENT_SHADER,fragFile.GetDataAsText()); if (isFailed) {return;}
        glShaderProgram      = webGL.createProgram(); //Create an empty webGL shader program object

        webGL.attachShader(glShaderProgram, glVertexShader);   //attach the vertex shader
        webGL.attachShader(glShaderProgram, glFragmentShader); //attach the fragment shader
        webGL.linkProgram(glShaderProgram);

        //Note: webGL.getAttachedShaders(glShaderProgram); would return an Array of glShader objects attached to it
        //Note: feeding each glShader object to webGL.getShaderSource(shader); will return the source code for that 
        //Note: The shader source text is retained inside the glShaderProgram object

        //Error check
        if (!webGL.getProgramParameter(glShaderProgram, webGL.LINK_STATUS)) 
        {   //getProgramParameter returns a boolean for LINK_STATUS
            Say('WARNING (InstallShaders) Link error '+webGL.getProgramInfoLog(glShaderProgram),-1); 
            webGL.deleteProgram(glShaderProgram);
            glShaderProgram = void(0);
            SetFailed ();
            return;
        }
        webGL.useProgram(glShaderProgram);
        ConnectToShaderVariables();
        SetReady(); Say ('NOTE: (InstallShaders) Shader program installed with no errors',-1);
    }
    var ReadShader = function (shaderType, shaderText)
    {   //Helper function for InstallShaders-->Initialize
        //Transfer the shader text data into a WebGL shader object.
        var glShader = webGL.createShader (shaderType); //create an empty shader object in the webGL
        webGL.shaderSource(glShader, shaderText);       //Load the shader text data into the glShader object
        webGL.compileShader(glShader);
        
        //Error check
        if (!webGL.getShaderParameter(glShader, webGL.COMPILE_STATUS)) 
        {   //getShaderParameter returns a boolean for COMPILE_STATUS
            Say('WARNING (ReadShader) Compile error with <'+( (shaderType==webGL.VERTEX_SHADER)? 'Vertex shader' : 'Fragment shader' )+'> '+webGL.getShaderInfoLog(glShader),-1); 
            webGL.deleteShader(glShader); 
            SetFailed ();
            return;
        }
        return glShader;
    }
    var ConnectToShaderVariables = function ()
    {   //Helper function for InstallShaders--Initialize
        //These variables are expected (otherwise things break)
        
        //Note: glsl will not connect variables which did not seem to be used in the code during compile
        glShaderVar = 
        {
            //Uniforms (common to both shaders)
            appearanceFlags:    webGL.getUniformLocation(glShaderProgram, 'appearanceFlags'),     //int
            //Uniforms (vertexShader)
            projViewModelMatrix:webGL.getUniformLocation(glShaderProgram, 'projViewModelMatrix'), //mat4
            normalsMatrix:      webGL.getUniformLocation(glShaderProgram, 'normalsMatrix'),       //mat4
            defaultColor:       webGL.getUniformLocation(glShaderProgram, 'defaultColor'),        //vec4
            lightColor:         webGL.getUniformLocation(glShaderProgram, 'lightColor'),          //vec4
            lightPosition:      webGL.getUniformLocation(glShaderProgram, 'lightPosition'),       //vec3
            lightIntensity:     webGL.getUniformLocation(glShaderProgram, 'lightIntensity'),      //float
            //Attributes (vertexShader)
            vertexCoord:        webGL.getAttribLocation(glShaderProgram, 'vertexCoord'),          //vec3
            vertexColor:        webGL.getAttribLocation(glShaderProgram, 'vertexColor'),          //vec4
            vertexNormal:       webGL.getAttribLocation(glShaderProgram, 'vertexNormal'),         //vec3
            vertexUVcoord:      webGL.getAttribLocation(glShaderProgram, 'vertexUVcoord'),        //vec2
            vertexTexUnit:      webGL.getAttribLocation(glShaderProgram, 'vertexTexUnit'),        //flat
            //Uniforms (fragmentShader)
            useTextures:        webGL.getUniformLocation(glShaderProgram, 'useTextures'),         //bool
            wireframeColor:     webGL.getUniformLocation(glShaderProgram, 'wireframeColor'),      //vec4
            ambientColor:       webGL.getUniformLocation(glShaderProgram, 'ambientColor'),        //vec4
            ambientIntensity:   webGL.getUniformLocation(glShaderProgram, 'ambientIntensity'),    //float
            textureUnit:        webGL.getUniformLocation(glShaderProgram, 'textureUnit')          //sampler2D (GLint) array. This gets the ID of the first element
        };
    }
    var GenerateApearanceFlagsInt = function (ObjAppearance)
    {   //Creates an integer whose bits are treated as booleans for various appearance options
        //Note this is done because space is limited at the shader level (booleans take unnecessary space)
        
        //bit-0: mask(1)  Full color / monochrome 
        //bit-1: mask(2)  Surface wireframe on/off
        //bit-2: mask(4)  Surface seethru wireframe on/off
        //bit-3: mask(8)  Surface edges on/off
        //bit-4: mask(16) Responds to light
        var sceneAppearance = sourceScene.GetDefaultAppearance();
        var result = 0;
        
        //Note: To set a bit perform a bitwise OR with the mask
        //Note: To unset a bit perform a bitwise AND with the NOT mask
        //Note: To test for a bit perform a bitwise AND with the mask
        var showFullColor    = ObjAppearance.GetShowFullColor();    if (   showFullColor===void(0)) {showFullColor = sceneAppearance.GetShowFullColor();}          
        var showWireframe    = ObjAppearance.GetShowWireframe();    if (   showWireframe===void(0)) {showWireframe = sceneAppearance.GetShowWireframe();}          
        var seeThruWireframe = ObjAppearance.GetSeeThruWireframe(); if (seeThruWireframe===void(0)) {seeThruWireframe = sceneAppearance.GetSeeThruWireframe();} 
        var showEdges        = ObjAppearance.GetShowEdges();        if (       showEdges===void(0)) {showEdges = sceneAppearance.GetShowEdges();}                      
        var respondsToLight  = ObjAppearance.GetRespondsToLight();  if ( respondsToLight===void(0)) {respondsToLight = sceneAppearance.GetRespondsToLight();}    
        
        if (showFullColor)    {result |=  appearanceMask.showFullColor;}    else {result &=  ~appearanceMask.showFullColor;}
        if (showWireframe)    {result |=  appearanceMask.showWireframe;}    else {result &=  ~appearanceMask.showWireframe;}
        if (seeThruWireframe) {result |=  appearanceMask.seeThruWireframe;} else {result &=  ~appearanceMask.seeThruWireframe;}
        if (showEdges)        {result |=  appearanceMask.showEdges;}        else {result &=  ~appearanceMask.showEdges;}
        if (respondsToLight)  {result |=  appearanceMask.respondsToLight;}  else {result &=  ~appearanceMask.respondsToLight;}
    
        return result;
    }
    var SetupShaderVarsForLights = function ()
    {
        //Will handle the ambient light and only one scene light in this version (this should change in the future)
        let currentCam = sourceScene.GetCamera();
        let oneSceneLight = sourceScene.GetLight(0); if (!oneSceneLight.GetIsActive()) {return;}
        let lightPos = oneSceneLight.GetPosition().GetCopy();
                
        if (oneSceneLight.GetIsRelativeToCam())
        {
            let camZ = currentCam.GetEyePos().Minus(currentCam.GetTargetPos());
            let lightPosZ = camZ.ResizeTo(lightPos.z);
            let lightPosY = currentCam.GetUpDirection().AsOrthoTo(camZ).ResizeTo(lightPos.y);
            let lightPosX = camZ.CrossProduct(currentCam.GetUpDirection()).ResizeTo(lightPos.x);
            lightPos = lightPosX.Plus(lightPosY).Plus(lightPosZ).Plus(currentCam.GetEyePos());
        }
 
        webGL.uniform3fv (glShaderVar.lightPosition, new Float32Array(lightPos.GetAsArray(3)) ); //Sending a vec3
        webGL.uniform4fv (glShaderVar.lightColor, new Float32Array(oneSceneLight.GetColor().GetArrRGB()) ); //Use 4fv because we are dealing with a float vec4 in form of an array
        webGL.uniform1f  (glShaderVar.lightIntensity, oneSceneLight.GetIntensity()); //Use 1f because we are dealing with a single float
        webGL.uniform4fv (glShaderVar.ambientColor, new Float32Array(sourceScene.GetAmbientLight().color.GetArrRGB()) ); //Sending a vec4
        webGL.uniform1f  (glShaderVar.ambientIntensity, sourceScene.GetAmbientLight().intensity); //Sending a float
    
    }
    //INTERMEDIATE step methods. (prepare the data from sceneObject geometry) -------------------
    //-------------------------------------------------------------------------------------------
    var MakeGLsceneObject = function (scnObj)
    {   //This function creates and returns a new object (to eventually be stored in the GLsceneObjects array)
        
        var parentSceneObj = scnObj.GetParent(); //Find if this scnObj is the child of something else
        var parentGLobj = (parentSceneObj!==void(0))? glSceneObjects[ sourceScene.GetSceneObject(parentSceneObj,true) ] : void(0);

        resultObj = 
        {
            sceneObj:scnObj,                //holds the corresponding geometry object from the target scene's objects[] array
            parentGLsceneObj:parentGLobj,   //holds the parent GL object from the glSceneObjects[] array
            lastModified:Date.now(),
            srfVertBuffer:void(0),
            srfIndexBuffer:void(0),         //Which indexes from the vertex buffer to use to draw the triangles of the mesh
            srfNormBuffer:void(0),
            srfUvBuffer:void(0),
            srfColorBuffer:void(0),
            srfTextureUnitBuffer:void(0),   //Holds indexes from the srfTextureArr[], which itself holds indexes from the glSceneTextures array
            srfTexturesLog:[],              //Holds indexes of the glSceneTextures array (glSceneTextures is synchronous to sceneTextures). The textures used by an object is a subset of all the textures in the scene
            crvPolylineVertBuffer:void(0),
            crvPolylineColorBuffer:void(0),
            crvLinepileVertBuffer:void(0),
            crvLinepileColorBuffer:void(0)
        };
        //Note: srfTextureUnitBuffer is a Vertex-to-textureUnit relationship buffer (associates each vertex with a number from 0-8; up to 8 texture units)
        //Note: srfTexturesArr holds references to GLtexture objects (from the glSceneTextures array) used in this particular scene object
        return Object.seal(resultObj); //Sealed objects do not allow properties to be added later
    }
    var MakeGLtextureObject = function (sceneTextureObj)
    {   //This function returns an object for the glSceneTextures array
        resultObj = 
        {
            sceneTxtr:sceneTextureObj,
            lastModified:Date.now(),
            txtrBuffer:webGL.createTexture()
        };
        return Object.seal(resultObj); //Sealed objects do not allow properties to be added later
    }
    var GenerateBuffers = function ()
    {   //Generates buffers for the entire scene
        //These are techinically called VBOs

        //Has anything changed in the entire scene ?
        if (sourceScene.GetAnyLookLastModified()<=GetAnyLookLastModified()) {return;} //Nothing to do
    
        //Generate texture buffers
        if (sourceScene.GetTexturesLastModified()>lastModified.glTextures) {GenerateTextureBuffers();}
        
        //Generate scene object buffers
        if (sourceScene.GetObjectsLastModified()>lastModified.glObjects) {GenerateObjectBuffers();}
        
        //Note: A Vertex Buffer Object (VBO) is a memory buffer in the high speed memory of your video card designed to hold information about vertices. 
        //for example we could have two VBOs, one that describes the coordinates of our vertices and another that describes the color associated with each vertex. 
        //VBOs can also store information such as normals, texcoords, indicies, etc.
        
        //Note: In WebGL 2.0 there are also Vertex Array Objects.
        //A Vertex Array Object (VAO) is an object which contains one or more Vertex Buffer Objects and is designed to store the information for a complete rendered object. 
        //So in this case all the buffers used to render a single 'sceneObject' would be in a single VAO
    }
    var GenerateObjectBuffers = function ()
    {   //Helper function for GenerateBuffers (buffers for the sceneObjects)
        var sceneObjectCount = sourceScene.GetObjectCount();
        for (let i=0;i<sceneObjectCount;i++)
        {   //Walk through each sceneObject
            let oneGLobject;
            let oneSceneObject = sourceScene.GetSceneObject(i); //This is a TypeSceneObject object
            
            //Preliminary checks -------------------------------------
            //Handle a missmatch, probably due to a deleted sceneObject causing the glSceneObjects array to be out of sync
            if (glSceneObjects[i] && glSceneObjects[i].sceneObj != oneSceneObject) {ResetCrvGLbuffers(glSceneObjects[i]); ResetSrfGLbuffers(glSceneObjects[i]); glSceneObjects[i]=void(0);} 
            
            if (glSceneObjects[i] && oneSceneObject.GetLastModified()<=glSceneObjects[i].lastModified) {continue;} //No update needed for this specific scene object
            if (glSceneObjects[i]) {oneGLobject = glSceneObjects[i];} //if reached here, scene object has been updated. Buffers need to reload
            else {oneGLobject = MakeGLsceneObject(oneSceneObject); glSceneObjects[i]=oneGLobject;} //Wrap the scene object into a new GLsceneObject
            //--------------------------------------------------------
                        
            //Define temporary 1D arrays (that will disapear once this method is done) for the current scene object, which will be used later to fill the buffers.
            //Note: A sceneObject may contain pieces that are either surface objects or curve objects. Each sceneObject needs buffers for both surfaces and curves
            
            //Note: This surfaceArrays portion uses an index array and will proceed through gl.drawElements
            let surfaceArrays = 
            {
                sourceSceneObj : oneSceneObject,
                vertexArrIdxBookmark : 0, //Bookmark indicating the index of the vertex array that represents the 'zero' index of the current surface.
                vertexArr1D : [],
                indexArr1D : [],
                normalsArr1D : [],
                UVarr1D : [],
                colorArr1D : [],
                textureUnitsArr1D : [],   //per vertex indexes from the texturesLog
                texturesLog : [],         //The subset of scene textures used by this sceneObject
                useDefaultMat : true      //ignore colorArr1D if non of the surfaces had a custom material assigned; or the ones that did was only for texture
            };
            //Note: About the vertexArrIdxBookmark -->
            //--> Inside a sceneObject there are pieces (surfaces or curves)
            //--> the vertices of all surface pieces will pile on a single GL vertex buffer, but they are represented autonomously inside the sceneObject (their vertex arrays start from zero)
            //--> a running bookmark is needed that marks which index of the GL vertex buffer pile is the 'zero' index of the current piece (surface) object
            
            //Note: This curveArrays portion does *not* use an index array and will pass through gl.drawArrays linearly
            let curveArrays = 
            {
                sourceSceneObj : oneSceneObject,
                polylineVertexArr1D : [],
                polylineColorArr1D : [],
                linepileVertexArr1D : [],
                linepileColorArr1D : [],
                useDefaultMat : true      //ignore colorArr1D if non of the curve objects had a custom material assigned
            };
            
            //Loop through all the pieces of the current sceneObject to generate flat array data
            //Note: surfaceArrays and curveArrays started empty and will get filled with data from scratch in the for-loop below
            let pieceCount = oneSceneObject.GetPieceCount();
            for (let j=0;j<pieceCount;j++)
            {   //Walk though each piece
                let onePiece = oneSceneObject.GetPiece(j); //This could be a surface or a curve
                let onePieceProperties = oneSceneObject.GetPropertiesForPiece(j,true); //either a TypeSurfaceProperties or a TypeCurveProperties
                if (onePieceProperties && !onePieceProperties.GetIsVisible()) {continue;} //If the object is declared as non-visible, skip it.
                
                if (onePiece instanceof TypeSurface) {PrepareSurfaceArrays(surfaceArrays, onePiece, onePieceProperties);}
                else if (onePiece instanceof TypeCurve) {PrepareCurveArrays(curveArrays, onePiece, onePieceProperties);}
            }
            
            //Transfer the generated array data (from the for-loop above) into the webGL buffers. 
            //Note: Non-visible pieces did not add their data to the temporary surface or curve arrays
            TransferSceneObjectSrfToWebGL (oneGLobject, surfaceArrays); //The surfaces of the sceneObject
            TransferSceneObjectCrvToWebGL (oneGLobject, curveArrays);   //The curves of the sceneObject
        }
    }
    var PrepareCurveArrays = function (curveArrays, thisCurve, crvProperties)
    {   //Helper function for GenerateObjectBuffers-->GenerateBuffers
        //Tranfer curve data from the sceneObject to 1D curve arrays (depending on curve type)
        //Note: This is an intermediate step before passing data into webGL buffers

        let crvColor = (crvProperties)? crvProperties.GetColor() : void(0);
        if (crvColor) {curveArrays.useDefaultMat=false;} //crvProperties!=void(0) means this curve has custom color and thus at least one curve in the sceneObject has custom color
        
        //Note: crvColor could be void(0) and have to fall back to thisCurve default material which could be void(0) and have to fall back to the scene default material
        if (!crvColor) {crvColor=(curveArrays.sourceSceneObj.GetDefaultMaterial())? curveArrays.sourceSceneObj.GetDefaultMaterial().GetColor() : void(0);}
        if (!crvColor) {crvColor=sourceScene.GetDefaultMaterial().GetColor();} //This guaranteed to exist
        
        let crvType = thisCurve.GetType();
        if      (crvType == 'Polyline')      {TransferPolylineToArr1D(curveArrays, thisCurve, crvColor);}
        else if (crvType == 'Line')          {TransferLinepileToArr1D(curveArrays, thisCurve, crvColor);}
        else if (crvType == 'Interpolated' 
              || crvType == 'Ngon')          {TransferComputedCrvToArr1D (curveArrays, thisCurve, crvColor);}
        else {Say('WARNING (PrepareCurveArrays) Curve type <'+crvType+' is not currently supported.',-1);}
    }
    var TransferPolylineToArr1D = function (curveArrays, thisCurve, crvColor)
    {    //Helper function for PrepareCurveArrays-->GenerateObjectBuffers-->GenerateBuffers
        let vertCount = thisCurve.GetVertexCount(); if (vertCount==0) {return;}
        for (let i=0;i<vertCount;i++)
        {   //Walk through each vertex
            let oneVertex = thisCurve.GetVertex(i); //a TypeXYZw object
            curveArrays.polylineVertexArr1D.push(oneVertex.x, oneVertex.y, oneVertex.z, oneVertex.w); //Add vertex
            curveArrays.polylineColorArr1D.push(crvColor.GetR(), crvColor.GetG(), crvColor.GetB(), crvColor.GetAlpha()); //Add color
        }
        //Polyline termination
        //Note: A sceneObject can have multiple polyline pieces. Once these pieces pile up in a buffer we can no longer tell where one begins and another ends
        //Note: Adding an invalid point (NaN,NaN,NaN) will cause the webGL draw function to not draw that segment (leaving a gap)
        curveArrays.polylineVertexArr1D.push(NaN,NaN,NaN,NaN); //Termination point
        curveArrays.polylineColorArr1D.push(NaN,NaN,NaN,NaN);  //Color for the termination point
    }
    var TransferLinepileToArr1D = function (curveArrays, thisCurve, crvColor)
    {   //Helper function for PrepareCurveArrays-->GenerateObjectBuffers-->GenerateBuffers
        let vertCount = thisCurve.GetVertexCount(); if (vertCount==0) {return;}
        for (let i=0;i<vertCount;i++)
        {   //Walk through each vertex
            let oneVertex = thisCurve.GetVertex(i); //a TypeXYZw object
            curveArrays.linepileVertexArr1D.push(oneVertex.x, oneVertex.y, oneVertex.z, oneVertex.w); //Add vertex
            curveArrays.linepileColorArr1D.push(crvColor.GetR(), crvColor.GetG(), crvColor.GetB(), crvColor.GetAlpha()); //Add color
        }
        //Linepiles do not need termination. Two linepiles combined is still a linepile
    }
    var TransferComputedCrvToArr1D = function (curveArrays, thisCurve, crvColor)
    {   //Helper function for PrepareCurveArrays-->GenerateObjectBuffers-->GenerateBuffers
    
        //Treat the interpolated curve a polyline approximation
        let computedPolyline = thisCurve.GetComputedVertArr(); //returns an array of TypeXYZw
        let vertCount = computedPolyline.length;
        for (let i=0;i<vertCount;i++)
        {   //Walk through each vertex
            let oneVertex = computedPolyline[i];
            curveArrays.polylineVertexArr1D.push(oneVertex.x, oneVertex.y, oneVertex.z, oneVertex.w); //Add vertex
            curveArrays.polylineColorArr1D.push(crvColor.GetR(), crvColor.GetG(), crvColor.GetB(), crvColor.GetAlpha()); //Add color
        }
        //Polyline termination
        curveArrays.polylineVertexArr1D.push(NaN,NaN,NaN,NaN); //Termination point
        curveArrays.polylineColorArr1D.push(NaN,NaN,NaN,NaN);  //Color for the termination point
    }
    var PrepareSurfaceArrays = function (surfaceArrays, thisSurface, srfProperties)
    {   //Helper function for GenerateObjectBuffers-->GenerateBuffers
        //Determine the current material (fall back to the scene default if necessary)
        //Note: There is a difference between surface properties and a material (surface properties contains a material, but also contains normals and UVs)
        let currentSrfProperties = (srfProperties)? srfProperties : new TypeSurfaceProperties (thisSurface);
        let currentSrfMaterial = currentSrfProperties.GetMaterial(); //Look for a material at the local properties level
        if (currentSrfMaterial && !currentSrfMaterial.GetTexture()) {surfaceArrays.useDefaultMat=false;} //this surface has custom color (we have a material without a texture), so a color array will be used in the entire scene object
        if (!currentSrfMaterial) {currentSrfMaterial = surfaceArrays.sourceSceneObj.GetDefaultMaterial();} //Fall back to the sceneObject
        if (!currentSrfMaterial) {currentSrfMaterial = sourceScene.GetDefaultMaterial();} //Fall back to the scene. At this point a material is guaranteed
        
        //Determine the texture unit for the texture used in this surface
        //Note: Will be computing texture units on the fly (one surface at a time)
        //Note: A texture unit is an index of the textureLog which contains an index of the sceneTextures array 
        //Note: A texture unit will later be linked to a buffer object in the glTexturesArray (which is synchronized with the scene textures array)
        let currentSrfTextureObj = currentSrfMaterial.GetTexture();
        let currentSrfSceneTextureIdx = sourceScene.GetTexture(currentSrfTextureObj,true); //returns the index of the current surface's texture within the main scene's texture array (or void if not found).
        let currentTextureUnit = (currentSrfSceneTextureIdx!==void(0))? surfaceArrays.texturesLog.indexOf(currentSrfSceneTextureIdx) : void(0); //Try to find the current scene's texture index within texturesLog.
        //Note: there is a difference between no (void) texture unit and non-found (-1)
        if (currentTextureUnit<0) {surfaceArrays.texturesLog.push(currentSrfSceneTextureIdx); currentTextureUnit = surfaceArrays.texturesLog.length-1;} //If not found, then add it.
        else if (currentTextureUnit===void(0)) {currentTextureUnit=-1;} //A value of -1 signals the shader not to use texture on that vertex

        //Note: Normals and textureUVs are guaranteed to exist as objects (even if their arrays are empty [])
        let currentSrfNormals = currentSrfProperties.GetNormals(); if (currentSrfNormals.GetNormalsCount()<thisSurface.GetVertexCount()) {currentSrfNormals.GenerateNormals();}
        let currentSrfUVs     = currentSrfProperties.GetTextureUVs();
        let currentColor      = currentSrfMaterial.GetColor();
      
        //Loop through the vertices of the current surface
        let vertCount = thisSurface.GetVertexCount();
        for (let i=0;i<vertCount;i++)
        {   //Walk through each vertex
            let oneVertex = thisSurface.GetVertex(i);
            let oneNormal = currentSrfNormals.GetNormalAtVertex(i);
            let oneTextureUV = currentSrfUVs.GetUVatVertex(i); if (!oneTextureUV) {oneTextureUV = {x:NaN,y:NaN}; }
            
            //Add data to the arrays synchronously
            surfaceArrays.vertexArr1D.push(oneVertex.x, oneVertex.y, oneVertex.z, surfaceArrays.vertexArrIdxBookmark + i); //Pass the vertex index on the w component to be available to the shader for effects
            surfaceArrays.normalsArr1D.push(oneNormal.x, oneNormal.y, oneNormal.z); //The normals array
            surfaceArrays.UVarr1D.push(oneTextureUV.x, oneTextureUV.y); //The UVs array only has x,y coordinates
            surfaceArrays.colorArr1D.push(currentColor.GetR(), currentColor.GetG(), currentColor.GetB(), currentColor.GetAlpha()); //The colors array is of type R,G,B,A
            surfaceArrays.textureUnitsArr1D.push(currentTextureUnit); //The texture unit array
        }
        
        //Handle the index array
        let meshSize = thisSurface.GetMeshSize();
        for (let i=0;i<meshSize;i++)
        {   //Walk through the surface mesh (which contains vertex indexes)
            //Note: The zero vertex of thisSurface is the vertexArrIdxBookmark vertex in vertexArr1D
            let oneIndex = surfaceArrays.vertexArrIdxBookmark + thisSurface.GetMeshValue(i); //Each mesh value is an index of a vertex in the vertex array 
            surfaceArrays.indexArr1D.push(oneIndex); //The index array (contains indegers)
        }
        
        //Update the vertex bookmark
        //Note: vertexArr1D is a flat array. One vertex takes three indexes. This bookmark counts the actual vertices within vertexArr1D 
        surfaceArrays.vertexArrIdxBookmark += vertCount; //No need to multiply by three
    }
    //FINAL step methods. (interact with webGL) -------------------------------------------------
    //-------------------------------------------------------------------------------------------
    var GenerateTextureBuffers = function ()
    {   //Helper function for GenerateBuffers
        //Goes through all scene textures and updates the buffers if necessary
        var sceneTextureCount = sourceScene.GetTextureCount();
        for (let i=0;i<sceneTextureCount;i++)
        {
            let oneGLtextureObject;
            let oneSceneTxtr = sourceScene.GetTexture(i); //This is a TypeImage object
            
            //Preliminary checks
            if (glSceneTextures[i] && oneSceneTxtr.GetLastModified()<=glSceneTextures[i].lastModified) {continue;} //No update needed for this specific texture buffer
            if (glSceneTextures[i]) {oneGLtextureObject=glSceneTextures[i];} //SceneTexture has been updated. Buffer needs to reload
            else {oneGLtextureObject = MakeGLtextureObject(oneSceneTxtr); glSceneTextures[i]=oneGLtextureObject;} //Wrap the scene texture into a new GL texture object
            
            //Note: Transferring data to an existing buffer will override the old data in the buffer (no need to delete)
            TransferImageToWebGL (oneGLtextureObject);
        }
    }
    var TransferImageToWebGL = function (glTextureObject)
    {    //Helper function for GenerateTextureBuffers-->GenerateBuffers 
        //This method loads the sceneTexture into the webGL buffer asynchronously

        if (glTextureObject.sceneTxtr.IsStillLoading()) {setTimeout(TransferImageToWebGL,500); return;}
        if (glTextureObject.sceneTxtr.IsFailed()) {return;}
        
        webGL.bindTexture(webGL.TEXTURE_2D, glTextureObject.txtrBuffer); //Make this particular texture buffer 'current' in webGL
        //Note: Arguments for gl.texImage2D(gl.TEXTURE_2D, level(=0), internalFormat(=gl.RGBA), srcFormat(=gl.RGBA), srcType(=gl.UNSIGNED_BYTE), HTMLimageObject);
        webGL.texImage2D(webGL.TEXTURE_2D, 0, webGL.RGBA, webGL.RGBA, webGL.UNSIGNED_BYTE,glTextureObject.sceneTxtr.GetImageObj()); //Load the data into the buffer
        
        //Note: You can not generate a mipmap for a non-power-of-2 texture in WebGL1.0
        //Note: mipmaps is the practice of generating (internally) multiple sizes of the same texture and using them depending on magnification (to avoid zooming artifacts)
        
        //Treat the current texture binding as non power of two texture 
        webGL.texParameteri(webGL.TEXTURE_2D, webGL.TEXTURE_MAG_FILTER, webGL.LINEAR);
        webGL.texParameteri(webGL.TEXTURE_2D, webGL.TEXTURE_MIN_FILTER, webGL.LINEAR);
        webGL.texParameteri(webGL.TEXTURE_2D, webGL.TEXTURE_WRAP_S, webGL.CLAMP_TO_EDGE);
        webGL.texParameteri(webGL.TEXTURE_2D, webGL.TEXTURE_WRAP_T, webGL.CLAMP_TO_EDGE);
        
        glTextureObject.lastModified = Date.now(); //for the texture buffer itself
        lastModified.glTextures      = Date.now(); //for the texture array
    }
    var TransferSceneObjectCrvToWebGL = function (sceneObjectGLbuffers, crvArrays)
    {    //Helper function for GenerateObjectBuffers-->GenerateBuffers
        TranferSceneObjectPolylinesToWebGL (sceneObjectGLbuffers, crvArrays);
        TranferSceneObjectLinepilesToWebGL (sceneObjectGLbuffers, crvArrays);
    }
    var TranferSceneObjectPolylinesToWebGL = function (sceneObjectGLbuffers, crvArrays)
    {   //Helper function for TransferSceneObjectCrvToWebGL-->GenerateObjectBuffers-->GenerateBuffers
        let polylineVertCount = crvArrays.polylineVertexArr1D.length/4;
        if (polylineVertCount==0) {EmptyDataFromGLbuffer (sceneObjectGLbuffers, 'crvPolylineVertBuffer'); return;}
        
        //Transfer the POLYLINE vertices
        if (sceneObjectGLbuffers.parentGLsceneObj!==void(0)) {sceneObjectGLbuffers.crvPolylineVertBuffer = sceneObjectGLbuffers.parentGLsceneObj.crvPolylineVertBuffer; }
        else {LoadDataToGLbuffer (sceneObjectGLbuffers, 'crvPolylineVertBuffer', webGL.ARRAY_BUFFER, new Float32Array(crvArrays.polylineVertexArr1D), polylineVertCount, 4); }
        
        //Transfer the POLYLINE colors
        if (crvArrays.useDefaultMat==false) {LoadDataToGLbuffer (sceneObjectGLbuffers, 'crvPolylineColorBuffer', webGL.ARRAY_BUFFER, new Float32Array(crvArrays.polylineColorArr1D), polylineVertCount, 4);} 
        else {EmptyDataFromGLbuffer (sceneObjectGLbuffers, 'crvPolylineColorBuffer'); }
    }
    var TranferSceneObjectLinepilesToWebGL = function (sceneObjectGLbuffers, crvArrays)
    {   //Helper function for TransferSceneObjectCrvToWebGL-->GenerateObjectBuffers-->GenerateBuffers
        let linepileVertCount = crvArrays.linepileVertexArr1D.length/4;
        if (linepileVertCount==0) {EmptyDataFromGLbuffer (sceneObjectGLbuffers, 'crvLinepileVertBuffer'); return;}
        
        //Transfer the LINEPILE vertices
        if (sceneObjectGLbuffers.parentGLsceneObj!==void(0)) {sceneObjectGLbuffers.crvLinepileVertBuffer = sceneObjectGLbuffers.parentGLsceneObj.crvLinepileVertBuffer; }
        else {LoadDataToGLbuffer (sceneObjectGLbuffers, 'crvLinepileVertBuffer', webGL.ARRAY_BUFFER, new Float32Array(crvArrays.linepileVertexArr1D), linepileVertCount, 4); }
        
        //Transfer the LINEPILE colors
        if (crvArrays.useDefaultMat==false) {LoadDataToGLbuffer (sceneObjectGLbuffers, 'crvLinepileColorBuffer', webGL.ARRAY_BUFFER, new Float32Array(crvArrays.linepileColorArr1D), linepileVertCount, 4);} 
        else {EmptyDataFromGLbuffer (sceneObjectGLbuffers, 'crvLinepileColorBuffer'); }
    }
    var TransferSceneObjectSrfToWebGL = function (sceneObjectGLbuffers, srfArrays)
    {   //Helper function for GenerateObjectBuffers-->GenerateBuffers
        let vertCount = srfArrays.vertexArr1D.length/4;
        if (vertCount==0) {ResetSrfGLbuffers(sceneObjectGLbuffers); return;} //There are no surfaces in this sceneObject
        if (srfArrays.indexArr1D.length==0) {Say('WARNING: (TransferSceneObjectSrfToWebGL) A surface had no index array',-1); return;} //A surface will not draw without an index array
        
        //Note: If a buffer already exists and we call webGL.bufferData on it a second time, the old data is deleted by webGL
        //Note: Float32Array and Uint16Array are Javascript typed-array objects
        
        //Transfer the vertex and index arrays
        if (sceneObjectGLbuffers.parentGLsceneObj!==void(0)) 
        {   //If this is a child object re-use the parent vertex buffer data (no need to make new memory for it)
            sceneObjectGLbuffers.srfVertBuffer  = sceneObjectGLbuffers.parentGLsceneObj.srfVertBuffer;
            sceneObjectGLbuffers.srfIndexBuffer = sceneObjectGLbuffers.parentGLsceneObj.srfIndexBuffer;
        }
        else
        {   //This is not a child object. New buffer memory is needed
            LoadDataToGLbuffer (sceneObjectGLbuffers, 'srfVertBuffer',  webGL.ARRAY_BUFFER, new Float32Array(srfArrays.vertexArr1D), vertCount, 4); //Transfer the surface vertices
            LoadDataToGLbuffer (sceneObjectGLbuffers, 'srfIndexBuffer', webGL.ELEMENT_ARRAY_BUFFER, new Uint16Array(srfArrays.indexArr1D), srfArrays.indexArr1D.length, 1); //Transfer the index array
        }
        
        //Transfer the normals
        LoadDataToGLbuffer (sceneObjectGLbuffers, 'srfNormBuffer',  webGL.ARRAY_BUFFER, new Float32Array(srfArrays.normalsArr1D), vertCount, 3); //Transfer the normals

        //Transfer the colors
        if (srfArrays.useDefaultMat==false) { LoadDataToGLbuffer (sceneObjectGLbuffers, 'srfColorBuffer', webGL.ARRAY_BUFFER, new Float32Array(srfArrays.colorArr1D), vertCount, 4); } 
        else {EmptyDataFromGLbuffer (sceneObjectGLbuffers, 'srfColorBuffer');}
        
        //Transfer the UVs and texture units (only if textures are being used at all by this scene object)
        if (srfArrays.texturesLog.length>0)
        {
            LoadDataToGLbuffer (sceneObjectGLbuffers, 'srfUvBuffer', webGL.ARRAY_BUFFER, new Float32Array(srfArrays.UVarr1D), vertCount, 2); //The UVs
            LoadDataToGLbuffer (sceneObjectGLbuffers, 'srfTextureUnitBuffer', webGL.ARRAY_BUFFER, new Uint16Array(srfArrays.textureUnitsArr1D), vertCount, 1); //The texture units
        } 
        else 
        {   //Things changed. Delete the buffer object if it exists
            EmptyDataFromGLbuffer (sceneObjectGLbuffers, 'srfUvBuffer');
            EmptyDataFromGLbuffer (sceneObjectGLbuffers, 'srfTextureUnitBuffer');
        }
        
        //Transfer the texture log
        sceneObjectGLbuffers.srfTexturesLog = srfArrays.texturesLog; 
    }
    var LoadDataToGLbuffer = function (thisGLsceneObject, thisProperty, thisBufferType, thisTypedArray, unitCount, arrUnitSize)
    {   //Helper function for the Transfer-to-webGL functions
    
        //Note: Buffer types are webGL.ARRAY_BUFFER, webGL.ELEMENTS_BUFFER
        //Note: Float32Array and Uint16Array are Javascript typed-array objects
        
        //Note: in webGL (or OpenGL) buffers are just arrays in memory (this memory could be anywhere, GPU or CPU, decided by the system, the browser etc)
        //Note: once you create a buffer (an array of data in memory) you can link it to a built-in webGL portal by using a "bind" function
        //Note: For example for webGL to read vertex data you need to bind/link your buffer (with the data you loaded to it) to the gl.ARRAY_BUFFER dock using the gl.bindBuffer method
        //Note: You can continuously dock and undock your buffers from webGL
        
        //Note: If a buffer already exists and we call webGL.bufferData on it a second time, the old data is deleted by webGL
        if (thisGLsceneObject[thisProperty]===void(0)) {thisGLsceneObject[thisProperty] = {obj:webGL.createBuffer(), length:unitCount, unitSize:arrUnitSize};} //Create the buffer object
        webGL.bindBuffer(thisBufferType, thisGLsceneObject[thisProperty].obj); //Dock it to thisBufferType
        webGL.bufferData(thisBufferType, thisTypedArray, webGL.STATIC_DRAW);   //Send data to thisBufferType (which is directed to our buffer object)
        thisGLsceneObject.lastModified = lastModified.glObjects = Date.now();  //Buffer has been modified
    }
    var EmptyDataFromGLbuffer = function (thisGLsceneObject, thisProperty) 
    { 
        if (thisGLsceneObject[thisProperty]===void(0)) {return;}
        webGL.deleteBuffer(thisGLsceneObject[thisProperty].obj); 
        thisGLsceneObject[thisProperty]=void(0); 
        thisGLsceneObject.lastModified = lastModified.glObjects = Date.now();  //Buffer has been modified
    }
    var ResetCrvGLbuffers = function (sceneObjectGLbuffers)
    {
        EmptyDataFromGLbuffer (sceneObjectGLbuffers, 'crvPolylineVertBuffer');
        EmptyDataFromGLbuffer (sceneObjectGLbuffers, 'crvPolylineColorBuffer');
        EmptyDataFromGLbuffer (sceneObjectGLbuffers, 'crvLinepileVertBuffer');
        EmptyDataFromGLbuffer (sceneObjectGLbuffers, 'crvLinepileColorBuffer');
    }
    var ResetSrfGLbuffers = function (sceneObjectGLbuffers)
    {
        EmptyDataFromGLbuffer (sceneObjectGLbuffers, 'srfVertBuffer');
        EmptyDataFromGLbuffer (sceneObjectGLbuffers, 'srfIndexBuffer');
        EmptyDataFromGLbuffer (sceneObjectGLbuffers, 'srfNormBuffer');
        EmptyDataFromGLbuffer (sceneObjectGLbuffers, 'srfUvBuffer');
        EmptyDataFromGLbuffer (sceneObjectGLbuffers, 'srfColorBuffer');
        EmptyDataFromGLbuffer (sceneObjectGLbuffers, 'srfTextureUnitBuffer');        
        if (sceneObjectGLbuffers.srfTexturesLog.length>0) {sceneObjectGLbuffers.srfTexturesLog=[];}
    }
    var DrawPolylines = function (currentGLsceneObj, sceneDefaultAppearance, currentObjAppearance) 
    {   //Helper function for the main Draw()
        if (!currentGLsceneObj.crvPolylineVertBuffer) {return;} //Nothing to do
    
        let defaultCrvColor  = currentObjAppearance.GetCurveColor(); if (defaultCrvColor===void(0)) {defaultCrvColor = sceneDefaultAppearance.GetCurveColor();}
        let shaderDefaultColor = (currentGLsceneObj.crvPolylineColorBuffer)? [-1,0,0,1] : defaultCrvColor.GetArrRGB(); //if there is a color buffer no default color is needed
        
        webGL.uniform4fv (glShaderVar.defaultColor, new Float32Array(shaderDefaultColor)); //passing a float vec4
        
        ConnectShaderAttributeToBuffer (currentGLsceneObj.crvPolylineVertBuffer,  glShaderVar.vertexCoord, webGL.FLOAT, false, 0, 0); 
        ConnectShaderAttributeToBuffer (currentGLsceneObj.crvPolylineColorBuffer, glShaderVar.vertexColor, webGL.FLOAT, false, 0, 0); 
        
        //Note: DrawArrays is a DrawElements with linear indices (0, 1, 2, 3, ...)
        webGL.bindBuffer (webGL.ARRAY_BUFFER, currentGLsceneObj.crvPolylineVertBuffer.obj );
        webGL.drawArrays (webGL.LINE_STRIP, 0, currentGLsceneObj.crvPolylineVertBuffer.length);
    }
    var DrawLinepiles = function (currentGLsceneObj, sceneDefaultAppearance, currentObjAppearance) 
    {   //Helper function for the main Draw()
        if (!currentGLsceneObj.crvLinepileVertBuffer) {return;} //Nothing to do
    
        let defaultCrvColor  = currentObjAppearance.GetCurveColor(); if (!defaultCrvColor) {defaultCrvColor = sceneDefaultAppearance.GetCurveColor();}
        let shaderDefaultColor = (currentGLsceneObj.crvLinepileColorBuffer)? [-1,0,0,1] : defaultCrvColor.GetArrRGB(); //if there is a color buffer no default color is needed
        
        webGL.uniform4fv (glShaderVar.defaultColor, new Float32Array(shaderDefaultColor)); //passing a float vec4
    
        ConnectShaderAttributeToBuffer (currentGLsceneObj.crvLinepileVertBuffer,  glShaderVar.vertexCoord, webGL.FLOAT, false, 0, 0); 
        ConnectShaderAttributeToBuffer (currentGLsceneObj.crvLinepileColorBuffer, glShaderVar.vertexColor, webGL.FLOAT, false, 0, 0); 
        
        webGL.bindBuffer (webGL.ARRAY_BUFFER, currentGLsceneObj.crvLinepileVertBuffer.obj );
        webGL.drawArrays (webGL.LINES, 0, currentGLsceneObj.crvLinepileVertBuffer.length);    
    }
    var DrawSurfaceEdges = function (currentGLsceneObj, sceneDefaultAppearance, currentObjAppearance, appearanceFlags)
    {
        //... to do ...
    }
    var DrawSurfaces = function (currentGLsceneObj ,sceneDefaultAppearance, currentObjAppearance, objTextureCount, appearanceFlags)
    {   //Helper function for Draw()
        if (!currentGLsceneObj.srfIndexBuffer) {return;} //Nothing to do
        
        let monochromeColor     = new TypeColor(1.0,1.0,1.0,1.0,1.0);
        let showInFullColor     = (appearanceFlags & appearanceMask.showFullColor) ? true : false;
        let defaultSrfColor     = (!showInFullColor)? monochromeColor : currentObjAppearance.GetColor(); if (defaultSrfColor===void(0)) {defaultSrfColor = sceneDefaultAppearance.GetColor();}
        let shaderDefaultColor  = (currentGLsceneObj.srfColorBuffer)? [-1,0,0,1] : defaultSrfColor.GetArrRGB(); //if there is a color buffer no default color is needed
        
        webGL.uniform4fv (glShaderVar.defaultColor, new Float32Array(shaderDefaultColor));  //passing data to the shader variable (float vec4 defaultColor)
        //Note: There is no glPolygonMode in webGL. Wireframes must be shown manually
        
        //Assign texture buffers to texture units
        for (let j=0; j<objTextureCount; j++)
        {
             webGL.activeTexture(webGL.TEXTURE0 + j); //Select a texture unit (webgl 1.0 guarantees at least 8)
             webGL.bindTexture(webGL.TEXTURE_2D, glSceneTextures[ currentGLsceneObj.srfTexturesLog[j] ].txtrBuffer ); //Dock our texture buffer to webGL.TEXTURE_2D to become unit webGL.TEXTURE0 + j
        }
        
        //Tell the shader attributes how to get data to draw surfaces
        //Note: Attributes are the variables in the shaders that automatically zip through the buffer data one by one during a draw call
        //Note: The attributes are connected ONLY if the buffer actually exists (has data)
        ConnectShaderAttributeToBuffer (currentGLsceneObj.srfVertBuffer,        glShaderVar.vertexCoord,   webGL.FLOAT, false, 0, 0); 
        ConnectShaderAttributeToBuffer (currentGLsceneObj.srfNormBuffer,        glShaderVar.vertexNormal,  webGL.FLOAT, false, 0, 0); 
        ConnectShaderAttributeToBuffer (currentGLsceneObj.srfColorBuffer,       glShaderVar.vertexColor,   webGL.FLOAT, false, 0, 0); 
        ConnectShaderAttributeToBuffer (currentGLsceneObj.srfUvBuffer,          glShaderVar.vertexUVcoord, webGL.FLOAT, false, 0, 0); 
        ConnectShaderAttributeToBuffer (currentGLsceneObj.srfTextureUnitBuffer, glShaderVar.vertexTexUnit, webGL.SHORT, false, 0, 0); 
                    
        //Draw the surface using the elements array            
        webGL.bindBuffer (webGL.ELEMENT_ARRAY_BUFFER, currentGLsceneObj.srfIndexBuffer.obj );
        webGL.drawElements (webGL.TRIANGLES, currentGLsceneObj.srfIndexBuffer.length, webGL.UNSIGNED_SHORT, 0);
        
        //CleanUp
        webGL.disableVertexAttribArray(glShaderVar.vertexNormal);  //disconnect this shader variable
        webGL.disableVertexAttribArray(glShaderVar.vertexColor);   //disconnect this shader variable
        webGL.disableVertexAttribArray(glShaderVar.vertexUVcoord); //disconnect this shader variable
        webGL.disableVertexAttribArray(glShaderVar.vertexTexUnit); //disconnect this shader variable
    }
    var ConnectShaderAttributeToBuffer = function (thisBuffer, thisAttribLocation, dataType, doNormalize, stride, offset)
    {   //Helper function for the DRAW functions
        if (thisBuffer===void(0) || thisAttribLocation<0) {return;}
        if (doNormalize===void(0)) {doNormalize = false;}
        if (stride===void(0)) {stride = 0;}
        if (offset===void(0)) {offset = 0;}
        //Note: glEnableVertexAttribArray enables the generic vertex attribute array specified by index.
        //Note: By default, all client-side capabilities are disabled, including all generic vertex attribute arrays.
        //Note: If enabled, the values in the generic vertex attribute array will be accessed and used for rendering when calls are made to glDrawArrays or glDrawElements.
        webGL.bindBuffer(webGL.ARRAY_BUFFER, thisBuffer.obj);
        webGL.enableVertexAttribArray(thisAttribLocation);
        webGL.vertexAttribPointer(thisAttribLocation, thisBuffer.unitSize, dataType, doNormalize, stride, offset);
    }
    var GetAnyLookLastModified = function () { return (lastModified.glObjects>=lastModified.glTextures) ? lastModified.glObjects : lastModified.glTextures; }
        
    //-------------------------------------
    //PUBLIC methods ----------------------
    //-------------------------------------
    this.IsLoaded       = function ()   {return isReady;}
    this.IsFailed       = function ()   {return isFailed;}
    this.IsStillLoading = function ()   {return !(isReady || isFailed);}
    this.OperateCamera  = function (theMouseState)
    {   //This menthod controls viewport behavior
        if (!(theMouseState instanceof Object 
           && theMouseState.hasOwnProperty('delta') 
           && theMouseState.hasOwnProperty('buttonState') 
           && theMouseState.hasOwnProperty('specialKeys') )) {Say('WARNING: (OperateCamera) Did not receive a proper mouseState object',-1); return;}
        
        //Note: Expected layout for theMouseState.buttonState
        //bit-0:   (1) Left button
        //bit-1:   (2) Right button
        //bit-2:   (4) Middle button
        //bit-3:   (8) 4th button (typically, "Browser Back" button)
        //bit-4:  (16) 5th button (typically, "Browser Forward" button)
        
        //Note: Expected layout for theMouseState.specialKeys
        //bit-0:   (1) Ctrl key pressed
        //bit-1:   (2) Shift key pressed
        //bit-2:   (4) Alt key pressed
        //bit-3:   (8) Meta key pressed
        
        var isViewOrtho          = currentCamera.GetIsOrtho();
        var isShiftPressed       = theMouseState.specialKeys & 2;
        var isCtrlPressed        = theMouseState.specialKeys & 1;
        var isRightButtonPressed = theMouseState.buttonState & 2;
        var isLeftButtonPressed  = theMouseState.buttonState & 1;

        if (isLeftButtonPressed && !isViewOrtho && !isShiftPressed && !isCtrlPressed)
        {   //ROTATE view
            currentCamera.RotateX( 0.008*theMouseState.delta.y);
            currentCamera.RotateZ(-0.008*theMouseState.delta.x);
            sourceScene.SetMovementAsModified();
        }
        else if (isLeftButtonPressed && !isViewOrtho && isCtrlPressed)
        {   //ZOOM
            currentCamera.Zoom(-0.005*theMouseState.delta.y);
            sourceScene.SetMovementAsModified();
        }
        else if (isLeftButtonPressed && isViewOrtho && isShiftPressed)
        {   //PAN
            currentCamera.Move(theMouseState.delta.ScaleBy(-1), true);
            sourceScene.SetMovementAsModified();
        }
    }
    this.Draw = function (ignoreChangeFlag)
    {   //This methods is the bottom line. (What the client uses to actually show everything on screen)
            
        //Note: we want to minimize the use of draw calls to webGL.
        //Note: since each scene object acts as a unit (with a single transformation matrix), the goal is to have a single draw call per scene object, if possible
        //Note: since scene objects are composits (which may contain curves) and webGL cannot draw both curves and surfaces on a single call ...
        //Note: ... we have to split each scene-object into a surfaces call and a curves call (most scene objects will be either one or the other, rarely both)
        
        //Preliminary variables and checks
        if (!ignoreChangeFlag && lastModified.draw>sourceScene.GetMovementLastModified() && GetAnyLookLastModified()>sourceScene.GetAnyLookLastModified()) {return;} //Nothing has changed
        if (isFailed) {Say('WARNING: (Draw) TypeCanvasWebGLpainter object is in a failed state',-1); return;}
        if (!isReady) {Say('WARNING: (Draw) TypeCanvasWebGLpainter object is not ready to draw (the shaders are probably still loading)',-1); return;}
        
        let sceneObjCount  = sourceScene.GetObjectCount(); //if (sceneObjCount==0) {Say('WARNING: (Draw) The scene has no geometry to draw',-1);}
        let projViewMatrix = currentCamera.GetProjectionMatrix().MultiplyWith(currentCamera.GetViewMatrix()); //Note: ProjViewMatrix = ProjectionMatrix * ViewMatrix     
        let sceneDefaultAppearance = sourceScene.GetDefaultAppearance();
       
        //Handle the buffers
        GenerateBuffers(); //Makes sures the buffers are ready for drawing (Creates, updates, deletes buffers if necessary)

        //Update shader variables for lights
        SetupShaderVarsForLights(); //Lights are at the scene level.

        //Clear screen. Clear the canvas for the new frame.
        webGL.clear(webGL.COLOR_BUFFER_BIT | webGL.DEPTH_BUFFER_BIT); //Recommend to use before each frame if the whole screen is not covered with objects

        for (let i=0; i<sceneObjCount; i++)
        {   //Walk through each scene object

            //GENERAL portion -----------------------
            let currentSceneObject   = sourceScene.GetSceneObject(i);
            let currentGLsceneObj    = glSceneObjects[i];
            let currentObjAppearance = currentSceneObject.GetDefaultAppearance();
            let isVisible = currentObjAppearance.GetIsVisible(); if (isVisible===void(0)) {isVisible = sceneDefaultAppearance.GetIsVisible();}
            if (!isVisible) {continue;}
            
            //Face culling will reduce the GPU load by not showing back faces of objects
            //Poses a problem for simple surfaces. A sceneObject might contain a mix of volums or plain surfaces
            //if an object contains even a single open surface, then culling must be disabled even if we take a performance hit on the rest of the object
            if (currentSceneObject.HasOpenSurfaces()) {webGL.disable(webGL.CULL_FACE);}
            else
            {
                webGL.enable(webGL.CULL_FACE);  //enable face culling (hiding)
                webGL.cullFace(webGL.BACK);     //hide back faces (to ease some load from the GPU)
            }
            
            //Note: in the future if object grouping is implemented the model matrix needs to be multiplied with the group matrix at each group level
            //Note: the normals matrix is basically the model matrix inversed and transposed
            let modelMatrix      = currentSceneObject.GetKinematics().GetTmatrix();
            let normalsMatrix    = modelMatrix; 
            let pvmMatrix        = projViewMatrix.MultiplyWith(modelMatrix);
            let pvmMatrixTrnsp1D = new Float32Array(16); for (let i=0;i<16;i++) {pvmMatrixTrnsp1D[i] =     pvmMatrix.data[i%4][~~(i/4)];} //we are leaving ROW-major space
            let normMatrTrnsp1D  = new Float32Array(16); for (let i=0;i<16;i++) { normMatrTrnsp1D[i] = normalsMatrix.data[i%4][~~(i/4)];} //we are leaving ROW-major space
            let objTextureCount  = currentGLsceneObj.srfTexturesLog.length;
            let defaultWireColor = currentObjAppearance.GetWireframeColor(); if (defaultWireColor===void(0)) {defaultWireColor = sceneDefaultAppearance.GetWireframeColor();}
            let appearanceFlags  = GenerateApearanceFlagsInt (currentObjAppearance); //Appearance is at object level not surface level
        
            webGL.uniform1f        (glShaderVar.useTextures, (objTextureCount>0) );  //integer
            webGL.uniform1i        (glShaderVar.appearanceFlags, appearanceFlags );  //integer that stores on/off flags on its bits
            webGL.uniform4fv       (glShaderVar.wireframeColor, new Float32Array(defaultWireColor.GetArrRGB())); //passing a vec4
            webGL.uniformMatrix4fv (glShaderVar.projViewModelMatrix, false, pvmMatrixTrnsp1D);  //passing a mat4. Use 'false' because the matrix got transposed above already (we now enter COLUMN-major space) 
            webGL.uniformMatrix4fv (glShaderVar.normalsMatrix,       false, normMatrTrnsp1D);   //passing a mat4

            //Fill the fragment shader's textureUnit[6] array so that sampler2D textureUnit[0]=0 --> calls webGL.TEXTURE0 (same for webGL.TEXTURE1, etc)
            //Assign texture unit webGL.TEXTURE0 to the trivial texture (this way textureless objects will not generate errors)
            if (objTextureCount==0) {webGL.activeTexture(webGL.TEXTURE0); webGL.bindTexture(webGL.TEXTURE_2D, glTrivialTextureBfr);}
            let textureUnitAssignments=[0,0,0,0,0,0];                          //contains the texture unit index assignments the shader will be using
            for (let t=1;t<objTextureCount;t++) {textureUnitAssignments[t]=t;} //with multiple textures, sampler2D textureUnit[0]=0, textureUnit[1]=1, etc (one to one correspondence)
            webGL.uniform1iv  (glShaderVar.textureUnit, new Int32Array(textureUnitAssignments)); //assigning an array to the glShaderVar.textureUnit uniform

            //SURFACES portion draw call -----------------------
            DrawSurfaces(currentGLsceneObj ,sceneDefaultAppearance, currentObjAppearance, objTextureCount, appearanceFlags); //Draw the buffer

            //CURVES portion draw calls ------------------------
            DrawPolylines   (currentGLsceneObj, sceneDefaultAppearance, currentObjAppearance); //Draw the buffer
            DrawLinepiles   (currentGLsceneObj, sceneDefaultAppearance, currentObjAppearance); //Draw the buffer
            DrawSurfaceEdges(currentGLsceneObj, sceneDefaultAppearance, currentObjAppearance, appearanceFlags); //..to do ... surface edges should be a separate polylines buffer
        }
        lastModified.draw = Date.now();
        return true;
    }
    
    //Initialization
    Initialize(scene,canvasIdString,vertexShaderPath,fragmentShaderPath);
}
//---------------------------------------------------------------------------------------------------------------------------------------------------
function TypeCanvas2Dpainter (scene,canvasIdString,clearColor)
{   //This object sends scene geometry to a canvas 2d context
    //Note: A canvas element can only have one context (either 2d, or webgl). You cannot switch contexts midway.
    //Note: Once something is drawn on canvas it is just a pile of pixels that stays unless changed.
    //Note: Generally if the outline of an object is expected to move, it would require a scene redraw.

    //PRIVATE properties
    var sourceScene;      //The TypeScene object to read geometry from
    var targetCanvas;     //The target HTML canvas object to output the geometry
    
    var currentCamera;
    var zOrderedObjArr;   //Contains the sceneObjects sorted by z-depth
    var lastModified;     //An object with timestamps
    
    var canvas2D;         //The canvas context object
    var canvasBackColor;  //The color used for clearing the screen and as backdrop
    var isCanvasOpaque;
    var useClearScreen;   //Sometimes it is not necessary to clear the screen on each frame
    
    //Note: It is possible for both isReady and isFailed to be false -> when something is still loading
    var isReady  = false; //initialization flag
    var isFailed = false; //initialization flag

    //PRIVATE methods
    var SetFailed  = function () {isReady=false; isFailed=true;}
    var SetReady   = function () {isReady=true; isFailed=false;}
    
    var Initialize = function (sScene, canvasStr, cColor)
    {
        //Argument checks
        var foundCanvas = InitCanvas(canvasStr); 
        if (!foundCanvas) {Say('WARNING (TypeCanvas2Dpainter) Did not find canvas element:<'+canvasStr+'> in the document',-1); SetFailed(); return;}
        if (!(sScene instanceof TypeScene)) {Say('WARNING (TypeCanvas2Dpainter) Did not receive a valid scene object',-1); SetFailed(); return;}
        
        //Initialize properties
        lastModified    = {draw:0, zBuffer:0};
        sourceScene     = sScene;
        targetCanvas    = foundCanvas;
        currentCamera   = sourceScene.GetCamera(); //A camera is guaranteed to exist in the scene
        canvasBackColor = (cColor instanceof TypeColor)? cColor : (cColor!==void(0))? new TypeColor(cColor) : new TypeColor(255,255,255,1.0);
        isCanvasOpaque  = (canvasBackColor.GetAlpha()==1)? true : false;
        useClearScreen  = true;

        //Setup the camera
        currentCamera.SetViewTop();                //default to top view for canvas2D
        currentCamera.SetViewport(targetCanvas.width, targetCanvas.height); //make sure the camera aspect ratio matches the viewport's
        
        //Create a 2D canvas context (basically selecting which engine will be driving the canvas).
        var contextType       = '2d'; //used for the creation of a CanvasRenderingContext2D object -> https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D
        var contextAttributes = {alpha:(isCanvasOpaque)? false:true}; //{alpha:true/false} is the only allowed attribute. If 'false' the canvas backdrop itself will always be black opaque (anything inside canvas can still have alpha). 
        canvas2D = targetCanvas.getContext(contextType,contextAttributes);
        if (!canvas2D) {Say('WARNING (TypeCanvas2Dpainter) Could not initialize <'+contextType+'> context',-1); SetFailed(); return;}
        
        //Set CSS background color
        targetCanvas.style.backgroundColor=canvasBackColor.GetCSScolor(); //The canvas sits on top of a CSS style. The style color will show through (after a clearRect() call) when the canvas is transparent
        
        //Change the ready flag
        CheckReadiness();

        //Note: It would be tempting to have a paths buffer array that syncs with the sceneObjects array and stores path2D objects (and their properties) per sceneObject
        //Note: With a path2D buffer array it would be necessary to use the canvas transormation matrix for motion
        //Note: The canvas2D contaxt has a 3x3 transormation matrix and no z-depth is possible which would defeat the ability to show motion parallax
    }
    var CheckReadiness         = function ()
    {
        if (sourceScene.AreTexturesStillLoading()) {setTimeout(CheckReadiness,100); return;}
        SetReady();
    }
    var GenerateZdepthOrdering = function ()
    {
        //Has anything changed in the entire scene ?
        if (sourceScene.GetObjectsLastModified()<=lastModified.zBuffer) {return;} //Nothing to do
        
        zOrderedObjArr = []; //Make the zBuffer from scratch
      
        var objCount = sourceScene.GetObjectCount();
        for (let i=0; i<objCount; i++)
        {   //Walk through each sceneObject in the scene
            let oneSceneObj = sourceScene.GetSceneObject(i); //Get the object reference
            let oneZdepth   = oneSceneObj.GetZdepth();       //Get the object's Z-depth
            if (oneZdepth===void(0)) {continue;} //Only objects with a numberic Z-dpeth are allowed. Skip objects that are not parallel to the XY plane.
        
            //Push the object index into the zBuffer array (it is currently unsorted)
            zOrderedObjArr.push(i); //The zBuffer is an index array
        }
        
        //Sort the Z-buffer array.
        var compareZdepths = function (a, b) {var comp = sourceScene.GetSceneObject(a).GetZdepth() - sourceScene.GetSceneObject(b).GetZdepth(); return (comp!=0)? comp : a-b;} //Compare function for sort
        zOrderedObjArr.sort(compareZdepths); //if compareZdepths returns a negative then index 'a' goes first and the index 'b'
        
        lastModified.zBuffer = Date.now();
    }
    var ClearScreen = function ()
    {
        //clearRect sets all pixels to transparent (or black when opaque), erasing any previously drawn content.
        if (!isCanvasOpaque) {canvas2D.clearRect(0,0,targetCanvas.width,targetCanvas.height); return;}
        
        //When the canvas is opaque
        canvas2D.fillStyle = canvasBackColor.GetCSScolor(); 
        canvas2D.fillRect(0,0,targetCanvas.width,targetCanvas.height);
    }
    var DrawOneSceneObject = function (spvmMatrix,currentSceneObject,currentObjAppearance,sceneDefaultAppearance)
    {   //Helper method for Draw()
    
        var pieceCount = currentSceneObject.GetPieceCount();
        for (let i=0; i<pieceCount; i++)
        {   //Walk through each piece in the sceneObject
            let onePiece           = currentSceneObject.GetPiece(i);
            let onePieceProperties = currentSceneObject.GetPropertiesForPiece(i,true); //The pieceProperties (if this is a parent sceneObject), or the parent sceneObject's pieceProperties. 
            let isVisible          = (onePieceProperties)? onePieceProperties.GetIsVisible() : true;
       
            if (!isVisible) {continue;}
            if (onePiece instanceof TypeSurface) {canvas2D.beginPath(); let result = MakeSurfacePaths(spvmMatrix,onePiece,onePieceProperties,currentObjAppearance,sceneDefaultAppearance); if(result.useFill) {canvas2D.fill();} if(result.useStroke) {canvas2D.stroke();} continue;}
            if (onePiece instanceof TypeCurve)   {canvas2D.beginPath(); let result = MakeCurvePaths  (spvmMatrix,onePiece,onePieceProperties,currentObjAppearance,sceneDefaultAppearance); if(result) {canvas2D.stroke();} continue;}
            if (onePiece instanceof TypeText)    {MakeTexts (spvmMatrix,onePiece,onePieceProperties,currentObjAppearance,sceneDefaultAppearance); continue;}
        }
    }
    var MakeTexts       = function (spvmMatrix,onePiece,onePieceProperties,currentObjAppearance,sceneDefaultAppearance)
    {   //Helper method for DrawOneSceneObject-->Draw
        //Draws a text piece from inside the current sceneObject
       
        let defaultGlobalTxtProp = sceneDefaultAppearance.GetTextProperties(); //At the scene level the scene appearance object is guaranteed to have default values
        let defaultScnobjTxtProp = currentObjAppearance.GetTextProperties();    //At the sceneObject level there may or may not be a textProperties object defined
        
        let defGlobalOutlineProp = defaultGlobalTxtProp.GetOutlineProperties();
        let defSceObjOutlineProp = (defaultScnobjTxtProp && defaultScnobjTxtProp.GetOutlineProperties())? defaultScnobjTxtProp.GetOutlineProperties() : void(0);
        let onePieceOutlineProp  = (onePieceProperties && onePieceProperties.GetOutlineProperties())?  onePieceProperties.GetOutlineProperties() : void(0);

        let textStr     = onePiece.GetText();
        let textPlane   = onePiece.GetPlane();
        let wZeroToScr  = spvmMatrix.MultiplyWith([0,0,textPlane.GetA().z,1]).Homogeneous(); //Used to convert a world vector into a screen vector
        let align       = (onePieceProperties && onePieceProperties.GetAlignment())? onePieceProperties.GetAlignment() : (defaultScnobjTxtProp && defaultScnobjTxtProp.GetAlignment())? defaultScnobjTxtProp.GetAlignment() : defaultGlobalTxtProp.GetAlignment();
        let color       = (onePieceProperties && onePieceProperties.GetColor())? onePieceProperties.GetColor() : (defaultScnobjTxtProp && defaultScnobjTxtProp.GetColor())? defaultScnobjTxtProp.GetColor() : defaultGlobalTxtProp.GetColor();
        let font        = (onePieceProperties && onePieceProperties.GetFont())? onePieceProperties.GetFont() : (defaultScnobjTxtProp && defaultScnobjTxtProp.GetFont())? defaultScnobjTxtProp.GetFont() : defaultGlobalTxtProp.GetFont();
        let size        = (onePieceProperties && onePieceProperties.GetSize()!==void(0))? onePieceProperties.GetSize() : (defaultScnobjTxtProp && defaultScnobjTxtProp.GetSize()!==void(0))? defaultScnobjTxtProp.GetSize() : defaultGlobalTxtProp.GetSize();
        let isOutline   = (onePieceProperties && onePieceProperties.IsOutline()!==void(0))? onePieceProperties.IsOutline() : (defaultScnobjTxtProp && defaultScnobjTxtProp.IsOutline()!==void(0))? defaultScnobjTxtProp.IsOutline() : defaultGlobalTxtProp.IsOutline();
        
        let outWidth    = (onePieceOutlineProp && onePieceOutlineProp.GetThickness())? onePieceOutlineProp.GetThickness() : (defSceObjOutlineProp && defSceObjOutlineProp.GetThickness())? defSceObjOutlineProp.GetThickness() : defGlobalOutlineProp.GetThickness();
        let outColor    = (onePieceOutlineProp && onePieceOutlineProp.GetColor())? onePieceOutlineProp.GetColor() : (onePieceProperties && onePieceProperties.GetColor())? onePieceProperties.GetColor() : (defSceObjOutlineProp && defSceObjOutlineProp.GetColor())? defSceObjOutlineProp.GetColor() : defGlobalOutlineProp.GetColor();
        let outDashPtrn = (onePieceOutlineProp && onePieceOutlineProp.GetDashPattern())? onePieceOutlineProp.GetDashPattern() : (defSceObjOutlineProp && defSceObjOutlineProp.GetDashPattern())? defSceObjOutlineProp.GetDashPattern() : (defGlobalOutlineProp.GetDashPattern())? defGlobalOutlineProp.GetDashPattern() : [];
        
        let sizeVec     = new TypeXYZw(size); //size is in world units (default is 0.1)
        let sizePixels  = spvmMatrix.MultiplyWith(sizeVec).Homogeneous().Minus(wZeroToScr).GetMax();
        
        canvas2D.font         = sizePixels + 'px ' + font;
        canvas2D.textAlign    = align.horizontal;
        canvas2D.textBaseline = align.vertical;
        canvas2D.fillStyle    = color.GetCSScolor();
        canvas2D.strokeStyle  = outColor.GetCSScolor();
        canvas2D.lineWidth    = outWidth;
        canvas2D.setLineDash (outDashPtrn);
    
        let vecLLtoLR   = textPlane.GetB().Minus(textPlane.GetA());
        //let worldPos    = (align.horizontal=='left')? textPlane.GetA() : (align.horizontal=='right')? textPlane.GetB() : vecLLtoLR.ScaleBy(0.5).Plus(textPlane.GetA());
        let scrPos      = spvmMatrix.MultiplyWith(textPlane.GetA()).Homogeneous();
        let angle       = vecLLtoLR.AngleXY(); //Counterclockwise angle on world coordinates
  
        if (Math.abs(angle)>(pi/1800)) 
        {   //anything over a 10th of a degree is considered a rotation
            canvas2D.translate(scrPos.x,scrPos.y);
            canvas2D.rotate(-angle);  //must be negated for screen coordinates
            scrPos.x = scrPos.y = 0; //Since the canvas origin has already moved to this position the text will now be drawn at 0,0
        }
        
        //Note: The strokeText fillText methods are included here (breaking the pattern from makeCurves and makeSurfaces)
        //Note: strokeText and fillText do not pair with beginPath and they take coordinate arguments in them.
        if (isOutline) {canvas2D.strokeText(textStr,scrPos.x,scrPos.y);} else {canvas2D.fillText(textStr,scrPos.x,scrPos.y);}
        
        canvas2D.resetTransform(); //In case the canvas had to be rotated
    }
    var MakeCurvePaths  = function (spvmMatrix,onePiece,onePieceProperties,currentObjAppearance,sceneDefaultAppearance)
    {   //Helper method for DrawOneSceneObject-->Draw 
        //Helper method also for MakeSurfacePaths-->DrawOneSceneObject-->Draw
        //Draws a curve piece from inside the current sceneObject

        let wZeroToScr  = spvmMatrix.MultiplyWith([0,0,onePiece.GetZdepth(),1]).Homogeneous(); //Screen vector pointing to the world origin. Used as offset to convert other world vectors into screen vectors
        let worldToPix  = spvmMatrix.MultiplyWith([1,0,onePiece.GetZdepth(),1]).Homogeneous().Minus(wZeroToScr).x; //One world unit is so many pixels
        let curveType   = onePiece.GetType();

        //Draw on canvas depending on the current curve type
        if (curveType == 'Interpolated' || curveType == 'RegularNgon') 
        {   //------------------------------------------------
            
            let pathStart;
            let compVertArr = onePiece.GetComputedVertArr();
            let vertCount = compVertArr.length;
            for (let i=0; i<vertCount; i++)
            {   //Walk through all vertices in the computedArray and draw them as a polyline
                let oneVertex = spvmMatrix.MultiplyWith(compVertArr[i]).Homogeneous();
                if (oneVertex.IsNaN()) {pathStart = void(0); continue;} //Terminator before the next segment
                if (pathStart === void(0)) {pathStart = oneVertex; canvas2D.moveTo(pathStart.x, pathStart.y); continue;}

                canvas2D.lineTo(oneVertex.x, oneVertex.y);
            }
        }
        else if (curveType == 'Bezier') 
        {   //------------------------------------------------
    
            let pathStart;
            let vertCount = onePiece.GetVertexCount();
            for (let i=2; i<vertCount; i+=3)
            {   //Walk through all vertices three at the time
                let point0 = onePiece.GetVertex(i-2); if(point0.IsNaN()) {pathStart = void(0); i = i-2; continue;} else {point0 = spvmMatrix.MultiplyWith(point0).Homogeneous();} 
                let point1 = onePiece.GetVertex(i-1); if(point1.IsNaN()) {pathStart = void(0); i = i-1; continue;} else {point1 = spvmMatrix.MultiplyWith(point1).Homogeneous();}
                let point2 = onePiece.GetVertex(i-0); if(point2.IsNaN()) {pathStart = void(0); continue;} else {point2 = spvmMatrix.MultiplyWith(point2).Homogeneous();}
                
                if (pathStart = void(0)) {canvas2D.moveTo(point0.x, point0.y);}
                canvas2D.bezierCurveTo(point0.x, point0.y, point1.x, point1.y, point2.x, point2.y);
            }
        }
        else if (curveType == 'Rectangle') 
        {   //------------------------------------------------
            let vertCount = onePiece.GetVertexCount();
            for (let i=2; i<vertCount; i+=3)
            {   //Walk through all vertices three at the time
        
                //Geometry in world coordinates
                let pointLL    = onePiece.GetVertex(i-2);
                let pointLR    = onePiece.GetVertex(i-1);
                let vecLLtoLR  = pointLR.Minus(pointLL);
                let pointTop   = onePiece.GetVertex(i-0);
                let pointTL    = pointTop.Minus(pointLL).AsOrthoTo(vecLLtoLR).Plus(pointLL); //Orthogonalize
                let pointTR    = pointTL.Plus(vecLLtoLR);
                let vecLLtoTL  = pointTL.Minus(pointLL);
                let radius     = pointTop.w;                 //corner radius in world units
                let radiusVecV = vecLLtoTL.ResizeTo(radius); //A vector as long as 'radius' and parallel to the left side of the rectangle
                let tolerance  = pointLL.GetTolerance();

                //Geometry in screen coordinates
                pointLL = spvmMatrix.MultiplyWith(pointLL.GetCopy(3)).Homogeneous(); 
                pointLR = spvmMatrix.MultiplyWith(pointLR.GetCopy(3)).Homogeneous();
                pointTL = spvmMatrix.MultiplyWith(pointTL.GetCopy(3)).Homogeneous();
                pointTR = spvmMatrix.MultiplyWith(pointTR.GetCopy(3)).Homogeneous();
                
                //Handle sharp rectangles
                if (Math.abs(radius)<tolerance) 
                {   //Use lineTo(), since the rotation (if any) is already in the vertices
                    //Note: It is possible to use canvas2D.rect() but would require a canvas2D rotate, translate, resetTransformation, and two square roots: vecLLtoLR.Length(), vecLLtoTL.Length() 
                    canvas2D.moveTo(pointLL.x, pointLL.y);
                    canvas2D.lineTo(pointLR.x, pointLR.y); 
                    canvas2D.lineTo(pointTR.x, pointTR.y);
                    canvas2D.lineTo(pointTL.x, pointTL.y);
                    canvas2D.closePath();
                    continue;
                }
     
                //Handle rounded rectanges 
                radiusVecV     = spvmMatrix.MultiplyWith(radiusVecV).Homogeneous().Minus(wZeroToScr); //Convert the world vector into a screen vector
                radius         = radiusVecV.Length();                                                 //radius in screen units
                //Note: arcTo() takes three points: an implied first point (either from moveTo, or the previous arc end), a second point (sharp corner), and an end point
                canvas2D.moveTo(pointTL.x - radiusVecV.x, pointTL.y - radiusVecV.y);
                canvas2D.arcTo(pointLL.x, pointLL.y, pointLR.x, pointLR.y, radius);
                canvas2D.arcTo(pointLR.x, pointLR.y, pointTR.x, pointTR.y, radius);
                canvas2D.arcTo(pointTR.x, pointTR.y, pointTL.x, pointTL.y, radius);
                canvas2D.arcTo(pointTL.x, pointTL.y, pointTL.x - radiusVecV.x, pointTL.y - radiusVecV.y, radius);
            }
        }
        else if (curveType == 'Circle')
        {   //------------------------------------------------
            let vertCount = onePiece.GetVertexCount();
            for (let i=2; i<vertCount; i+=3)
            {
                let centerPoint = spvmMatrix.MultiplyWith(onePiece.GetVertex(i-2).GetCopy(3)).Homogeneous();
                let radiusPoint = spvmMatrix.MultiplyWith(onePiece.GetVertex(i-1).GetCopy(3)).Homogeneous();

                canvas2D.arc (centerPoint.x, centerPoint.y, radiusPoint.Minus(centerPoint).Length(),0,360*degToRad);
            }
        }
        else if (curveType == 'Ellipse')
        {   //------------------------------------------------
            let vertCount = onePiece.GetVertexCount();
            for (let i=2; i<vertCount; i+=3)
            {
                let centerPoint = spvmMatrix.MultiplyWith(onePiece.GetVertex(i-2).GetCopy(3)).Homogeneous();
                let radiusPoint = spvmMatrix.MultiplyWith(onePiece.GetVertex(i-1).GetCopy(3)).Homogeneous();
                let rudderPoint = spvmMatrix.MultiplyWith(onePiece.GetVertex(i-0).GetCopy(3)).Homogeneous();
                let radiusVec   = radiusPoint.Minus(centerPoint);
                let rudderVec   = rudderPoint.Minus(centerPoint);
                let rotation    = radiusVec.AngleXY();
                canvas2D.ellipse (centerPoint.x, centerPoint.y, radiusVec.Length(), rudderVec.Length(), rotation, 0, 360*degToRad);
            }
        }
        else if (curveType == 'Particle' || curveType == 'Point')
        {   //------------------------------------------------
            let vertCount = onePiece.GetVertexCount();
            for (let i=0; i<vertCount; i++)
            {
                let onePoint = spvmMatrix.MultiplyWith(onePiece.GetVertex(i).GetCopy(3)).Homogeneous();
                canvas2D.rect(onePoint.x, onePoint.y,1,1);
            }
        }
        else if (curveType == 'Line')
        {   //------------------------------------------------
            let vertCount = onePiece.GetVertexCount();
            for (let i=0; i<vertCount; i++)
            {
                let onePoint = spvmMatrix.MultiplyWith(onePiece.GetVertex(i)).Homogeneous();
                if (i%2 == 0) {canvas2D.moveTo(onePoint.x, onePoint.y);} else {canvas2D.lineTo(onePoint.x, onePoint.y);}
            }
        }
        else if (curveType == 'Polyline')
        {   //------------------------------------------------
            
            let pathStart;
            let vertCount = onePiece.GetVertexCount();
            for (let i=0; i<vertCount; i++)
            {   //Walk through all vertices in the computedArray and draw them as a polyline
                let oneVertex = spvmMatrix.MultiplyWith(onePiece.GetVertex(i)).Homogeneous();
                if (oneVertex.IsNaN()) {pathStart = void(0); continue;} //Terminator before the next segment
                if (pathStart === void(0)) {pathStart = oneVertex; canvas2D.moveTo(pathStart.x, pathStart.y); continue;}

                canvas2D.lineTo(oneVertex.x, oneVertex.y);
            }
        }
        
        //Stop here if this is a surface edge path
        if (MakeCurvePaths.arguments.length==2) {return;} //makeCurvePaths is also used by the makeSurfacePaths method which doesn't need the curve color computations 

        //SETUP the appearance of this curve path
        let defaultGlobalCrvProp = sceneDefaultAppearance.GetCurveProperties(); //At the scene level the scene appearance object is guaranteed to have default values
        let defaultScnobjCrvProp = currentObjAppearance.GetCurveProperties();   //At the sceneObject level there may or may not be a curveProperties object defined
        
        let defaultCrvColor      = (defaultScnobjCrvProp && defaultScnobjCrvProp.GetColor())? defaultScnobjCrvProp.GetColor() : defaultGlobalCrvProp.GetColor();
        let curveColor           = (onePieceProperties && onePieceProperties.GetColor())? onePieceProperties.GetColor() : defaultCrvColor; //onePieceProperties is void(0) if neither itself nor it's parent have their own pieceProperties
      
        let defaultCrvThickness  = (defaultScnobjCrvProp && defaultScnobjCrvProp.GetThickness()!==void(0))? defaultScnobjCrvProp.GetThickness() : defaultGlobalCrvProp.GetThickness();
        let curveThickness       = (onePieceProperties && onePieceProperties.GetThickness()!==void(0))? onePieceProperties.GetThickness() : defaultCrvThickness; 
        
        let defaultCrvDash       = (defaultScnobjCrvProp && defaultScnobjCrvProp.GetDashPattern())? defaultScnobjCrvProp.GetDashPattern() : defaultGlobalCrvProp.GetDashPattern();
        let curveDashPattern     = (onePieceProperties && onePieceProperties.GetDashPattern())? onePieceProperties.GetDashPattern() : (defaultCrvDash)? defaultCrvDash : []; //Dash pattern can still be empty even at the default scene appearance level

        let showEdges            = (curveColor.GetAlpha()==0)? false : true;

        //Set the stroke style (color), thickness, and dash pattern
        //Note: The curve style, thickness, and dash properties can be set before the call to beginPath(), as they are now
        canvas2D.strokeStyle = curveColor.GetCSScolor();
        canvas2D.lineWidth   = curveThickness;
        canvas2D.setLineDash (curveDashPattern); 
        
        return showEdges;
    }
    var MakeSurfacePaths = function (spvmMatrix,onePiece,onePieceProperties,currentObjAppearance,sceneDefaultAppearance)
    {   //Helper method for DrawOneSceneObject-->Draw
        //Draws a surface piece from inside the current sceneObject
        //Only planar surfaces derived from planar curves.
        //Note: With canvas 2d rendering context surfaces are actually boundary curve fills (polygon fills)
        
        //The default color at the sceneObject level for curves 
        let result               = {useFill:false,useStroke:false};
        let defaultGlobalSrfProp = sceneDefaultAppearance.GetMaterial(); //At the scene level the scene appearance object is guaranteed to have a default material
        let defaultScnobjSrfProp = currentObjAppearance.GetMaterial();   //At the sceneObject level there may or may not be a material assigned
        let defaultGlobalEdgProp = sceneDefaultAppearance.GetEdgeProperties(); //A TypeCurveProperties object
        let defaultScnobjEdgProp = currentObjAppearance.GetEdgeProperties();   //A TypeCurveProperties object
        
        let defaultSrfTexture    = (defaultScnobjSrfProp && defaultScnobjSrfProp.GetTexture())? defaultScnobjSrfProp.GetTexture() : defaultGlobalSrfProp.GetTexture();
        let srfTexture           = (onePieceProperties && onePieceProperties.GetTexture()) ? onePieceProperties.GetTexture() : defaultSrfTexture; //A TypeImage object
        
        let defaultSrfColor      = (defaultScnobjSrfProp && defaultScnobjSrfProp.GetColor())? defaultScnobjSrfProp.GetColor() : defaultGlobalSrfProp.GetColor();
        let srfColor             = (onePieceProperties && onePieceProperties.GetColor())? onePieceProperties.GetColor() : defaultSrfColor; //onePieceProperties is a TypeSurfaceProperties object
        
        let defaultEdgeColor     = (defaultScnobjEdgProp && defaultScnobjEdgProp.GetColor())? defaultScnobjEdgProp.GetColor() : defaultGlobalEdgProp.GetColor();
        let edgeColor            = (onePieceProperties && onePieceProperties.GetEdgeColor())? onePieceProperties.GetEdgeColor() : defaultEdgeColor;
   
        let defaultEdgThickness  = (defaultScnobjEdgProp && defaultScnobjEdgProp.GetThickness()!==void(0))? defaultScnobjEdgProp.GetThickness() : defaultGlobalEdgProp.GetThickness();
        let edgeThickness        = (onePieceProperties && onePieceProperties.GetEdgeThickness()!==void(0))? onePieceProperties.GetEdgeThickness() : defaultEdgThickness; 
        
        let defaultEdgDash       = (defaultScnobjEdgProp && defaultScnobjEdgProp.GetDashPattern())? defaultScnobjEdgProp.GetDashPattern() : defaultGlobalEdgProp.GetDashPattern();
        let edgeDashPattern      = (onePieceProperties && onePieceProperties.GetEdgeDash())? onePieceProperties.GetEdgeDash() : (defaultEdgDash)? defaultEdgDash : [];
        
        let boundaryCurves       = onePiece.GetBoundaryCurves();
        let bCurveCount          = boundaryCurves.length;
    
         
        let showFill             = (srfColor.GetAlpha()==0) ? false : true;
        let showEdges            = (edgeThickness==0 || edgeColor.GetAlpha()==0)? false : (currentObjAppearance.GetShowEdges()===void(0))? sceneDefaultAppearance.GetShowEdges() : currentObjAppearance.GetShowEdges();
   
        result                   = {useFill:showFill,useStroke:showEdges}; 
        if(!showFill && !showEdges) {return result;}
       
        //Set the surface fill color and edge properties
        canvas2D.fillStyle       = srfColor.GetCSScolor();
        canvas2D.strokeStyle     = edgeColor.GetCSScolor();
        canvas2D.lineWidth       = edgeThickness;
        canvas2D.setLineDash (edgeDashPattern); 

        //Handle a texture decal case
        if (bCurveCount==1 && boundaryCurves[0].GetType() == 'Rectangle' && boundaryCurves[0].GetVertex(2).w==0 && srfTexture) 
        {
            let vertices  = boundaryCurves[0].GetComputedVertArr();
            let pointLL   = spvmMatrix.MultiplyWith(vertices[0]).Homogeneous();
            let pointLR   = spvmMatrix.MultiplyWith(vertices[1]).Homogeneous();
            let pointTL   = spvmMatrix.MultiplyWith(vertices[3]).Homogeneous(); //Rectangles are generated right-handed by the curve object
            let vecLLtoTL = pointTL.Minus(pointLL);
            let vecLLtoLR = pointLR.Minus(pointLL);
            let height    = vecLLtoTL.Length();
            let width     = vecLLtoLR.Length();
            let angle     = vecLLtoLR.AngleXY(); //Counterclockwise angle on screen coordinates (which are inverted)
            canvas2D.translate(pointLL.x,pointLL.y);
            canvas2D.rotate(angle); //screen coordinates angle
            canvas2D.drawImage(srfTexture.GetImageObj(),0,-height,width,height); 
            canvas2D.setTransform(1,0,0,1,0,0); //same as canvas2D.resetTransform();
            result.useFill = false;
            return result; //No paths are being defined (the canvas2D.fill() will have no effect)
        }
 
        //Define fill-surface paths
        for (let i=0; i<bCurveCount; i++)
        {
            let oneBoundaryCurve = boundaryCurves[i];
            MakeCurvePaths (spvmMatrix,oneBoundaryCurve); //Only send two arguments (will prevent the MakeCurvePaths from computing appearance characteristics)
        }
        
        return result;
    }
    
    //PUBLIC methods
    this.IsLoaded       = function ()   {return isReady;}
    this.IsFailed       = function ()   {return isFailed;}
    this.IsStillLoading = function ()   {return !(isReady || isFailed);}
    this.GetContext     = function ()   {return canvas2D;}
    this.GetCanvasObj   = function ()   {return targetCanvas;}
    this.OperateCamera  = function ()   {}
    this.Draw = function (ignoreChangeFlag)
    {
        //Preliminary variables and checks
        if (!ignoreChangeFlag && lastModified.draw>sourceScene.GetMovementLastModified() && lastModified.draw>sourceScene.GetAnyLookLastModified()) {return;} //Nothing moved and nothing changed since last draw
        if (isFailed) {Say('WARNING: (Draw) TypeCanvas2Dpainter object is in a failed state',-1); return;} //Something went wrong during initialization
        if (!currentCamera.IsTopView()) {Say('WARNING: (Draw) Current camera is not in Top View',-1); return;}

        //Arrange all scene objects in Z-depth order 
        GenerateZdepthOrdering(); //Is checked repeatedly, but only acts if something in the scene has been edited
        
        let xyPlanarObjCount       = zOrderedObjArr.length; //if (xyPlanarObjCount==0) {Say('WARNING: (Draw) The scene has no 2D geometry to draw',-1);}
        let scrProjViewMatrix      = currentCamera.GetViewportMatrix().MultiplyWith(currentCamera.GetProjectionMatrix()).MultiplyWith(currentCamera.GetViewMatrix()); //Note: ViewportMatrix * ProjectionMatrix * ViewMatrix     
        let sceneDefaultAppearance = sourceScene.GetDefaultAppearance();

        //Clear screen
        if(useClearScreen) {ClearScreen();}
        canvas2D.save(); //Save the existing state of the canvas context
       
        for (let i=0; i<xyPlanarObjCount; i++)
        {   //Walk through the zOrderedObjArr

            //GENERAL portion -----------------------
            let currentSceneObject   = sourceScene.GetSceneObject(zOrderedObjArr[i]); //Say('drawing: '+currentSceneObject.name,-1); debugger;
            let currentObjAppearance = currentSceneObject.GetDefaultAppearance();
            let isVisible = currentObjAppearance.GetIsVisible(); if (isVisible===void(0)) {isVisible = sceneDefaultAppearance.GetIsVisible();}
            if (!isVisible) {continue;}
            
            let modelMatrix = currentSceneObject.GetKinematics().GetTmatrix();
            let spvmMatrix  = scrProjViewMatrix.MultiplyWith(modelMatrix); //Screen->projection->view->model transformation matrix
           
            //DRAWING portion -----------------------
            DrawOneSceneObject(spvmMatrix,currentSceneObject,currentObjAppearance,sceneDefaultAppearance);   
        }
        
        canvas2D.restore(); //Restore the canvas context to the state it was prior to this draw call
        lastModified.draw = Date.now();
        return true;
    }
    
    //Initialization
    Initialize(scene,canvasIdString,clearColor);
}
//---------------------------------------------------------------------------------------------------------------------------------------------------